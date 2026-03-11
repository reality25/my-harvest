import { Heart, MessageCircle, Share2, MoreHorizontal, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { getPosts } from "@/lib/dataService";
import EmptyState from "@/components/ui/EmptyState";

const SocialFeed = () => {
  const posts = getPosts();

  if (posts.length === 0) {
    return (
      <div>
        <h2 className="harvest-section-title mb-3">Community Feed</h2>
        <EmptyState
          icon={Pencil}
          title="No posts yet"
          description="Be the first to share farming tips, ask questions, or post updates with the community."
        />
      </div>
    );
  }

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
                  {post.authorAvatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{post.authorName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {post.authorLocation} · {new Date(post.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-foreground">{post.text}</p>

            {post.tag && (
              <div className="mt-2">
                <span className="inline-block rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  {post.tag}
                </span>
              </div>
            )}

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
