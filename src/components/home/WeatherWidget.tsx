import { Cloud, CloudRain, Droplets, Sun, Thermometer, Wind, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getWeatherContext, type WeatherContext } from "@/services/weatherService";

interface ForecastDay {
  day: string;
  temp: number;
  description: string;
}

interface WttrJson {
  current_condition?: { winddir16Point?: string; windspeedKmph?: string }[];
  weather?: {
    date?: string;
    maxtempC?: string;
    mintempC?: string;
    avgtempC?: string;
    hourly?: { weatherDesc?: { value: string }[]; chanceofrain?: string }[];
  }[];
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pickWeatherIcon(description: string) {
  const d = description.toLowerCase();
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) return CloudRain;
  if (d.includes("cloud") || d.includes("overcast")) return Cloud;
  return Sun;
}

const WeatherWidget = () => {
  const [ctx, setCtx] = useState<WeatherContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [extras, setExtras] = useState<{ rainChance: number; windKmh: number; hi: number; lo: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const weather = await getWeatherContext().catch(() => null);
      if (cancelled) return;
      setCtx(weather);
      setLoading(false);

      if (!weather) return;

      // Best-effort fetch of multi-day forecast + wind from wttr.in
      const locationQuery = `${weather.location},${weather.country}`;
      try {
        const res = await fetch(`https://wttr.in/${encodeURIComponent(locationQuery)}?format=j1`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const data = (await res.json()) as WttrJson;
        if (cancelled) return;

        const current = data.current_condition?.[0];
        const today = data.weather?.[0];
        const hourly = today?.hourly ?? [];
        const rainChances = hourly
          .map((h) => parseInt(h.chanceofrain ?? "0", 10))
          .filter((n) => !isNaN(n));
        const maxRain = rainChances.length ? Math.max(...rainChances) : 0;

        setExtras({
          rainChance: maxRain,
          windKmh: parseInt(current?.windspeedKmph ?? "0", 10) || 0,
          hi: parseInt(today?.maxtempC ?? "") || weather.temperature,
          lo: parseInt(today?.mintempC ?? "") || weather.temperature,
        });

        const days: ForecastDay[] = (data.weather ?? []).slice(0, 5).map((d, idx) => {
          const dt = d.date ? new Date(d.date) : new Date(Date.now() + idx * 86400000);
          const noonHour = d.hourly?.[Math.min(4, (d.hourly?.length ?? 1) - 1)];
          const desc = noonHour?.weatherDesc?.[0]?.value ?? weather.description;
          return {
            day: DAY_NAMES[dt.getDay()],
            temp: parseInt(d.avgtempC ?? "") || weather.temperature,
            description: desc,
          };
        });
        setForecast(days);
      } catch {
        /* non-fatal */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="harvest-gradient rounded-2xl p-5 text-primary-foreground flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin opacity-70" />
      </div>
    );
  }

  if (!ctx) {
    return (
      <div className="harvest-gradient rounded-2xl p-5 text-primary-foreground">
        <p className="text-sm font-medium opacity-90">Weather unavailable</p>
        <p className="text-xs opacity-80 mt-1">Allow location access or set your region in Settings to see live weather.</p>
      </div>
    );
  }

  const CurrentIcon = pickWeatherIcon(ctx.description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="harvest-gradient rounded-2xl p-5 text-primary-foreground"
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium opacity-90 truncate">
            {ctx.location}
            {ctx.county && ctx.county !== ctx.location ? `, ${ctx.county}` : ""}
            {ctx.country ? `, ${ctx.country}` : ""}
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-display text-4xl font-bold">{Math.round(ctx.temperature)}°</span>
            <span className="mb-1 text-sm opacity-80 truncate max-w-[140px]">{ctx.description}</span>
          </div>
        </div>
        <CurrentIcon className="h-12 w-12 opacity-90 shrink-0" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Thermometer className="h-4 w-4" />
          <span className="text-[11px] font-medium">
            {extras ? `${Math.round(extras.hi)}° / ${Math.round(extras.lo)}°` : `${Math.round(ctx.feelsLike)}°`}
          </span>
          <span className="text-[10px] opacity-70">{extras ? "Hi / Lo" : "Feels like"}</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Droplets className="h-4 w-4" />
          <span className="text-[11px] font-medium">{ctx.humidity}%</span>
          <span className="text-[10px] opacity-70">Humidity</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Cloud className="h-4 w-4" />
          <span className="text-[11px] font-medium">{extras ? `${extras.rainChance}%` : `${ctx.rainMm}mm`}</span>
          <span className="text-[10px] opacity-70">{extras ? "Rain" : "Rainfall"}</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Wind className="h-4 w-4" />
          <span className="text-[11px] font-medium">{extras ? `${extras.windKmh} km/h` : ctx.season.split(" ")[0]}</span>
          <span className="text-[10px] opacity-70">{extras ? "Wind" : "Season"}</span>
        </div>
      </div>

      {forecast.length > 0 && (
        <div className="mt-3 flex gap-4 overflow-x-auto pt-1">
          {forecast.map((day, i) => {
            const Icon = pickWeatherIcon(day.description);
            return (
              <div key={`${day.day}-${i}`} className="flex flex-col items-center gap-1 shrink-0">
                <span className="text-[10px] opacity-70">{day.day}</span>
                <Icon className="h-4 w-4 opacity-80" />
                <span className="text-[11px] font-medium">{Math.round(day.temp)}°</span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default WeatherWidget;
