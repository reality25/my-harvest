import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Users, MessageSquare, TrendingUp, Plus, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getGroups, getPosts } from "@/lib/dataService";
import { useAuth } from "@/contexts/AuthContext";
import EmptyState from "@/components/ui/EmptyState";
import PostCard from "@/components/community/PostCard";
import CreatePostSheet from "@/components/community/CreatePostSheet";
import { createPost } from "@/lib/dataService";

const Community = () => {
  const groups = getGroups();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [posts, setPosts] = useState(() => getPosts());
  const refresh = () => setPosts(getPosts());

  return (
    <AppLayout>
      <div className="px-4 py-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Community</h1>
          {isAuthenticated ? (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <Plus className="h-4 w-4" /> New Post
            </button>
          ) : (
            <button onClick={() => navigate("/login")} className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              <LogIn className="h-4 w-4" /> Sign in to post
            </button>
          )}
        </div>

        {/* Groups */}
        {groups.length > 0 && (
          <div>
            <h2 className="harvest-section-title mb-3">Groups</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((group) => (
                <div key={group.id} className="harvest-card p-4 cursor-pointer transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{group.emoji}</span>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {group.members.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {group.postsPerWeek} posts/wk</span>
                      </div>
                    </div>
                    <button className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20">Join</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="harvest-section-title">Feed</h2>
          </div>
          {posts.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No posts yet"
              description="Be the first to share tips, ask questions, or start a discussion with fellow farmers."
              action={isAuthenticated ? { label: "Create Post", onClick: () => setShowCreate(true) } : undefined}
            />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onUpdate={refresh} />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreatePostSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={(data) => {
          if (!user) return;
          createPost({
            authorId: user.id,
            authorName: user.name,
            authorAvatar: user.avatar,
            authorLocation: user.location || "Unknown",
            text: data.text,
            tag: data.tag,
            imageUrl: data.imageUrl,
          });
          setShowCreate(false);
          refresh();
        }}
      />
    </AppLayout>
  );
};

export default Community;
