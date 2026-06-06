import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import "./Feed.css";

interface Post {
  id: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
}

export default function Feed() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "1",
      author: "John Doe",
      avatar: "👨",
      content: "Just launched my new project! Excited to share it with everyone.",
      timestamp: "2 hours ago",
      likes: 234,
      comments: 45,
      shares: 12,
      liked: false,
    },
    {
      id: "2",
      author: "Jane Smith",
      avatar: "👩",
      content: "Amazing day at the conference. Great insights and networking opportunities!",
      timestamp: "4 hours ago",
      likes: 567,
      comments: 89,
      shares: 34,
      liked: false,
    },
    {
      id: "3",
      author: "Tech Guru",
      avatar: "🧑‍💻",
      content: "New blog post on web performance optimization. Check it out!",
      timestamp: "6 hours ago",
      likes: 890,
      comments: 123,
      shares: 56,
      liked: false,
    },
  ]);

  const [newPost, setNewPost] = useState("");

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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      const post: Post = {
        id: Date.now().toString(),
        author: user?.email?.split("@")[0] || "You",
        avatar: "👤",
        content: newPost,
        timestamp: "now",
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
      };
      setPosts([post, ...posts]);
      setNewPost("");
    }
  };

  const handleLike = (id: string) => {
    setPosts(
      posts.map((post) =>
        post.id === id
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

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
              disabled={!newPost.trim()}
            >
              Post
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      <div className="posts-feed">
        {posts.length === 0 ? (
          <div className="empty-state">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="post-card">
              {/* Post Header */}
              <div className="post-header">
                <div className="post-author">
                  <div className="author-avatar">{post.avatar}</div>
                  <div className="author-info">
                    <p className="author-name">{post.author}</p>
                    <p className="post-time">{post.timestamp}</p>
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
              {post.image && (
                <div className="post-image">
                  <img src={post.image} alt="Post content" />
                </div>
              )}

              {/* Post Stats */}
              <div className="post-stats">
                <span>{post.likes} likes</span>
                <span>{post.comments} comments</span>
                <span>{post.shares} shares</span>
              </div>

              {/* Post Actions */}
              <div className="post-actions-bar">
                <button
                  className={`action-btn ${post.liked ? "liked" : ""}`}
                  onClick={() => handleLike(post.id)}
                >
                  👍 Like
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
