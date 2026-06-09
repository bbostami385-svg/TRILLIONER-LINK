import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader } from "lucide-react";
import "./Explore.css";

export default function Explore() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"trending" | "suggested" | "categories">(
    "trending"
  );

  // Fetch trending hashtags
  const { data: trendingData, isLoading: trendingLoading } = trpc.search.getTrendingHashtags.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  // Search users
  const { data: usersData, isLoading: usersLoading } = trpc.search.searchUsers.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: isAuthenticated && searchQuery.length > 0 }
  );

  // Search hashtags
  const { data: hashtagsData, isLoading: hashtagsLoading } = trpc.search.searchHashtags.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: isAuthenticated && searchQuery.length > 0 }
  );

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
            {trendingLoading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Loader className="animate-spin" size={24} />
              </div>
            ) : (
              (trendingData || []).map((topic: any) => (
                <div key={topic.id} className="trending-item">
                  <div className="trending-info">
                    <p className="trending-topic">#{topic.name}</p>
                    <p className="trending-posts">{topic.usageCount || 0} posts</p>
                  </div>
                  <button className="follow-btn">Follow</button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "suggested" && (
          <div className="suggested-list">
            <h3>Suggested Users</h3>
            {usersLoading ? (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Loader className="animate-spin" size={24} />
              </div>
            ) : searchQuery.length === 0 ? (
              <p style={{ color: "#aaa", textAlign: "center", padding: "20px" }}>
                Search for users
              </p>
            ) : (
              (usersData || []).map((user: any) => (
                <div key={user.id} className="suggested-item">
                  <div className="user-avatar">{user.avatar || "👤"}</div>
                  <div className="user-info">
                    <p className="user-name">{user.name}</p>
                    <p className="user-username">@{user.id}</p>
                    <p className="user-followers">{user.followers || 0} followers</p>
                  </div>
                  <button className="follow-btn">Follow</button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "categories" && (
          <div className="categories-list">
            <h3>Categories</h3>
            <div className="categories-grid">
              {hashtagsLoading ? (
                <div style={{ textAlign: "center", padding: "20px", gridColumn: "1/-1" }}>
                  <Loader className="animate-spin" size={24} />
                </div>
              ) : searchQuery.length === 0 ? (
                <p
                  style={{
                    color: "#aaa",
                    textAlign: "center",
                    padding: "20px",
                    gridColumn: "1/-1",
                  }}
                >
                  Search for hashtags
                </p>
              ) : (
                (hashtagsData || []).map((hashtag: any) => (
                  <div key={hashtag.id} className="category-card">
                    <div className="category-icon">#{hashtag.name.charAt(0).toUpperCase()}</div>
                    <p className="category-name">#{hashtag.name}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom padding for navigation */}
      <div className="explore-bottom-padding"></div>
    </div>
  );
}
