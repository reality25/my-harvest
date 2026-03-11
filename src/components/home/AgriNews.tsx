import { Newspaper, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getArticles } from "@/lib/dataService";
import EmptyState from "@/components/ui/EmptyState";

const AgriNews = () => {
  const articles = getArticles();

  if (articles.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-harvest-sky/10">
            <Newspaper className="h-4 w-4 text-harvest-sky" />
          </div>
          <h2 className="harvest-section-title">Agri News</h2>
        </div>
        <EmptyState
          icon={Newspaper}
          title="No articles yet"
          description="Agricultural news and articles will appear here once published."
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-harvest-sky/10">
            <Newspaper className="h-4 w-4 text-harvest-sky" />
          </div>
          <h2 className="harvest-section-title">Agri News</h2>
        </div>
        <button className="flex items-center gap-1 text-xs font-medium text-primary">
          See all <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      <div className="space-y-3">
        {articles.slice(0, 5).map((item) => (
          <div key={item.id} className="harvest-card p-4 cursor-pointer transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h3>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.authorName} · {item.readTime}
                </p>
              </div>
              {item.tag && (
                <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  {item.tag}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AgriNews;
