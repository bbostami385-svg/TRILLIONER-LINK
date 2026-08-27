import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Loader } from "lucide-react";
import "./Explore.css";

export default function Explore() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"trending" | "suggested" | "categories">("trending");
  const [searchType, setSearchType] = useState<"all" | "users" | "posts" | "videos" | "hashtags">("all");

  // Fetch trending hashtags
  const { data: trendingData, isLoading: trendingLoading } = trpc.search.getTrendingHashtags.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );

  // Search users
  const { data: usersData, isLoading: usersLoading } = trpc.search.searchUsers.useQuery({ query: searchQuery.trim(), limit: 20 }, { enabled: isAuthenticated && searchQuery.trim().length > 0 && !searchQuery.trim().startsWith("@") });
  const { data: postsData, isLoading: postsLoading, isError: postsError } = trpc.search.searchPosts.useQuery({ query: searchQuery.trim(), limit: 20 }, { enabled: isAuthenticated && searchQuery.trim().length > 0 && !searchQuery.trim().startsWith("@") });
  const { data: videosData, isLoading: videosLoading, isError: videosError } = trpc.search.searchVideos.useQuery({ query: searchQuery.trim(), limit: 20 }, { enabled: isAuthenticated && searchQuery.trim().length > 0 && !searchQuery.trim().startsWith("@") });

  const handleLookup = trpc.profileEdit.getByHandle.useQuery({ handle: searchQuery }, { enabled: isAuthenticated && searchQuery.trim().startsWith("@") && searchQuery.trim().length > 2, retry: false, staleTime: 30_000 });
  const handleMatch = handleLookup.data;

  // Search hashtags
  const { data: hashtagsData, isLoading: hashtagsLoading, isError: hashtagsError } = trpc.search.searchHashtags.useQuery({ query: searchQuery.trim(), limit: 20 }, { enabled: isAuthenticated && searchQuery.trim().length > 0 && !searchQuery.trim().startsWith("@") });
  const searchLoading = usersLoading || postsLoading || videosLoading || hashtagsLoading || handleLookup.isFetching;
  const searchError = postsError || videosError || hashtagsError;
  const searched = searchQuery.trim().length > 0;

  if (!isAuthenticated) {
    return (
      <div className="explore-container">
        <div className="loading">
          <p>{t("explore.loginRequired", "Please log in to explore")}</p>
          <Button onClick={() => setLocation("/signup")} className="mt-4">
            {t("common.login")}
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
          placeholder={t("explore.searchPlaceholder", "Search posts, people, topics...")}
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
          {t("explore.trending", "Trending")}
        </button>
        <button
          className={`tab ${activeTab === "suggested" ? "active" : ""}`}
          onClick={() => setActiveTab("suggested")}
        >
          {t("explore.suggestedUsers", "Suggested Users")}
        </button>
        <button
          className={`tab ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
        >
          {t("explore.categories", "Categories")}
        </button>
      </div>

      {/* Exact public handle result */}
      {searchQuery.trim().startsWith("@") && <div className="mb-4 rounded-2xl border border-indigo-300/20 bg-indigo-500/10 p-4 text-white">{handleLookup.isFetching ? <p className="text-sm text-slate-300">Finding that creator handle…</p> : handleMatch ? <button onClick={() => setLocation(`/@/${handleMatch.handle}`)} className="flex w-full items-center gap-3 text-left"><div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-indigo-500 font-bold">{handleMatch.profileImage ? <img src={handleMatch.profileImage} alt="" className="h-full w-full object-cover" /> : (handleMatch.name?.[0] ?? "?").toUpperCase()}</div><div><p className="font-semibold">{handleMatch.name || `@${handleMatch.handle}`}</p><p className="text-sm text-indigo-200">@{handleMatch.handle} · Open public profile</p></div></button> : <p className="text-sm text-slate-400">No public profile matches {searchQuery.trim()} yet.</p>}</div>}

      {searched && !searchQuery.trim().startsWith("@") && <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-white"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Advanced search</p><p className="mt-1 text-sm text-slate-300">Results for “{searchQuery.trim()}”</p></div><select value={searchType} onChange={(event) => setSearchType(event.target.value as typeof searchType)} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"><option value="all">All results</option><option value="users">People</option><option value="posts">Posts</option><option value="videos">Videos</option><option value="hashtags">Hashtags</option></select></div>{searchLoading ? <div className="mt-5 h-24 animate-pulse rounded-xl bg-white/5" aria-label="Loading search results" /> : searchError ? <p className="mt-5 text-sm text-rose-300">Search is temporarily unavailable. Please try again.</p> : <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className={`${searchType !== "all" && searchType !== "users" ? "hidden" : ""} rounded-xl border border-white/10 bg-black/10 p-4`}><p className="font-semibold">People</p><p className="mt-1 text-sm text-slate-400">{usersData?.length ?? 0} matches</p>{usersData?.slice(0, 3).map((item: any) => <button key={item.id} onClick={() => item.handle && setLocation(`/@/${item.handle}`)} className="mt-3 block text-left text-sm text-cyan-200 hover:text-white">{item.name || `User ${item.id}`}{item.handle ? ` · @${item.handle}` : ""}</button>)}</div><div className={`${searchType !== "all" && searchType !== "posts" ? "hidden" : ""} rounded-xl border border-white/10 bg-black/10 p-4`}><p className="font-semibold">Posts</p><p className="mt-1 text-sm text-slate-400">{postsData?.length ?? 0} matches</p>{postsData?.slice(0, 3).map((item: any) => <button key={item.id} onClick={() => setLocation(`/feed?post=${item.id}`)} className="mt-3 block w-full rounded-lg border border-white/10 p-3 text-left text-sm text-slate-200 hover:border-cyan-300/40"><span className="line-clamp-2">{item.content || item.text || "Post result"}</span><span className="mt-1 block text-xs text-slate-500">Open post</span></button>)}</div><div className={`${searchType !== "all" && searchType !== "videos" ? "hidden" : ""} rounded-xl border border-white/10 bg-black/10 p-4`}><p className="font-semibold">Videos</p><p className="mt-1 text-sm text-slate-400">{videosData?.length ?? 0} matches</p>{videosData?.slice(0, 3).map((item: any) => <button key={item.id} onClick={() => setLocation(`/videos?video=${item.id}`)} className="mt-3 block w-full rounded-lg border border-white/10 p-3 text-left text-sm text-slate-200 hover:border-cyan-300/40"><span className="line-clamp-2">{item.title || item.description || "Video result"}</span><span className="mt-1 block text-xs text-slate-500">Open video</span></button>)}</div><div className={`${searchType !== "all" && searchType !== "hashtags" ? "hidden" : ""} rounded-xl border border-white/10 bg-black/10 p-4`}><p className="font-semibold">Hashtags</p><p className="mt-1 text-sm text-slate-400">{hashtagsData?.length ?? 0} matches</p>{hashtagsData?.slice(0, 3).map((item: any) => <p key={item.id} className="mt-3 text-sm text-cyan-200">#{item.name}</p>)}</div></div>}</section>}

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
