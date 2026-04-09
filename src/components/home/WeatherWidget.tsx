import { useEffect, useState } from "react";
import { Cloud, Droplets, Thermometer, Wind, RefreshCw, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchWeather, getWeatherInsights, conditionIcon, conditionLabel,
  type WeatherData, type WeatherInsight,
} from "@/services/weatherService";
import { useAuth } from "@/contexts/AuthContext";
import { log } from "@/services/systemLogger";

const CONDITION_GRADIENT: Record<string, string> = {
  sunny: "from-amber-500 to-orange-400",
  partly_cloudy: "from-primary to-primary/80",
  cloudy: "from-slate-500 to-slate-400",
  rainy: "from-blue-600 to-blue-500",
  stormy: "from-slate-700 to-slate-600",
  foggy: "from-slate-400 to-slate-300",
};

const INSIGHT_STYLES = {
  warning: "bg-red-500/25 text-red-50 border-red-400/40",
  info: "bg-white/15 text-white/90 border-white/20",
  tip: "bg-emerald-500/25 text-emerald-50 border-emerald-400/40",
};

export default function WeatherWidget() {
  const { user } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchWeather(user?.location);
      setWeather(data);
    } catch (err) {
      log("error", "WeatherWidget", "Failed to fetch weather", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.location]);

  const farmingTypes: string[] = user?.farmingActivities ?? [];
  const insights: WeatherInsight[] = weather ? getWeatherInsights(weather, farmingTypes) : [];
  const urgentInsights = insights.filter((i) => i.type === "warning");
  const gradient = weather ? (CONDITION_GRADIENT[weather.condition] ?? CONDITION_GRADIENT.partly_cloudy) : CONDITION_GRADIENT.partly_cloudy;

  if (loading) {
    return <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 animate-pulse h-44" />;
  }

  if (error || !weather) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-slate-500 to-slate-400 p-5 text-white">
        <div className="flex items-center gap-2 text-sm opacity-80">
          <AlertTriangle className="h-4 w-4" />
          <span>Weather unavailable — showing cached data.</span>
        </div>
        <button onClick={load} className="mt-2 text-xs underline opacity-70">Retry</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{weather.location}</p>
          <div className="mt-1 flex items-end gap-2">
            <span className="text-4xl font-bold">{weather.tempC}°C</span>
            <span className="mb-1 text-sm opacity-80">{conditionLabel(weather.condition)}</span>
          </div>
          {weather.source === "cached" && (
            <p className="text-[10px] opacity-60 mt-0.5">
              Cached · {new Date(weather.fetchedAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-3xl">{conditionIcon(weather.condition)}</span>
          <button onClick={load} className="rounded-full bg-white/20 p-1.5 hover:bg-white/30 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { icon: Thermometer, label: "Hi / Lo", value: `${weather.hi}° / ${weather.lo}°` },
          { icon: Droplets, label: "Humidity", value: `${weather.humidity}%` },
          { icon: Cloud, label: "Rain", value: `${weather.rainChancePct}%` },
          { icon: Wind, label: "Wind", value: `${weather.windKmh}km/h` },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1 rounded-lg bg-white/15 px-2 py-2">
            <Icon className="h-4 w-4" />
            <span className="text-[11px] font-semibold">{value}</span>
            <span className="text-[10px] opacity-70">{label}</span>
          </div>
        ))}
      </div>

      {weather.forecast.length > 0 && (
        <div className="mt-3 flex gap-4 overflow-x-auto pb-1">
          {weather.forecast.map((day) => (
            <div key={day.label} className="flex shrink-0 flex-col items-center gap-1">
              <span className="text-[10px] opacity-70">{day.label}</span>
              <span className="text-base">{conditionIcon(day.condition)}</span>
              <span className="text-[11px] font-semibold">{day.hi}°</span>
            </div>
          ))}
        </div>
      )}

      {urgentInsights.length > 0 && (
        <div className={`mt-3 rounded-xl border p-3 text-[12px] ${INSIGHT_STYLES.warning}`}>
          <p className="font-semibold">{urgentInsights[0].message}</p>
          {urgentInsights[0].action && <p className="mt-0.5 opacity-90">{urgentInsights[0].action}</p>}
        </div>
      )}

      {insights.length > 0 && (
        <>
          <button
            onClick={() => setShowInsights((s) => !s)}
            className="mt-3 flex items-center gap-1 text-[11px] opacity-80 hover:opacity-100"
          >
            <span>{showInsights ? "Hide" : "View"} farm insights ({insights.length})</span>
            {showInsights ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <AnimatePresence>
            {showInsights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2 overflow-hidden"
              >
                {insights.map((ins, i) => (
                  <div key={i} className={`rounded-xl border p-3 text-[12px] ${INSIGHT_STYLES[ins.type]}`}>
                    <p className="font-semibold">{ins.message}</p>
                    {ins.action && <p className="mt-0.5 opacity-90">{ins.action}</p>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
