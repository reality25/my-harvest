/**
 * Weather & Location Service
 * ──────────────────────────────────────────────────────────────────
 * Real-time weather + 7-day forecast + hourly breakdown using
 * Open-Meteo (https://open-meteo.com) — a free, key-less, reliable
 * forecast API. wttr.in is kept as a transparent fallback.
 *
 * Location resolution order (first non-empty wins):
 *   1. Manual override saved in localStorage (Settings page)
 *   2. Browser geolocation (with 5s hard timeout) + Open-Meteo
 *      reverse geocoding
 *   3. Authenticated user's profile.location (Supabase profile)
 *   4. Default ("Nairobi, Kenya")
 *
 * Caching:
 *   • Fresh:  30 min — used directly
 *   • Stale:  any cached value still served on network failure
 *             so the UI never falls back to fabricated/empty data.
 */

import { getCurrentUser } from "@/lib/dataService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ForecastDay {
  date:           string;       // ISO yyyy-mm-dd
  weekdayShort:   string;       // "Mon", "Tue", …
  tempMaxC:       number;
  tempMinC:       number;
  precipMm:       number;
  precipChance:   number;       // 0–100
  windKph:        number;
  uvIndexMax:     number;
  weatherCode:    number;
  description:    string;
}

export interface ForecastHour {
  iso:            string;
  hourLabel:      string;       // "13:00"
  tempC:          number;
  precipMm:       number;
  precipChance:   number;
  weatherCode:    number;
  description:    string;
}

export type WeatherAlertSeverity = "low" | "medium" | "high";
export type WeatherAlertKind =
  | "drought" | "flood" | "frost" | "heat-stress"
  | "high-wind" | "disease-conducive" | "high-uv";

export interface WeatherAlert {
  kind:        WeatherAlertKind;
  severity:    WeatherAlertSeverity;
  title:       string;
  message:     string;
  affectsDays: string[]; // ISO dates the alert covers
}

export interface WeatherContext {
  location:      string;
  county?:       string;
  country:       string;
  latitude?:     number;
  longitude?:    number;
  // Current
  temperature:   number;
  feelsLike:     number;
  humidity:      number;
  description:   string;
  rainMm:        number;
  windKph:       number;
  windDirection: string;
  uvIndex:       number;
  sunriseISO?:   string;
  sunsetISO?:    string;
  // Derived
  season:        string;
  // Forecast
  daily:         ForecastDay[];   // up to 7
  hourly:        ForecastHour[];  // next 24
  alerts:        WeatherAlert[];
  // Meta
  fetchedAt:     number;
  source:        "open-meteo" | "wttr" | "cache-stale";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_KEY  = "harvest_weather_ctx_v2";
const CACHE_TTL  = 30 * 60 * 1000; // 30 minutes
const DAY_NAMES  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Open-Meteo WMO weather code → human description
// (https://open-meteo.com/en/docs#weathervariables)
const WMO: Record<number, string> = {
  0: "Clear sky",         1: "Mainly clear",      2: "Partly cloudy",     3: "Overcast",
  45: "Fog",              48: "Depositing rime fog",
  51: "Light drizzle",    53: "Moderate drizzle", 55: "Dense drizzle",
  56: "Freezing drizzle", 57: "Freezing drizzle",
  61: "Slight rain",      63: "Moderate rain",    65: "Heavy rain",
  66: "Freezing rain",    67: "Freezing rain",
  71: "Slight snow fall", 73: "Moderate snow fall", 75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  85: "Slight snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm",     96: "Thunderstorm with hail", 99: "Thunderstorm with hail",
};

const wmoDesc = (code?: number) => (code != null ? WMO[code] ?? "Unknown" : "Unknown");

const DIR_LABELS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
function bearingToCompass(deg?: number): string {
  if (deg == null || isNaN(deg)) return "—";
  return DIR_LABELS[Math.round((deg % 360) / 22.5) % 16];
}

// ─── Season derivation ────────────────────────────────────────────────────────

function getKenyanSeason(month: number): string {
  if (month >= 3 && month <= 5)   return "long rains (March–May)";
  if (month >= 6 && month <= 9)   return "long dry season (June–September)";
  if (month >= 10 && month <= 12) return "short rains (October–December)";
  return "short dry season (January–February)";
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

interface CachedEntry { ctx: WeatherContext; expiresAt: number; }

function readCache(): CachedEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedEntry;
  } catch { return null; }
}

function getFreshCache(): WeatherContext | null {
  const c = readCache();
  if (!c) return null;
  return Date.now() <= c.expiresAt ? c.ctx : null;
}

function getStaleCache(): WeatherContext | null {
  const c = readCache();
  return c ? c.ctx : null;
}

function cacheWeather(ctx: WeatherContext): void {
  try {
    const entry: CachedEntry = { ctx, expiresAt: Date.now() + CACHE_TTL };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch { /* quota — non-fatal */ }
}

export function clearWeatherCache(): void {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* noop */ }
}

// ─── Location detection ───────────────────────────────────────────────────────

async function getBrowserCoordinates(): Promise<{ lat: number; lon: number } | null> {
  if (!navigator.geolocation) return null;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (v: { lat: number; lon: number } | null) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    const hardTimer = setTimeout(() => finish(null), 5_000);
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(hardTimer); finish({ lat: pos.coords.latitude, lon: pos.coords.longitude }); },
        () => { clearTimeout(hardTimer); finish(null); },
        { timeout: 4_000, maximumAge: 300_000 }
      );
    } catch {
      clearTimeout(hardTimer);
      finish(null);
    }
  });
}

interface OpenMeteoGeocode {
  results?: { name: string; admin1?: string; admin2?: string; country?: string;
              latitude: number; longitude: number }[];
}

/** Forward geocode a place name → lat/lon using Open-Meteo's free geocoder. */
async function geocodePlace(query: string): Promise<{
  lat: number; lon: number; city: string; admin1?: string; country: string
} | null> {
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6_000) });
    if (!res.ok) return null;
    const data = await res.json() as OpenMeteoGeocode;
    const r = data.results?.[0];
    if (!r) return null;
    return {
      lat: r.latitude, lon: r.longitude,
      city: r.name,
      admin1: r.admin1 ?? r.admin2,
      country: r.country ?? "Kenya",
    };
  } catch { return null; }
}

/** Reverse geocode lat/lon → place using OSM Nominatim (already used). */
async function reverseGeocode(lat: number, lon: number): Promise<{
  city: string; county?: string; country: string;
}> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: { "Accept-Language": "en", "User-Agent": "HarvestApp/1.0" },
        signal: AbortSignal.timeout(6_000),
      }
    );
    if (!res.ok) return { city: "Nairobi", country: "Kenya" };
    const data = await res.json() as {
      address?: {
        city?: string; town?: string; village?: string;
        county?: string; state?: string; country?: string;
      };
    };
    const addr = data.address ?? {};
    return {
      city:    addr.city || addr.town || addr.village || addr.county || "Nairobi",
      county:  addr.county || addr.state,
      country: addr.country || "Kenya",
    };
  } catch {
    return { city: "Nairobi", country: "Kenya" };
  }
}

// ─── Open-Meteo forecast fetch ────────────────────────────────────────────────

interface OpenMeteoResponse {
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
    sunrise: string[];
    sunset: string[];
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    precipitation_probability: number[];
    weather_code: number[];
  };
}

async function fetchOpenMeteo(lat: number, lon: number): Promise<OpenMeteoResponse | null> {
  try {
    const params = new URLSearchParams({
      latitude:  lat.toString(),
      longitude: lon.toString(),
      current:   "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,weather_code",
      daily:     "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset",
      hourly:    "temperature_2m,precipitation,precipitation_probability,weather_code",
      forecast_days: "7",
      timezone:  "auto",
      wind_speed_unit: "kmh",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return await res.json() as OpenMeteoResponse;
  } catch {
    return null;
  }
}

// ─── wttr.in fallback (already known to work) ─────────────────────────────────

interface WttrJson {
  current_condition?: {
    temp_C?: string; FeelsLikeC?: string; humidity?: string; precipMM?: string;
    windspeedKmph?: string; winddir16Point?: string; weatherCode?: string;
    weatherDesc?: { value: string }[];
  }[];
  weather?: {
    date?: string; maxtempC?: string; mintempC?: string; avgtempC?: string;
    sunHour?: string; uvIndex?: string;
    astronomy?: { sunrise?: string; sunset?: string }[];
    hourly?: {
      time?: string; tempC?: string; chanceofrain?: string; precipMM?: string;
      weatherDesc?: { value: string }[]; weatherCode?: string;
    }[];
  }[];
}

async function fetchWttr(query: string): Promise<WttrJson | null> {
  try {
    const res = await fetch(`https://wttr.in/${encodeURIComponent(query)}?format=j1`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    return await res.json() as WttrJson;
  } catch { return null; }
}

// ─── Builders: raw forecast → typed ───────────────────────────────────────────

function buildFromOpenMeteo(om: OpenMeteoResponse, place: {
  city: string; county?: string; country: string; lat: number; lon: number;
}): WeatherContext {
  const cur = om.current;
  const d   = om.daily;
  const h   = om.hourly;

  const daily: ForecastDay[] = [];
  if (d) {
    const n = Math.min(d.time.length, 7);
    for (let i = 0; i < n; i++) {
      const dt = new Date(d.time[i]);
      daily.push({
        date:         d.time[i],
        weekdayShort: DAY_NAMES[dt.getDay()],
        tempMaxC:     d.temperature_2m_max[i],
        tempMinC:     d.temperature_2m_min[i],
        precipMm:     d.precipitation_sum[i] ?? 0,
        precipChance: d.precipitation_probability_max[i] ?? 0,
        windKph:      d.wind_speed_10m_max[i] ?? 0,
        uvIndexMax:   d.uv_index_max[i] ?? 0,
        weatherCode:  d.weather_code[i],
        description:  wmoDesc(d.weather_code[i]),
      });
    }
  }

  const nowMs = Date.now();
  const hourly: ForecastHour[] = [];
  if (h) {
    for (let i = 0; i < h.time.length && hourly.length < 24; i++) {
      const t = new Date(h.time[i]).getTime();
      if (t < nowMs - 30 * 60 * 1000) continue; // skip past
      const dt = new Date(h.time[i]);
      hourly.push({
        iso:          h.time[i],
        hourLabel:    `${dt.getHours().toString().padStart(2, "0")}:00`,
        tempC:        h.temperature_2m[i],
        precipMm:     h.precipitation[i] ?? 0,
        precipChance: h.precipitation_probability[i] ?? 0,
        weatherCode:  h.weather_code[i],
        description:  wmoDesc(h.weather_code[i]),
      });
    }
  }

  const month = new Date().getMonth() + 1;
  const desc  = wmoDesc(cur?.weather_code);

  const ctx: WeatherContext = {
    location:      place.city,
    county:        place.county,
    country:       place.country,
    latitude:      place.lat,
    longitude:     place.lon,
    temperature:   cur?.temperature_2m       ?? daily[0]?.tempMaxC ?? 22,
    feelsLike:     cur?.apparent_temperature ?? daily[0]?.tempMaxC ?? 22,
    humidity:      cur?.relative_humidity_2m ?? 60,
    description:   desc,
    rainMm:        cur?.precipitation        ?? 0,
    windKph:       cur?.wind_speed_10m       ?? daily[0]?.windKph  ?? 0,
    windDirection: bearingToCompass(cur?.wind_direction_10m),
    uvIndex:       daily[0]?.uvIndexMax      ?? 0,
    sunriseISO:    d?.sunrise?.[0],
    sunsetISO:     d?.sunset?.[0],
    season:        getKenyanSeason(month),
    daily,
    hourly,
    alerts:        deriveWeatherAlerts(daily, hourly, cur?.relative_humidity_2m ?? 60),
    fetchedAt:     Date.now(),
    source:        "open-meteo",
  };
  return ctx;
}

function buildFromWttr(w: WttrJson, place: {
  city: string; county?: string; country: string; lat?: number; lon?: number;
}): WeatherContext {
  const c = w.current_condition?.[0];
  const days = w.weather ?? [];

  const daily: ForecastDay[] = days.slice(0, 7).map((d, idx) => {
    const dt = d.date ? new Date(d.date) : new Date(Date.now() + idx * 86400000);
    const hourlyArr = d.hourly ?? [];
    const rains = hourlyArr.map((h) => parseInt(h.chanceofrain ?? "0", 10) || 0);
    const winds = hourlyArr.map((h) => parseInt(h.weatherCode ?? "0", 10) || 0);
    void winds;
    const noon = hourlyArr[Math.min(4, Math.max(0, hourlyArr.length - 1))];
    return {
      date:         d.date ?? dt.toISOString().slice(0, 10),
      weekdayShort: DAY_NAMES[dt.getDay()],
      tempMaxC:     parseFloat(d.maxtempC ?? "") || 0,
      tempMinC:     parseFloat(d.mintempC ?? "") || 0,
      precipMm:     hourlyArr.reduce((sum, h) => sum + (parseFloat(h.precipMM ?? "0") || 0), 0),
      precipChance: rains.length ? Math.max(...rains) : 0,
      windKph:      parseInt(c?.windspeedKmph ?? "0", 10) || 0,
      uvIndexMax:   parseFloat(d.uvIndex ?? "") || 0,
      weatherCode:  parseInt(noon?.weatherCode ?? "0", 10) || 0,
      description:  noon?.weatherDesc?.[0]?.value ?? "Unknown",
    };
  });

  const hourly: ForecastHour[] = (days[0]?.hourly ?? []).slice(0, 8).map((h, idx) => {
    const dt = new Date();
    dt.setHours(idx * 3, 0, 0, 0);
    return {
      iso:          dt.toISOString(),
      hourLabel:    `${dt.getHours().toString().padStart(2, "0")}:00`,
      tempC:        parseFloat(h.tempC ?? "") || 0,
      precipMm:     parseFloat(h.precipMM ?? "0") || 0,
      precipChance: parseInt(h.chanceofrain ?? "0", 10) || 0,
      weatherCode:  parseInt(h.weatherCode ?? "0", 10) || 0,
      description:  h.weatherDesc?.[0]?.value ?? "Unknown",
    };
  });

  const month = new Date().getMonth() + 1;

  return {
    location:      place.city,
    county:        place.county,
    country:       place.country,
    latitude:      place.lat,
    longitude:     place.lon,
    temperature:   (parseFloat(c?.temp_C ?? "")     || daily[0]?.tempMaxC) ?? 22,
    feelsLike:     (parseFloat(c?.FeelsLikeC ?? "") || daily[0]?.tempMaxC) ?? 22,
    humidity:      parseInt(c?.humidity ?? "60")   || 60,
    description:   c?.weatherDesc?.[0]?.value      ?? "Partly cloudy",
    rainMm:        parseFloat(c?.precipMM ?? "")   || 0,
    windKph:       parseInt(c?.windspeedKmph ?? "0", 10) || 0,
    windDirection: c?.winddir16Point ?? "—",
    uvIndex:       daily[0]?.uvIndexMax            ?? 0,
    sunriseISO:    days[0]?.astronomy?.[0]?.sunrise,
    sunsetISO:     days[0]?.astronomy?.[0]?.sunset,
    season:        getKenyanSeason(month),
    daily,
    hourly,
    alerts:        deriveWeatherAlerts(daily, hourly, parseInt(c?.humidity ?? "60", 10) || 60),
    fetchedAt:     Date.now(),
    source:        "wttr",
  };
}

// ─── Alert derivation ─────────────────────────────────────────────────────────

/** Generate dynamic agricultural risk alerts from forecast data. */
export function deriveWeatherAlerts(
  daily: ForecastDay[],
  hourly: ForecastHour[],
  currentHumidity: number
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  if (daily.length === 0) return alerts;

  const next7Rain  = daily.reduce((s, d) => s + d.precipMm, 0);
  const wetDays    = daily.filter((d) => d.precipMm >= 5).length;
  const heavyDays  = daily.filter((d) => d.precipMm >= 25);
  const frostDays  = daily.filter((d) => d.tempMinC <= 2);
  const hotDays    = daily.filter((d) => d.tempMaxC >= 32);
  const windyDays  = daily.filter((d) => d.windKph >= 35);
  const highUvDays = daily.filter((d) => d.uvIndexMax >= 8);
  const next24Rain = hourly.slice(0, 24).reduce((s, h) => s + h.precipMm, 0);

  // Drought (dry stretch)
  if (next7Rain < 5 && wetDays === 0) {
    alerts.push({
      kind: "drought", severity: "medium",
      title: "Dry stretch ahead",
      message: `Less than 5mm of rain expected over the next 7 days. Plan irrigation, mulch beds, and prioritize drought-tolerant crops.`,
      affectsDays: daily.map((d) => d.date),
    });
  }

  // Flood / heavy rain
  if (heavyDays.length > 0) {
    alerts.push({
      kind: "flood", severity: heavyDays.length >= 2 ? "high" : "medium",
      title: heavyDays.length >= 2 ? "Heavy rain alert" : "Heavy rain expected",
      message: `${heavyDays.length} day(s) with ≥25mm rainfall forecast (${heavyDays.map((d) => d.weekdayShort).join(", ")}). Check drainage, postpone fertilizer top-dressing, and protect harvested produce.`,
      affectsDays: heavyDays.map((d) => d.date),
    });
  }

  // Frost (rare in Kenya but possible at altitude)
  if (frostDays.length > 0) {
    alerts.push({
      kind: "frost", severity: "high",
      title: "Frost risk",
      message: `Night temperatures dropping to ${Math.round(Math.min(...frostDays.map((d) => d.tempMinC)))}°C. Cover seedlings and tender crops (tomato, beans) before sunset.`,
      affectsDays: frostDays.map((d) => d.date),
    });
  }

  // Heat stress
  if (hotDays.length >= 2) {
    alerts.push({
      kind: "heat-stress", severity: hotDays.length >= 4 ? "high" : "medium",
      title: "Heat stress risk",
      message: `${hotDays.length} day(s) at or above 32°C. Provide shade and extra water for livestock; irrigate crops early morning or evening.`,
      affectsDays: hotDays.map((d) => d.date),
    });
  }

  // High wind (spraying / pollination risk)
  if (windyDays.length > 0) {
    alerts.push({
      kind: "high-wind", severity: "low",
      title: "Windy conditions",
      message: `Wind gusts up to ${Math.round(Math.max(...windyDays.map((d) => d.windKph)))} km/h forecast. Avoid spraying pesticides — drift risk.`,
      affectsDays: windyDays.map((d) => d.date),
    });
  }

  // Disease-conducive (sustained high humidity + warm temps)
  const warmHumid = daily.filter((d) => d.tempMaxC >= 22 && currentHumidity >= 80);
  if (warmHumid.length >= 2 && next24Rain > 0) {
    alerts.push({
      kind: "disease-conducive", severity: "medium",
      title: "Fungal disease risk",
      message: `Warm + humid + wet conditions favour blight, rust, and powdery mildew. Scout fields, improve airflow, apply preventive fungicide if needed.`,
      affectsDays: warmHumid.map((d) => d.date),
    });
  }

  // High UV
  if (highUvDays.length > 0) {
    alerts.push({
      kind: "high-uv", severity: "low",
      title: "High UV index",
      message: `UV index ${Math.round(Math.max(...highUvDays.map((d) => d.uvIndexMax)))}. Wear protection during midday field work.`,
      affectsDays: highUvDays.map((d) => d.date),
    });
  }

  // Sort by severity for display
  const order: Record<WeatherAlertSeverity, number> = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => order[a.severity] - order[b.severity]);
  return alerts;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve the user's current location preference, then fetch weather.
 * Never throws — falls back to last-known cached data if everything fails.
 */
export async function getWeatherContext(opts: { force?: boolean } = {}): Promise<WeatherContext | null> {
  if (!opts.force) {
    const fresh = getFreshCache();
    if (fresh) return fresh;
  }

  // 1. Resolve location
  let resolved: { city: string; county?: string; country: string; lat?: number; lon?: number } | null = null;

  // 1a. Manual override (Settings page)
  try {
    const raw = localStorage.getItem("harvest_manual_location_v1");
    if (raw) {
      const manual = JSON.parse(raw) as { country?: string; region?: string };
      if (manual?.region) {
        const geo = await geocodePlace(`${manual.region}, ${manual.country ?? ""}`.trim());
        if (geo) {
          resolved = { city: geo.city, county: geo.admin1, country: geo.country, lat: geo.lat, lon: geo.lon };
        } else {
          resolved = { city: manual.region, country: manual.country ?? "Kenya" };
        }
      }
    }
  } catch { /* ignore */ }

  // 1b. Browser geolocation
  if (!resolved) {
    const coords = await getBrowserCoordinates();
    if (coords) {
      const geo = await reverseGeocode(coords.lat, coords.lon);
      resolved = { city: geo.city, county: geo.county, country: geo.country, lat: coords.lat, lon: coords.lon };
    }
  }

  // 1c. Profile location (Supabase profile.location, e.g. "Kiambu")
  if (!resolved) {
    try {
      const u = getCurrentUser();
      if (u?.location?.trim()) {
        const geo = await geocodePlace(u.location);
        if (geo) {
          resolved = { city: geo.city, county: geo.admin1, country: geo.country, lat: geo.lat, lon: geo.lon };
        } else {
          resolved = { city: u.location, country: "Kenya" };
        }
      }
    } catch { /* ignore */ }
  }

  // 1d. Default
  if (!resolved) {
    resolved = { city: "Nairobi", country: "Kenya", lat: -1.2921, lon: 36.8219 };
  }

  // 2. Fetch forecast — Open-Meteo first (richer), wttr.in as fallback
  if (resolved.lat != null && resolved.lon != null) {
    const om = await fetchOpenMeteo(resolved.lat, resolved.lon);
    if (om?.current && om?.daily) {
      const ctx = buildFromOpenMeteo(om, {
        city: resolved.city, county: resolved.county, country: resolved.country,
        lat: resolved.lat, lon: resolved.lon,
      });
      cacheWeather(ctx);
      return ctx;
    }
  } else {
    // No coords yet — try to geocode the city first
    const geo = await geocodePlace(`${resolved.city}, ${resolved.country}`);
    if (geo) {
      const om = await fetchOpenMeteo(geo.lat, geo.lon);
      if (om?.current && om?.daily) {
        const ctx = buildFromOpenMeteo(om, {
          city: geo.city, county: geo.admin1, country: geo.country, lat: geo.lat, lon: geo.lon,
        });
        cacheWeather(ctx);
        return ctx;
      }
    }
  }

  // 3. wttr.in fallback
  const wttrQuery = resolved.lat != null && resolved.lon != null
    ? `${resolved.lat},${resolved.lon}`
    : `${resolved.city},${resolved.country}`;
  const w = await fetchWttr(wttrQuery);
  if (w?.current_condition?.length) {
    const ctx = buildFromWttr(w, resolved);
    cacheWeather(ctx);
    return ctx;
  }

  // 4. Network failure → serve stale cache rather than nothing
  const stale = getStaleCache();
  if (stale) {
    return { ...stale, source: "cache-stale" };
  }

  return null;
}

// ─── Prompt formatting (used by aiService) ────────────────────────────────────

/**
 * Build a concise weather-context string for AI prompt injection.
 * Includes current conditions, 3-day outlook, and any active alerts.
 */
export function weatherToPromptString(ctx: WeatherContext): string {
  const lines: string[] = [
    `Location: ${ctx.location}${ctx.county && ctx.county !== ctx.location ? `, ${ctx.county}` : ""}, ${ctx.country}`,
    `Now: ${Math.round(ctx.temperature)}°C (feels ${Math.round(ctx.feelsLike)}°C), ${ctx.description}, humidity ${ctx.humidity}%, wind ${Math.round(ctx.windKph)} km/h ${ctx.windDirection}`,
    `Season: ${ctx.season}`,
  ];
  if (ctx.uvIndex > 0) lines.push(`UV index: ${ctx.uvIndex.toFixed(1)}`);
  if (ctx.rainMm > 0)  lines.push(`Recent rainfall: ${ctx.rainMm}mm`);

  if (ctx.daily.length > 0) {
    const next3 = ctx.daily.slice(1, 4).map((d) =>
      `${d.weekdayShort} ${Math.round(d.tempMinC)}–${Math.round(d.tempMaxC)}°C ${d.precipChance}% rain`
    );
    lines.push(`3-day outlook: ${next3.join("; ")}`);
  }

  if (ctx.alerts.length > 0) {
    const alertLines = ctx.alerts.slice(0, 3).map((a) => `[${a.severity.toUpperCase()}] ${a.title}: ${a.message}`);
    lines.push(`Weather alerts:\n${alertLines.join("\n")}`);
  }

  return lines.join(". ");
}
