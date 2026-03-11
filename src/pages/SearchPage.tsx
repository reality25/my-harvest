import AppLayout from "@/components/AppLayout";
import { Search } from "lucide-react";

const SearchPage = () => {
  const categories = ["Farmers", "Posts", "Groups", "Marketplace", "Experts", "Articles"];

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-4">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Search farmers, posts, products, experts..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              className="rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Start typing to search across the platform
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default SearchPage;
