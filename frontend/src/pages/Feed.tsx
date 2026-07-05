import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader } from "lucide-react";
import "./Feed.css";

export default function Feed() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [newPost, setNewPost] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const utils = trpc.useUtils();

  // Fetch feed posts
  const { data: feedData, isLoading: feedLoading } = trpc.feed.getFeed.useQuery(
    { limit: 20, offset: 0 },
    { enabled: isAuthenticated }
  );

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
  const unlikePostMutation = trpc.feed.unlikePost.useMutation({
    onSuccess: () => {
      utils.feed.getFeed.invalidate();
    },
  });



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
      console.error("Failed to create post:", error);
    }
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
              <div className="post-actions-bar">
                <button
                  className={`action-btn ${post.likes > 0 ? "liked" : ""}`}
                  onClick={() => handleLike(post.id, post.likes > 0)}
                  disabled={likePostMutation.isPending || unlikePostMutation.isPending}
                >
                  ❤️ Like
                </button>
                <button className="action-btn">💬 Comment</button>
                <button className="action-btn">↗️ Share</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="feed-bottom-padding"></div>
    </div>
  );
}
