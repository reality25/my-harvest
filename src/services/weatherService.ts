/**
 * Weather Intelligence Service
 * Pluggable structure — swap MOCK_WEATHER with a real API call.
 * Falls back to cached data on failure; never shows a blank screen.
 */

const CACHE_KEY = "harvest_weather_cache";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

export interface WeatherData {
  location: string;
  tempC: number;
  feelsLike: number;
  hi: number;
  lo: number;
  humidity: number;
  rainChancePct: number;
  windKmh: number;
  condition: "sunny" | "partly_cloudy" | "cloudy" | "rainy" | "stormy" | "foggy";
  forecast: ForecastDay[];
  fetchedAt: number;
  source: "live" | "cached" | "mock";
}

export interface ForecastDay {
  label: string;
  condition: WeatherData["condition"];
  hi: number;
  lo: number;
  rainChancePct: number;
}

export interface WeatherInsight {
  type: "warning" | "info" | "tip";
  message: string;
  action?: string;
}

const CONDITIONS: WeatherData["condition"][] = [
  "sunny", "partly_cloudy", "cloudy", "rainy", "partly_cloudy",
];

function dayLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-KE", { weekday: "short" });
}

function buildMockWeather(location: string): WeatherData {
  const month = new Date().getMonth(); // 0-indexed
  const isLongRains = month >= 2 && month <= 4;
  const isShortRains = month >= 9 && month <= 11;
  const isRainySeason = isLongRains || isShortRains;

  const base = isRainySeason
    ? { temp: 19, hi: 22, lo: 15, rain: 70, humidity: 78, condition: "rainy" as const }
    : { temp: 25, hi: 28, lo: 17, rain: 20, humidity: 55, condition: "partly_cloudy" as const };

  return {
    location,
    tempC: base.temp,
    feelsLike: base.temp - 2,
    hi: base.hi,
    lo: base.lo,
    humidity: base.humidity,
    rainChancePct: base.rain,
    windKmh: 12,
    condition: base.condition,
    forecast: [1, 2, 3, 4, 5].map((i) => ({
      label: dayLabel(i),
      condition: CONDITIONS[(i + (isRainySeason ? 1 : 0)) % CONDITIONS.length],
      hi: base.hi + (i % 2 === 0 ? 1 : -1),
      lo: base.lo + (i % 3 === 0 ? 1 : 0),
      rainChancePct: isRainySeason ? Math.min(base.rain + i * 5, 95) : Math.max(base.rain - i * 3, 5),
    })),
    fetchedAt: Date.now(),
    source: "mock",
  };
}

function saveCache(data: WeatherData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

function loadCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const d: WeatherData = JSON.parse(raw);
    if (Date.now() - d.fetchedAt > CACHE_TTL_MS) return null;
    return { ...d, source: "cached" };
  } catch {
    return null;
  }
}

export async function fetchWeather(userLocation?: string): Promise<WeatherData> {
  const location = userLocation || "Nairobi, Kenya";
  const cached = loadCache();
  if (cached) return cached;

  const apiEndpoint = import.meta.env.VITE_WEATHER_API_URL;
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

  if (apiEndpoint && apiKey) {
    try {
      const res = await fetch(
        `${apiEndpoint}?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const raw = await res.json();
        const data: WeatherData = mapApiResponse(raw, location);
        saveCache(data);
        return data;
      }
    } catch {
      // fall through to mock
    }
  }

  const mock = buildMockWeather(location);
  saveCache(mock);
  return mock;
}

function mapApiResponse(raw: Record<string, unknown>, location: string): WeatherData {
  const main = raw.main as Record<string, number>;
  const weather = (raw.weather as { main: string }[])[0];
  const wind = raw.wind as { speed: number };
  const condMap: Record<string, WeatherData["condition"]> = {
    Clear: "sunny", Clouds: "partly_cloudy", Rain: "rainy",
    Drizzle: "rainy", Thunderstorm: "stormy", Fog: "foggy", Mist: "foggy",
  };
  return {
    location,
    tempC: Math.round(main.temp),
    feelsLike: Math.round(main.feels_like),
    hi: Math.round(main.temp_max),
    lo: Math.round(main.temp_min),
    humidity: main.humidity,
    rainChancePct: 0,
    windKmh: Math.round((wind?.speed ?? 0) * 3.6),
    condition: condMap[weather?.main] ?? "partly_cloudy",
    forecast: [],
    fetchedAt: Date.now(),
    source: "live",
  };
}

export function getWeatherInsights(weather: WeatherData, farmingTypes: string[]): WeatherInsight[] {
  const insights: WeatherInsight[] = [];
  const { rainChancePct, humidity, tempC, windKmh, condition } = weather;

  if (rainChancePct > 70) {
    insights.push({
      type: "warning",
      message: "High chance of rain today.",
      action: "Delay or cancel any irrigation scheduled for today.",
    });
  }

  if (condition === "rainy" || condition === "stormy") {
    if (farmingTypes.includes("crop") || farmingTypes.includes("fruit")) {
      insights.push({
        type: "warning",
        message: "Wet conditions increase fungal disease risk.",
        action: "Inspect crops for blight or mildew. Consider preventive fungicide.",
      });
    }
    insights.push({
      type: "info",
      message: "Good day for indoor farm tasks — record keeping, equipment maintenance.",
    });
  }

  if (condition === "sunny" && humidity < 40) {
    insights.push({
      type: "tip",
      message: "Low humidity and high sun — crops may need extra water.",
      action: "Check soil moisture levels; irrigate in early morning.",
    });
  }

  if (tempC > 30) {
    if (farmingTypes.includes("livestock") || farmingTypes.includes("poultry")) {
      insights.push({
        type: "warning",
        message: "High temperature — heat stress risk for animals.",
        action: "Ensure shade and clean water are available. Avoid moving livestock midday.",
      });
    }
  }

  if (windKmh > 30) {
    insights.push({
      type: "warning",
      message: "Strong winds forecast.",
      action: "Avoid pesticide spraying today — wind causes drift.",
    });
  }

  if (humidity > 80 && condition !== "rainy") {
    insights.push({
      type: "info",
      message: "High humidity — monitor for fungal issues in crops.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "tip",
      message: "Good weather conditions for most farm activities today.",
    });
  }

  return insights;
}

export function conditionIcon(condition: WeatherData["condition"]): string {
  const map: Record<WeatherData["condition"], string> = {
    sunny: "☀️",
    partly_cloudy: "⛅",
    cloudy: "☁️",
    rainy: "🌧️",
    stormy: "⛈️",
    foggy: "🌫️",
  };
  return map[condition] ?? "🌤️";
}

export function conditionLabel(condition: WeatherData["condition"]): string {
  return condition.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}
