import {
  Cloud, CloudRain, Droplets, Sun, Thermometer, Wind, Loader2,
  MapPin, RefreshCw, AlertTriangle, Sunrise, Sunset, Gauge,
} from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWeatherContext, clearWeatherCache,
  type WeatherContext, type WeatherAlertSeverity,
} from "@/services/weatherService";

function pickWeatherIcon(description: string) {
  const d = description.toLowerCase();
  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower") || d.includes("thunder")) return CloudRain;
  if (d.includes("cloud") || d.includes("overcast") || d.includes("fog")) return Cloud;
  return Sun;
}

const SEVERITY_BADGE: Record<WeatherAlertSeverity, string> = {
  high:   "bg-red-500/30 text-red-50 ring-1 ring-red-200/40",
  medium: "bg-amber-400/30 text-amber-50 ring-1 ring-amber-200/40",
  low:    "bg-white/15 text-white ring-1 ring-white/20",
};

function formatHHmm(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch { return "—"; }
}

const WeatherWidget = () => {
  const navigate = useNavigate();
  const [ctx, setCtx]         = useState<WeatherContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHourly, setShowHourly] = useState(false);

  const load = useCallback(async (force = false) => {
    if (force) {
      setRefreshing(true);
      clearWeatherCache();
    } else {
      setLoading(true);
    }
    try {
      const w = await getWeatherContext({ force });
      setCtx(w);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const handler = () => load(true);
    window.addEventListener("harvest:location-changed", handler);
    return () => window.removeEventListener("harvest:location-changed", handler);
  }, [load]);

  if (loading && !ctx) {
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
        <button
          onClick={() => navigate("/settings")}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/30"
        >
          <MapPin className="h-3.5 w-3.5" /> Set location
        </button>
      </div>
    );
  }

  const CurrentIcon = pickWeatherIcon(ctx.description);
  const today       = ctx.daily[0];
  const next7       = ctx.daily.slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="harvest-gradient rounded-2xl p-5 text-primary-foreground"
    >
      {/* Header: location chip + refresh */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          onClick={() => navigate("/settings")}
          className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25 min-w-0"
          title="Change location"
        >
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[200px]">
            {ctx.location}
            {ctx.county && ctx.county !== ctx.location ? `, ${ctx.county}` : ""}
            {ctx.country ? `, ${ctx.country}` : ""}
          </span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          {ctx.source === "cache-stale" && (
            <span className="rounded-full bg-amber-400/30 px-2 py-0.5 text-[10px] font-medium ring-1 ring-amber-200/40">
              Offline
            </span>
          )}
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            aria-label="Refresh weather"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Current temperature */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-end gap-2">
            <span className="font-display text-5xl font-bold leading-none">{Math.round(ctx.temperature)}°</span>
            <span className="mb-1 text-sm opacity-90 truncate max-w-[160px]">{ctx.description}</span>
          </div>
          <p className="mt-1 text-xs opacity-80">
            Feels like {Math.round(ctx.feelsLike)}° · {ctx.season}
          </p>
        </div>
        <CurrentIcon className="h-14 w-14 opacity-90 shrink-0" />
      </div>

      {/* Stat grid: Hi/Lo · Humidity · Rain · Wind */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Thermometer className="h-4 w-4" />
          <span className="text-[11px] font-medium">
            {today ? `${Math.round(today.tempMaxC)}° / ${Math.round(today.tempMinC)}°` : `${Math.round(ctx.feelsLike)}°`}
          </span>
          <span className="text-[10px] opacity-70">Hi / Lo</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Droplets className="h-4 w-4" />
          <span className="text-[11px] font-medium">{ctx.humidity}%</span>
          <span className="text-[10px] opacity-70">Humidity</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Cloud className="h-4 w-4" />
          <span className="text-[11px] font-medium">{today ? `${today.precipChance}%` : `${ctx.rainMm}mm`}</span>
          <span className="text-[10px] opacity-70">Rain</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
          <Wind className="h-4 w-4" />
          <span className="text-[11px] font-medium">{Math.round(ctx.windKph)} km/h</span>
          <span className="text-[10px] opacity-70">{ctx.windDirection}</span>
        </div>
      </div>

      {/* Sun / UV row */}
      {(ctx.sunriseISO || ctx.sunsetISO || ctx.uvIndex > 0) && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-white/10 px-3 py-2 text-[11px]">
          <span className="flex items-center gap-1.5"><Sunrise className="h-3.5 w-3.5" /> {formatHHmm(ctx.sunriseISO)}</span>
          <span className="flex items-center gap-1.5"><Sunset className="h-3.5 w-3.5" /> {formatHHmm(ctx.sunsetISO)}</span>
          <span className="flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5" /> UV {ctx.uvIndex.toFixed(1)}</span>
        </div>
      )}

      {/* Active alerts */}
      {ctx.alerts.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {ctx.alerts.slice(0, 3).map((a, i) => (
            <div
              key={`${a.kind}-${i}`}
              className={`flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[11px] ${SEVERITY_BADGE[a.severity]}`}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold">{a.title}</p>
                <p className="opacity-90 leading-snug">{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7-day forecast */}
      {next7.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold opacity-90">7-day forecast</span>
            <button
              onClick={() => setShowHourly((s) => !s)}
              className="text-[10px] font-medium opacity-80 hover:opacity-100 underline-offset-2 hover:underline"
            >
              {showHourly ? "Hide hourly" : "Show hourly"}
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1">
            {next7.map((day, i) => {
              const Icon = pickWeatherIcon(day.description);
              return (
                <div key={`${day.date}-${i}`} className="flex flex-col items-center gap-1 shrink-0 min-w-[42px]">
                  <span className="text-[10px] opacity-70">{i === 0 ? "Today" : day.weekdayShort}</span>
                  <Icon className="h-4 w-4 opacity-90" />
                  <span className="text-[11px] font-medium">{Math.round(day.tempMaxC)}°</span>
                  <span className="text-[10px] opacity-60">{Math.round(day.tempMinC)}°</span>
                  {day.precipChance >= 30 && (
                    <span className="text-[9px] opacity-80">{day.precipChance}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly (next 24h) — collapsible */}
      {showHourly && ctx.hourly.length > 0 && (
        <div className="mt-3 border-t border-white/15 pt-3">
          <span className="text-[11px] font-semibold opacity-90">Next 24 hours</span>
          <div className="mt-2 flex gap-3 overflow-x-auto -mx-1 px-1 pb-1">
            {ctx.hourly.map((h, i) => {
              const Icon = pickWeatherIcon(h.description);
              return (
                <div key={`${h.iso}-${i}`} className="flex flex-col items-center gap-1 shrink-0 min-w-[44px]">
                  <span className="text-[10px] opacity-70">{h.hourLabel}</span>
                  <Icon className="h-4 w-4 opacity-90" />
                  <span className="text-[11px] font-medium">{Math.round(h.tempC)}°</span>
                  {h.precipChance >= 20 && (
                    <span className="text-[9px] opacity-80">{h.precipChance}%</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WeatherWidget;
