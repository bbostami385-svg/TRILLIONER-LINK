import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import "./Explore.css";

interface TrendingTopic {
  id: number;
  topic: string;
  posts: string;
}

interface SuggestedUser {
  id: number;
  name: string;
  username: string;
  followers: string;
  avatar: string;
}

export default function Explore() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"trending" | "suggested" | "categories">(
    "trending"
  );

  const trendingTopics: TrendingTopic[] = [
    { id: 1, topic: "#Technology", posts: "2.5M" },
    { id: 2, topic: "#Cricket", posts: "1.8M" },
    { id: 3, topic: "#Gaming", posts: "1.5M" },
    { id: 4, topic: "#Music", posts: "1.2M" },
    { id: 5, topic: "#Sports", posts: "980K" },
    { id: 6, topic: "#Entertainment", posts: "850K" },
  ];

  const suggestedUsers: SuggestedUser[] = [
    { id: 1, name: "John Doe", username: "@johndoe", followers: "125K", avatar: "👨" },
    { id: 2, name: "Jane Smith", username: "@janesmith", followers: "98K", avatar: "👩" },
    { id: 3, name: "Tech Guru", username: "@techguru", followers: "250K", avatar: "🧑‍💻" },
    { id: 4, name: "Creative Mind", username: "@creativemind", followers: "180K", avatar: "🎨" },
  ];

  const categories = [
    { icon: "🎬", name: "Entertainment" },
    { icon: "⚽", name: "Sports" },
    { icon: "🎮", name: "Gaming" },
    { icon: "🎵", name: "Music" },
    { icon: "📚", name: "Education" },
    { icon: "🍔", name: "Food" },
    { icon: "✈️", name: "Travel" },
    { icon: "💼", name: "Business" },
  ];

  if (!isAuthenticated) {
    return (
      <div className="explore-container">
        <div className="loading">
          <p>Please log in to explore</p>
          <Button onClick={() => setLocation("/signup")} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="explore-container">
      {/* Search Bar */}
      <div className="explore-search">
        <input
          type="text"
          className="search-input"
          placeholder="Search posts, people, topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="search-btn" title="Search">
          🔍
        </button>
      </div>

      {/* Tabs */}
      <div className="explore-tabs">
        <button
          className={`tab ${activeTab === "trending" ? "active" : ""}`}
          onClick={() => setActiveTab("trending")}
        >
          Trending
        </button>
        <button
          className={`tab ${activeTab === "suggested" ? "active" : ""}`}
          onClick={() => setActiveTab("suggested")}
        >
          Suggested Users
        </button>
        <button
          className={`tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          Categories
        </button>
      </div>

      {/* Tab Content */}
      <div className="explore-content">
        {activeTab === "trending" && (
          <div className="trending-list">
            <h3>Trending Now</h3>
            {trendingTopics.map((topic) => (
              <div key={topic.id} className="trending-item">
                <div className="trending-info">
                  <p className="trending-topic">{topic.topic}</p>
                  <p className="trending-posts">{topic.posts} posts</p>
                </div>
                <button className="follow-btn">Follow</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "suggested" && (
          <div className="suggested-list">
            <h3>Suggested Users</h3>
            {suggestedUsers.map((user) => (
              <div key={user.id} className="suggested-item">
                <div className="user-avatar">{user.avatar}</div>
                <div className="user-info">
                  <p className="user-name">{user.name}</p>
                  <p className="user-username">{user.username}</p>
                  <p className="user-followers">{user.followers} followers</p>
                </div>
                <button className="follow-btn">Follow</button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "categories" && (
          <div className="categories-list">
            <h3>Categories</h3>
            <div className="categories-grid">
              {categories.map((category, index) => (
                <div key={index} className="category-card">
                  <div className="category-icon">{category.icon}</div>
                  <p className="category-name">{category.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom padding for navigation */}
      <div className="explore-bottom-padding"></div>
    </div>
  );
}
