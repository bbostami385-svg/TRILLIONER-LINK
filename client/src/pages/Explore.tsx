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

  const handleLookup = trpc.profileEdit.getByHandle.useQuery({ handle: searchQuery }, { enabled: isAuthenticated && searchQuery.trim().startsWith("@") && searchQuery.trim().length > 2, retry: false, staleTime: 30_000 });
  const handleMatch = handleLookup.data;

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
          onChange={(e) => { const value = e.target.value; setSearchQuery(value); if (value.trim().startsWith("@")) setActiveTab("suggested"); }}
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

      {/* Exact public handle result */}
      {searchQuery.trim().startsWith("@") && <div className="mb-4 rounded-2xl border border-indigo-300/20 bg-indigo-500/10 p-4 text-white">{handleLookup.isFetching ? <p className="text-sm text-slate-300">Finding that creator handle…</p> : handleMatch ? <button onClick={() => setLocation(`/@/${handleMatch.handle}`)} className="flex w-full items-center gap-3 text-left"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-indigo-500 font-bold">{handleMatch.profileImage ? <img src={handleMatch.profileImage} alt="" className="h-full w-full object-cover" /> : (handleMatch.name?.[0] ?? "?").toUpperCase()}</div><div><p className="font-semibold">{handleMatch.name || `@${handleMatch.handle}`}</p><p className="text-sm text-indigo-200">@{handleMatch.handle} · Open public profile</p></div></button> : <p className="text-sm text-slate-400">No public profile matches {searchQuery.trim()} yet.</p>}</div>}

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
