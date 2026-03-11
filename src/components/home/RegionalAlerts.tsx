import { AlertTriangle, Bug, CloudRain } from "lucide-react";
import { motion } from "framer-motion";

const alerts = [
  {
    icon: Bug,
    title: "Fall Armyworm Alert",
    text: "Reports of fall armyworm in Nakuru County. Scout your maize fields regularly.",
    severity: "high" as const,
  },
  {
    icon: CloudRain,
    title: "Heavy Rainfall Warning",
    text: "Kenya Met Department warns of heavy rains in Western Kenya this weekend.",
    severity: "medium" as const,
  },
];

const severityStyles = {
  high: "border-destructive/30 bg-destructive/5",
  medium: "border-harvest-warning/30 bg-harvest-warning/5",
};

const RegionalAlerts = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
        <h2 className="harvest-section-title">Regional Alerts</h2>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.title} className={`rounded-xl border p-4 ${severityStyles[alert.severity]}`}>
            <div className="flex items-start gap-3">
              <alert.icon className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{alert.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RegionalAlerts;
