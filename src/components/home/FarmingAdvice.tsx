import { Lightbulb, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getWeatherContext, type WeatherContext, type ForecastDay } from "@/services/weatherService";
import { useAuth } from "@/contexts/AuthContext";

interface AdviceTip {
  id:    string;
  title: string;
  text:  string;
  tag:   string;
}

/**
 * Derive practical, weather-aware farming tips from the live forecast and
 * the farmer's actual activities. NO hardcoded tips — everything is computed
 * from real data; if the weather can't be fetched the section is hidden.
 */
function deriveAdvice(ctx: WeatherContext, activities: string[]): AdviceTip[] {
  const tips: AdviceTip[] = [];
  const acts = activities.map((a) => a.toLowerCase());
  const has = (...keys: string[]) => acts.some((a) => keys.some((k) => a.includes(k)));
  const next3: ForecastDay[] = ctx.daily.slice(0, 3);
  const next24Rain = ctx.hourly.slice(0, 24).reduce((s, h) => s + h.precipMm, 0);
  const next24RainChance = Math.max(0, ...ctx.hourly.slice(0, 24).map((h) => h.precipChance));
  const tomorrow = ctx.daily[1];

  // Spray window — calm wind + no rain in next 24h + low UV expected
  const dryNext24 = next24Rain < 1 && next24RainChance < 30;
  if (dryNext24 && ctx.windKph < 15) {
    tips.push({
      id: "spray",
      title: "Good spraying window",
      text: `Calm wind (${Math.round(ctx.windKph)} km/h ${ctx.windDirection}) and dry conditions for the next 24 hours. Apply pesticides or foliar feeds early morning before temperatures peak.`,
      tag: has("crop", "vegetable", "fruit", "maize", "tomato") ? "Crop spraying" : "Spraying",
    });
  } else if (ctx.windKph >= 25) {
    tips.push({
      id: "spray-postpone",
      title: "Postpone spraying",
      text: `Wind at ${Math.round(ctx.windKph)} km/h will cause heavy chemical drift. Wait until winds drop below 15 km/h.`,
      tag: "Spraying",
    });
  }

  // Planting / sowing — ideal when light-to-moderate rain forecast next 3 days
  const totalRain3 = next3.reduce((s, d) => s + d.precipMm, 0);
  const wetDays3   = next3.filter((d) => d.precipMm >= 5 && d.precipMm < 25).length;
  if (wetDays3 >= 2 && totalRain3 < 80 && has("crop", "maize", "bean", "vegetable", "planting")) {
    tips.push({
      id: "plant",
      title: "Planting window opening",
      text: `${wetDays3} day(s) of moderate rain expected (about ${Math.round(totalRain3)}mm total). Prepare seedbeds now — ideal conditions for maize, beans, or vegetables.`,
      tag: "Planting",
    });
  }

  // Heavy rain warning — postpone fertilizer top-dressing
  const heavyDay = next3.find((d) => d.precipMm >= 25);
  if (heavyDay && has("crop", "maize", "vegetable", "fertilizer")) {
    tips.push({
      id: "fert-delay",
      title: "Delay fertilizer top-dressing",
      text: `Heavy rain (${Math.round(heavyDay.precipMm)}mm) expected ${heavyDay.weekdayShort}. Top-dressing now will leach nutrients. Apply after the system passes.`,
      tag: "Fertilizer",
    });
  }

  // Irrigation — hot + low rain forecast
  const hotDay = next3.find((d) => d.tempMaxC >= 30);
  if (hotDay && totalRain3 < 5) {
    tips.push({
      id: "irrigate",
      title: "Schedule irrigation",
      text: `Highs near ${Math.round(hotDay.tempMaxC)}°C and very little rain expected. Water crops at dawn or after sunset; mulch beds to retain moisture.`,
      tag: has("vegetable", "crop", "tomato") ? "Crop care" : "Irrigation",
    });
  }

  // Livestock — heat or cold stress
  if (hotDay && has("livestock", "dairy", "cattle", "poultry", "chicken", "goat", "sheep")) {
    tips.push({
      id: "livestock-heat",
      title: "Livestock heat care",
      text: `Temperatures up to ${Math.round(hotDay.tempMaxC)}°C ${hotDay.weekdayShort}. Provide shade, increase clean water supply, and check ventilation in poultry houses.`,
      tag: "Livestock",
    });
  }
  const coldNight = next3.find((d) => d.tempMinC <= 8);
  if (coldNight && has("poultry", "chicken", "livestock")) {
    tips.push({
      id: "livestock-cold",
      title: "Cold-night protection",
      text: `Night lows around ${Math.round(coldNight.tempMinC)}°C ${coldNight.weekdayShort}. Add bedding and close drafts in poultry/calf houses.`,
      tag: "Livestock",
    });
  }

  // Aquaculture — heavy rain can disturb pond chemistry
  if (heavyDay && has("aquaculture", "fish", "tilapia", "pond")) {
    tips.push({
      id: "aqua-rain",
      title: "Check pond after heavy rain",
      text: `Expect ${Math.round(heavyDay.precipMm)}mm rain ${heavyDay.weekdayShort}. Inspect pond inflow/outflow, check pH and dissolved-oxygen the morning after.`,
      tag: "Aquaculture",
    });
  }

  // Bees — keep hives sheltered if windy or rainy
  const windy = next3.find((d) => d.windKph >= 30);
  if ((heavyDay || windy) && has("bee", "beekeep", "honey", "apiculture")) {
    tips.push({
      id: "bee-shelter",
      title: "Secure beehives",
      text: `Strong wind${heavyDay ? " and heavy rain" : ""} expected. Anchor hive lids, reduce entrance, and avoid inspections this week.`,
      tag: "Beekeeping",
    });
  }

  // Disease pressure — already in alerts; surface a tip if relevant to crops
  const diseaseAlert = ctx.alerts.find((a) => a.kind === "disease-conducive");
  if (diseaseAlert && has("crop", "tomato", "potato", "vegetable", "maize")) {
    tips.push({
      id: "disease-scout",
      title: "Scout for fungal disease",
      text: diseaseAlert.message,
      tag: "Crop care",
    });
  }

  // Harvest window — dry stretch is good for harvest/drying
  const drySoon = next3.every((d) => d.precipMm < 2);
  if (drySoon && has("maize", "bean", "harvest", "grain", "cereal")) {
    tips.push({
      id: "harvest",
      title: "Good harvest & drying window",
      text: `Dry weather forecast for the next 3 days. Plan harvest of mature crops and lay produce out to dry while sun is steady.`,
      tag: "Harvesting",
    });
  }

  // Generic-but-personalized fallback for the next sunny/cool day
  if (tips.length === 0 && tomorrow) {
    tips.push({
      id: "general",
      title: `${tomorrow.weekdayShort}: ${tomorrow.description.toLowerCase()}`,
      text: `Tomorrow ${Math.round(tomorrow.tempMinC)}–${Math.round(tomorrow.tempMaxC)}°C, ${tomorrow.precipChance}% rain chance. Plan field work around midday heat and protect young plants.`,
      tag: "Daily plan",
    });
  }

  return tips.slice(0, 3);
}

const FarmingAdvice = () => {
  const { user } = useAuth();
  const [tips, setTips] = useState<AdviceTip[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ctx = await getWeatherContext().catch(() => null);
      if (cancelled) return;
      if (!ctx) {
        setTips([]);
      } else {
        setTips(deriveAdvice(ctx, user?.farmingActivities ?? []));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.farmingActivities]);

  // Hide section entirely if weather is unavailable AND we have nothing to say
  if (!loading && (!tips || tips.length === 0)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-harvest-gold-100">
          <Lightbulb className="h-4 w-4 text-harvest-gold-500" />
        </div>
        <h2 className="harvest-section-title">AI Farming Advice</h2>
      </div>

      {loading ? (
        <div className="harvest-card flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-3">
          {tips!.map((tip) => (
            <div key={tip.id} className="harvest-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{tip.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  {tip.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FarmingAdvice;
