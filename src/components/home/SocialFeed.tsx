import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const posts = [
  {
    id: 1,
    author: "Jane Wanjiku",
    avatar: "JW",
    time: "2h ago",
    location: "Kiambu, Kenya",
    text: "My tomato seedlings are thriving! Started them in a shade net 3 weeks ago. Tips for anyone starting out — water twice daily and keep them out of direct midday sun. 🌱",
    likes: 42,
    comments: 8,
    tag: "Crop Farming",
  },
  {
    id: 2,
    author: "Peter Ochieng",
    avatar: "PO",
    time: "5h ago",
    location: "Kisumu, Kenya",
    text: "Does anyone know a good vet in Kisumu area? One of my dairy cows is showing signs of mastitis. Need urgent help. 🐄",
    likes: 15,
    comments: 23,
    tag: "Livestock",
  },
  {
    id: 3,
    author: "Mary Akinyi",
    avatar: "MA",
    time: "8h ago",
    location: "Nakuru, Kenya",
    text: "First harvest of the season! 200kg of French beans ready for market. Drip irrigation really made the difference this time. 💪",
    likes: 89,
    comments: 14,
    tag: "Market Update",
  },
];

const SocialFeed = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <h2 className="harvest-section-title mb-3">Community Feed</h2>
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="harvest-card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {post.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.author}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {post.location} · {post.time}
                  </p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-foreground">{post.text}</p>

            <div className="mt-2">
              <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                {post.tag}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-6 border-t pt-3">
              <button className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-destructive">
                <Heart className="h-4 w-4" />
                <span className="text-xs">{post.likes}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary">
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{post.comments}</span>
              </button>
              <button className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary">
                <Share2 className="h-4 w-4" />
                <span className="text-xs">Share</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SocialFeed;
