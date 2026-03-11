import AppLayout from "@/components/AppLayout";
import { Search, SlidersHorizontal, MapPin, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { getListings } from "@/lib/dataService";
import EmptyState from "@/components/ui/EmptyState";

const categories = ["All", "Livestock", "Crops", "Equipment", "Seeds", "Fertilizer", "Services"];

const Marketplace = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const listings = getListings();

  const filtered = useMemo(() => {
    return listings.filter((item) => {
      const matchCategory = activeCategory === "All" || item.category === activeCategory;
      const matchSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [listings, activeCategory, searchQuery]);

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>

        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border bg-card px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products & services..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No listings available"
            description={listings.length === 0 ? "No marketplace listings yet. Be the first to list a product or service!" : "No results match your search or filter."}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="harvest-card p-4 cursor-pointer transition-shadow hover:shadow-md"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                    {item.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h3>
                <p className="mt-2 text-lg font-bold text-primary">{item.price}</p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {item.location} · {item.sellerName}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Marketplace;
