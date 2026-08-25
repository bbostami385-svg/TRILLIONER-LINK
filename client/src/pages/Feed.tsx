import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getModerationToastMessage } from "@/lib/moderationFeedback";
import { ModerationAppealDialog } from "@/components/ModerationAppealDialog";
import { Loader } from "lucide-react";
import "./Feed.css";

export default function Feed() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [newPost, setNewPost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [appealOpen, setAppealOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>();
  const utils = trpc.useUtils();

  // Fetch feed posts
  const { data: feedData, isLoading: feedLoading } = trpc.feed.getFeed.useQuery({ limit: 20, offset: 0 }, { enabled: isAuthenticated });
  const { data: userCollections } = trpc.collections.getUserCollections.useQuery({ userId: user?.id ?? 0 }, { enabled: isAuthenticated && Boolean(user?.id) });
  const activeCollectionId = selectedCollectionId ?? userCollections?.[0]?.id;
  const { data: savedItems } = trpc.collections.getCollectionItems.useQuery({ collectionId: activeCollectionId ?? 0 }, { enabled: Boolean(activeCollectionId) });

  // Create post mutation
  const createPostMutation = trpc.feed.createPost.useMutation({
    onSuccess: () => {
      setNewPost("");
      setImageUrl("");
      utils.feed.getFeed.invalidate();
    },
  });

  // Like post mutation
  const likePostMutation = trpc.feed.likePost.useMutation({
    onSuccess: () => {
      utils.feed.getFeed.invalidate();
    },
  });

  // Unlike post mutation
  const unlikePostMutation = trpc.feed.unlikePost.useMutation({ onSuccess: () => { utils.feed.getFeed.invalidate(); } });
  const savePostMutation = trpc.collections.saveItem.useMutation();
  const removeSavedItemMutation = trpc.collections.removeItem.useMutation();



  if (!isAuthenticated) {
    return (
      <div className="feed-container">
        <div className="loading">
          <p>Please log in to view your feed</p>
          <Button onClick={() => setLocation("/signup")} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      await createPostMutation.mutateAsync({
        content: newPost,
        imageUrl: imageUrl || undefined,
      });
    } catch (error) {
      const moderationMessage = getModerationToastMessage(error);
      if (moderationMessage) toast.error(moderationMessage, { action: { label: "Appeal", onClick: () => setAppealOpen(true) } });
      else toast.error("We could not publish your post. Please try again.");
      console.error("Failed to create post:", error);
    }
  };

  const handleSavePost = async (postId: number) => {
    if (!activeCollectionId) { toast.info("Create a collection first, then save posts into it.", { action: { label: "Create collection", onClick: () => setLocation("/collections") } }); return; }
    const existing = savedItems?.find((item) => item.postId === postId);
    try {
      if (existing) { await removeSavedItemMutation.mutateAsync({ itemId: existing.id }); toast.success("Post removed from your collection."); }
      else { const result = await savePostMutation.mutateAsync({ collectionId: activeCollectionId, postId }); toast.success(result.duplicate ? "Post is already saved in this collection." : "Post saved to your collection."); }
      await utils.collections.getCollectionItems.invalidate({ collectionId: activeCollectionId });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update the saved post."); }
  };

  const handleLike = async (postId: number, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikePostMutation.mutateAsync({ postId });
      } else {
        await likePostMutation.mutateAsync({ postId });
      }
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const posts = feedData?.posts || [];

  return (
    <div className="feed-container">
      {/* Create Post Section */}
      <div className="create-post-section">
        <div className="create-post-header">
          <h2>What's on your mind?</h2>
        </div>
        <form onSubmit={handleCreatePost} className="create-post-form">
          <textarea
            className="post-input"
            placeholder="Share your thoughts, ideas, or updates..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
          />
          <input
            type="text"
            className="post-input"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <div className="post-actions">
            <div className="post-tools">
              <button type="button" className="tool-btn" title="Add image">
                🖼️
              </button>
              <button type="button" className="tool-btn" title="Add video">
                🎥
              </button>
              <button type="button" className="tool-btn" title="Add emoji">
                😊
              </button>
            </div>
            <button
              type="submit"
              className="post-btn"
              disabled={!newPost.trim() || createPostMutation.isPending}
            >
              {createPostMutation.isPending ? (
                <>
                  <Loader size={16} className="inline animate-spin mr-2" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="posts-feed">
        {feedLoading ? (
          <div className="loading">
            <Loader className="animate-spin" size={32} />
            <p>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              {/* Post Header */}
              <div className="post-header">
                <div className="post-author">
                  <div className="author-avatar">👤</div>
                  <div className="author-info">
                    <p className="author-name">User #{post.userId}</p>
                    <p className="post-time">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button className="post-menu" title="More options">
                  ⋯
                </button>
              </div>

              {/* Post Content */}
              <div className="post-content">
                <p>{post.content}</p>
              </div>

              {/* Post Image */}
              {post.imageUrl && (
                <div className="post-image">
                  <img src={post.imageUrl} alt="Post content" />
                </div>
              )}

              {/* Post Stats */}
              <div className="post-stats">
                <span>❤️ {post.likes} likes</span>
                <span>💬 {post.comments} comments</span>
                <span>↗️ {post.shares} shares</span>
              </div>

              {/* Post Actions */}
              {userCollections && userCollections.length > 0 && <label className="mb-2 flex items-center gap-2 text-xs text-slate-500">Save to <select value={activeCollectionId ?? ""} onChange={(event) => setSelectedCollectionId(Number(event.target.value))} className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200"><option value="" disabled>Select collection</option>{userCollections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></label>}
              <div className="post-actions-bar">
                <button
                  className={`action-btn ${post.likes > 0 ? "liked" : ""}`}
                  onClick={() => handleLike(post.id, post.likes > 0)}
                  disabled={likePostMutation.isPending || unlikePostMutation.isPending}
                >
                  ❤️ Like
                </button>
                <button className="action-btn">💬 Comment</button>
                <button className="action-btn" onClick={() => void handleSavePost(post.id)} disabled={savePostMutation.isPending || removeSavedItemMutation.isPending}>{savedItems?.some((item) => item.postId === post.id) ? "🔖 Saved" : "🔖 Save"}</button>
                <button className="action-btn">↗️ Share</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="feed-bottom-padding"></div>
      <ModerationAppealDialog open={appealOpen} onOpenChange={setAppealOpen} contentType="post" content={newPost} mediaUrl={imageUrl || undefined} mediaType={imageUrl ? "image" : undefined} />
    </div>
  );
}
