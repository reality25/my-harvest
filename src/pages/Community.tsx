import AppLayout from "@/components/AppLayout";
import { Users, MessageSquare, TrendingUp, Plus } from "lucide-react";
import { motion } from "framer-motion";

const groups = [
  { name: "Dairy Farming Kenya", members: 2340, posts: 156, emoji: "🐄" },
  { name: "Poultry Farmers Network", members: 1890, posts: 98, emoji: "🐔" },
  { name: "Organic Agriculture", members: 1250, posts: 67, emoji: "🌿" },
  { name: "Irrigation & Water Mgmt", members: 890, posts: 45, emoji: "💧" },
  { name: "Beekeeping Kenya", members: 560, posts: 34, emoji: "🐝" },
  { name: "Aquaculture Hub", members: 430, posts: 23, emoji: "🐟" },
];

const Community = () => {
  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          <button className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" /> New Post
          </button>
        </div>

        <div>
          <h2 className="harvest-section-title mb-3">Groups</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.map((group, i) => (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="harvest-card p-4 cursor-pointer transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{group.emoji}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {group.members.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> {group.posts} posts/wk
                      </span>
                    </div>
                  </div>
                  <button className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20">
                    Join
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="harvest-section-title">Trending Discussions</h2>
          </div>
          <div className="space-y-3">
            {[
              "Best drought-resistant maize varieties for 2026?",
              "How to prevent Newcastle disease in free-range chickens",
              "Has anyone tried solar-powered irrigation pumps?",
            ].map((topic) => (
              <div key={topic} className="harvest-card p-4 cursor-pointer transition-shadow hover:shadow-md">
                <p className="text-sm font-medium text-foreground">{topic}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">Active now · 12 replies</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Community;
