import { Lightbulb, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface Tip {
  title: string;
  text: string;
  tag: string;
  action?: string;
  path?: string;
}

const ALL_TIPS: Record<string, Tip[]> = {
  crop: [
    {
      title: "Monitor Soil Moisture",
      text: "Check soil before irrigation — stick your finger 5cm deep. Irrigate only when soil feels dry at that depth.",
      tag: "Crops", action: "Log activity", path: "/farm",
    },
    {
      title: "Growth Stage Check",
      text: "Update your crop growth stages regularly for accurate AI advice and harvest forecasting.",
      tag: "Crops", action: "View records", path: "/farm",
    },
  ],
  livestock: [
    {
      title: "Daily Health Check",
      text: "Observe animals for signs of illness: reduced appetite, lethargy, unusual posture, or discharge. Early detection saves lives.",
      tag: "Livestock", action: "Log health", path: "/farm",
    },
    {
      title: "Water Intake Monitoring",
      text: "Adult cattle need 30–50L of clean water per day. Ensure troughs are clean and full, especially in hot weather.",
      tag: "Livestock",
    },
  ],
  poultry: [
    {
      title: "Biosecurity Reminder",
      text: "Disinfect footwear before entering poultry houses. Limit visitor access to prevent disease spread.",
      tag: "Poultry",
    },
    {
      title: "Egg Collection Schedule",
      text: "Collect eggs at least twice daily to maintain quality and prevent broodiness in layers.",
      tag: "Poultry", action: "Log activity", path: "/farm",
    },
  ],
  aquaculture: [
    {
      title: "Water Quality Check",
      text: "Test pH (6.5–8.5) and dissolved oxygen (>5mg/L) daily. Poor water quality is the #1 cause of fish mortality.",
      tag: "Aquaculture",
    },
  ],
  beekeeping: [
    {
      title: "Hive Inspection Due",
      text: "Inspect hives every 7–10 days during active season. Check for queen presence, brood pattern, and signs of pests.",
      tag: "Beekeeping",
    },
  ],
  default: [
    {
      title: "Record Keeping Matters",
      text: "Farms with detailed records earn 20% more on average. Log activities, costs, and yields consistently.",
      tag: "General", action: "Add record", path: "/farm",
    },
    {
      title: "Connect with Experts",
      text: "Post questions in the community to get advice from verified agricultural experts and experienced farmers.",
      tag: "General", action: "Community", path: "/community",
    },
  ],
};

const month = new Date().getMonth();
const SEASONAL_TIP: Tip | null = month >= 2 && month <= 4
  ? { title: "Long Rains Season", text: "March–May is Kenya's long rains season. Ideal time for maize, beans, and vegetables. Prepare seedbeds and planting inputs now.", tag: "Seasonal" }
  : month >= 9 && month <= 11
  ? { title: "Short Rains Season", text: "October–December short rains: good for fast-maturing crops like beans and some vegetable varieties.", tag: "Seasonal" }
  : null;

export default function FarmingAdvice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const farmTypes = user?.farmingActivities ?? [];

  const tips: Tip[] = [];
  if (SEASONAL_TIP) tips.push(SEASONAL_TIP);
  for (const t of farmTypes) {
    if (ALL_TIPS[t]) tips.push(...ALL_TIPS[t].slice(0, 1));
  }
  if (tips.length < 2) tips.push(...ALL_TIPS.default);
  const displayed = tips.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
          <Lightbulb className="h-4 w-4 text-amber-600" />
        </div>
        <h2 className="harvest-section-title">Farming Insights</h2>
      </div>
      <div className="space-y-3">
        {displayed.map((tip) => (
          <div key={tip.title} className="harvest-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{tip.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{tip.text}</p>
                {tip.action && tip.path && (
                  <button
                    onClick={() => navigate(tip.path!)}
                    className="mt-2 flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    {tip.action} <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                {tip.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
