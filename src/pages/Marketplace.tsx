import AppLayout from "@/components/AppLayout";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const categories = ["All", "Livestock", "Crops", "Equipment", "Seeds", "Fertilizer", "Services"];

const listings = [
  {
    id: 1,
    title: "Grade Holstein Friesian Dairy Cow",
    price: "KSh 120,000",
    location: "Nyandarua",
    seller: "James Kimani",
    category: "Livestock",
  },
  {
    id: 2,
    title: "Fresh Organic Avocados — 100kg",
    price: "KSh 8,000",
    location: "Murang'a",
    seller: "Grace Njeri",
    category: "Crops",
  },
  {
    id: 3,
    title: "2-Acre Drip Irrigation Kit",
    price: "KSh 45,000",
    location: "Nairobi",
    seller: "AgroSupply Ltd",
    category: "Equipment",
  },
  {
    id: 4,
    title: "Certified Maize Seeds — DH04",
    price: "KSh 350/kg",
    location: "Nakuru",
    seller: "Kenya Seed Co",
    category: "Seeds",
  },
  {
    id: 5,
    title: "NPK Fertilizer 50kg Bags",
    price: "KSh 3,200",
    location: "Eldoret",
    seller: "FarmInputs Kenya",
    category: "Fertilizer",
  },
  {
    id: 6,
    title: "Poultry Vaccination Service",
    price: "KSh 500/visit",
    location: "Kiambu",
    seller: "Dr. Akinyi Vet",
    category: "Services",
  },
];

const Marketplace = () => {
  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>

        <div className="flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border bg-card px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search products & services..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                i === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {listings.map((item, i) => (
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
                {item.location} · {item.seller}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Marketplace;
