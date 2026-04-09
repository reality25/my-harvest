import { useState } from "react";
import { AlertTriangle, Info, Bell, ChevronDown, ChevronUp, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAlerts, type Alert } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";

type Priority = "critical" | "high" | "medium" | "low";

const PRIORITY_STYLES: Record<Priority, string> = {
  critical: "border-red-500/50 bg-red-500/10",
  high: "border-destructive/30 bg-destructive/5",
  medium: "border-amber-400/30 bg-amber-400/5",
  low: "border-border bg-muted/30",
};

const PRIORITY_BADGE: Record<Priority, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-destructive/15 text-destructive",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-muted text-muted-foreground",
};

const PRIORITY_ICON: Record<Priority, string> = {
  critical: "text-red-500",
  high: "text-destructive",
  medium: "text-amber-500",
  low: "text-muted-foreground",
};

function mapSeverityToPriority(severity: Alert["severity"]): Priority {
  if (severity === "high") return "high";
  if (severity === "medium") return "medium";
  return "low";
}

export default function RegionalAlerts() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  const allAlerts = getAlerts().filter((a) => !dismissed.includes(a.id));

  const userRegion = user?.location?.toLowerCase() ?? "";
  const relevant = allAlerts.filter((a) => {
    if (!userRegion) return true;
    return a.region.toLowerCase() === "national" ||
      userRegion.includes(a.region.toLowerCase()) ||
      a.region.toLowerCase().includes(userRegion.split(",")[0].trim());
  });

  const sorted = [...relevant].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
  });

  const visibleAlerts = expanded ? sorted : sorted.slice(0, 2);
  const criticalCount = sorted.filter((a) => a.severity === "high").length;

  if (sorted.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10">
            <Bell className="h-4 w-4 text-destructive" />
          </div>
          <h2 className="harvest-section-title">Regional Alerts</h2>
          {criticalCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {criticalCount}
            </span>
          )}
        </div>
        {sorted.length > 2 && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-[11px] font-medium text-primary"
          >
            {expanded ? "Show less" : `+${sorted.length - 2} more`}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {visibleAlerts.map((alert) => {
            const priority = mapSeverityToPriority(alert.severity);
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className={`relative rounded-xl border p-4 ${PRIORITY_STYLES[priority]}`}
              >
                <button
                  onClick={() => setDismissed((d) => [...d, alert.id])}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-start gap-3 pr-5">
                  <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${PRIORITY_ICON[priority]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${PRIORITY_BADGE[priority]}`}>
                        {priority}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{alert.text}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Info className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{alert.region}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
