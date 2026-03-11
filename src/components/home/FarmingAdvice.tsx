import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const FarmingAdvice = () => {
  const tips = [
    {
      title: "Planting Window Open",
      text: "Light rains expected this week — ideal conditions for planting maize and beans. Prepare your seedbed now.",
      tag: "Crop Farming",
    },
    {
      title: "Livestock Hydration",
      text: "Temperatures rising to 26°C. Ensure cattle have access to clean water. Consider shade structures for dairy cows.",
      tag: "Livestock",
    },
  ];

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
      <div className="space-y-3">
        {tips.map((tip) => (
          <div key={tip.title} className="harvest-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
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
    </motion.div>
  );
};

export default FarmingAdvice;
