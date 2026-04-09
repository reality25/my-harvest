import { useNavigate } from "react-router-dom";
import { Scan, Plus, ClipboardEdit, ShoppingBag, Leaf, Egg } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  path: string;
}

const BASE_ACTIONS: QuickAction[] = [
  { icon: Scan, label: "Scan Crop", color: "text-green-700", bg: "bg-green-100", path: "/assistant" },
  { icon: Plus, label: "Add Record", color: "text-blue-700", bg: "bg-blue-100", path: "/farm" },
  { icon: ClipboardEdit, label: "Log Activity", color: "text-purple-700", bg: "bg-purple-100", path: "/farm" },
  { icon: ShoppingBag, label: "Marketplace", color: "text-amber-700", bg: "bg-amber-100", path: "/marketplace" },
];

const FARMING_EXTRAS: Record<string, QuickAction> = {
  livestock: { icon: Leaf, label: "Health Log", color: "text-rose-700", bg: "bg-rose-100", path: "/farm" },
  poultry: { icon: Egg, label: "Egg Record", color: "text-orange-700", bg: "bg-orange-100", path: "/farm" },
  aquaculture: { icon: Leaf, label: "Feed Log", color: "text-cyan-700", bg: "bg-cyan-100", path: "/farm" },
};

export default function QuickActions() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const farmTypes = user?.farmingActivities ?? [];
  const extras = farmTypes
    .map((t) => FARMING_EXTRAS[t])
    .filter(Boolean)
    .slice(0, 1);

  const actions = [...BASE_ACTIONS, ...extras].slice(0, 4);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <h2 className="harvest-section-title mb-3">Quick Actions</h2>
      <div className="grid grid-cols-4 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors active:scale-95"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.bg}`}>
              <action.icon className={`h-6 w-6 ${action.color}`} />
            </div>
            <span className="text-[11px] font-medium text-foreground text-center leading-tight">{action.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
