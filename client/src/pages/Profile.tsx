import React, { useMemo, useState } from 'react';
import { Heart, MessageCircle, Share2, Settings, Edit2, UserPlus, UserCheck, ShieldCheck } from 'lucide-react';
import { LevelBadge } from '@/components/LevelBadge';
import { LevelProgressBar } from '@/components/LevelProgressBar';
import { ModeIndicator } from '@/components/ModeIndicator';
import { DualModeButton } from '@/components/DualModeButton';
import { ModeStatistics } from '@/components/ModeStatistics';
import { VerificationStatusTracker } from '@/components/VerificationStatusTracker';
import { KycStatusHistory } from '@/components/KycStatusHistory';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/hooks/useTranslation';
import './Profile.css';

interface UserProfile {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  website?: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing: boolean;
}

interface Post {
  id: number;
  image: string;
  likes: number;
  comments: number;
}

export default function Profile() {
  const { data: currentMode } = trpc.dualMode.getCurrentMode.useQuery();
  const { data: levelStats } = trpc.levels.getLevelStats.useQuery();
  const { data: userStats } = trpc.profileEdit.getUserStats.useQuery();
  const { data: livenessStatus } = trpc.humanVerification.getLivenessStatus.useQuery();
  const { data: kycStatus } = trpc.kyc.getKYCStatus.useQuery();
  const { t, formatDate, formatCurrency } = useTranslation();
  const paymentHistoryQuery = trpc.payment.getPaymentHistory.useQuery(undefined, { retry: false });
  const audiencePage = useMemo(() => ({ limit: 5, offset: 0 }), []);
  const { data: followersPreview } = trpc.dualMode.getFollowers.useQuery({ userId: 1, ...audiencePage }, { enabled: currentMode?.currentMode === "social", retry: false });
  const { data: subscribersPreview } = trpc.dualMode.getSubscribers.useQuery({ creatorId: 1, ...audiencePage }, { enabled: currentMode?.currentMode === "creator", retry: false });

  const [user] = useState<UserProfile>({
    id: 1,
    name: 'Sarah Ahmed',
    avatar: '👩',
    bio: 'Travel enthusiast | Photography lover | Coffee addict ☕',
    website: 'www.sarahahmed.com',
    followers: 15420,
    following: 892,
    posts: 234,
    isFollowing: false,
  });

  const [posts] = useState<Post[]>([
    { id: 1, image: '🏖️', likes: 2341, comments: 456 },
    { id: 2, image: '🏔️', likes: 3456, comments: 678 },
    { id: 3, image: '🌅', likes: 1203, comments: 234 },
    { id: 4, image: '🌴', likes: 4567, comments: 890 },
    { id: 5, image: '🏝️', likes: 2890, comments: 567 },
    { id: 6, image: '🌊', likes: 3210, comments: 645 },
  ]);

  const [isFollowing, setIsFollowing] = useState(user.isFollowing);
  const [activeTab, setActiveTab] = useState<'posts' | 'videos' | 'saved'>('posts');

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-cover" />
        
        <div className="profile-info">
          <div className="profile-avatar">{user.avatar}</div>
          
          <div className="profile-details">
            <div className="profile-name-section">
              <div className="flex items-center gap-3">
                <h1>{user.name}</h1>
                {levelStats && (
                  <LevelBadge level={levelStats.currentLevel} size="md" />
                )}
              </div>
              <button className="settings-btn">
                <Settings size={20} />
              </button>
            </div>
            
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {currentMode && <ModeIndicator mode={currentMode.currentMode} size="md" />}
              {livenessStatus?.isVerified && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-200" title={t("profile.humanVerified")}><ShieldCheck size={14} /> {t("profile.humanVerified")}</span>}
            </div>
            
            <p className="profile-bio">{user.bio}</p>
            
            {user.website && (
              <a href={`https://${user.website}`} className="profile-website">
                🔗 {user.website}
              </a>
            )}
            
            <div className="mb-4"><ModeStatistics userId={user.id} currentMode={currentMode?.currentMode ?? "social"} /></div>
            <div className="profile-stats">
              <div className="stat"><span className="stat-value">{currentMode?.currentMode === "creator" ? (userStats?.videosCount ?? 0) : (userStats?.postsCount ?? user.posts)}</span><span className="stat-label">{currentMode?.currentMode === "creator" ? t("profile.videos") : t("profile.posts")}</span></div>
              <div className="stat"><span className="stat-value">{(currentMode?.currentMode === "creator" ? (currentMode?.statistics?.subscribers ?? 0) : (userStats?.followersCount ?? user.followers)).toLocaleString()}</span><span className="stat-label">{currentMode?.currentMode === "creator" ? t("profile.subscribers") : t("profile.followers")}</span></div>
              <div className="stat"><span className="stat-value">{(currentMode?.currentMode === "creator" ? (currentMode?.statistics?.totalViews ?? userStats?.lifetimeViews ?? 0) : (userStats?.followingCount ?? user.following)).toLocaleString()}</span><span className="stat-label">{currentMode?.currentMode === "creator" ? t("profile.views") : t("profile.following")}</span></div>
            </div>
            {userStats && <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3"><span>{t("profile.joined")} {userStats.joinedAt ? formatDate(new Date(userStats.joinedAt)) : "—"}</span><span>{userStats.videosCount.toLocaleString()} {t("profile.videoUploads")}</span><span>{userStats.lifetimeViews.toLocaleString()} {t("profile.lifetimeViews")}</span></div>}
            {kycStatus && <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-xs text-slate-300"><span className="font-semibold text-amber-200">{t("profile.identityVerification")}:</span> {kycStatus.status === "approved" ? t("profile.approved") : kycStatus.status === "pending" ? t("profile.underReview") : kycStatus.status === "rejected" ? t("profile.needsResubmission") : t("profile.notSubmitted")}. {t("profile.kycPurpose")}</div>}
            <div className="mt-4 space-y-4"><VerificationStatusTracker /><KycStatusHistory /></div>
            <section className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-400/5 p-4" aria-labelledby="payment-history-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 id="payment-history-title" className="text-sm font-semibold text-cyan-100">{t("profile.paymentHistory")}</h2>
                  <p className="mt-1 text-xs text-slate-400">{t("profile.noPaymentHistory")}</p>
                </div>
                {paymentHistoryQuery.isFetching && <span className="text-xs text-cyan-200">{t("status.loading")}</span>}
              </div>
              {paymentHistoryQuery.isError ? (
                <div role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs text-red-100">
                  <span>{t("status.error")}</span>
                  <button type="button" className="font-semibold underline" onClick={() => paymentHistoryQuery.refetch()}>{t("status.tryAgain")}</button>
                </div>
              ) : paymentHistoryQuery.isLoading ? (
                <div className="mt-3 space-y-2" aria-label={t("status.loading")}>
                  {[1, 2].map((item) => <div key={item} className="h-10 animate-pulse rounded-lg bg-white/5" />)}
                </div>
              ) : paymentHistoryQuery.data?.length ? (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-left text-xs">
                    <thead className="text-slate-500"><tr><th className="pb-2 font-medium">{t("payment.orderId")}</th><th className="pb-2 font-medium">{t("payment.product")}</th><th className="pb-2 font-medium">{t("payment.amount")}</th><th className="pb-2 font-medium">{t("payment.status")}</th><th className="pb-2 text-right font-medium">{t("payment.date")}</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {paymentHistoryQuery.data.map((transaction) => {
                        const statusKey = transaction.status === "initiated" ? "pending" : transaction.status;
                        const statusClass = statusKey === "paid" ? "text-emerald-200" : statusKey === "pending" ? "text-amber-200" : "text-rose-200";
                        return <tr key={transaction.id} className="text-slate-300"><td className="py-2 pr-3 font-mono">{transaction.orderId}</td><td className="py-2 pr-3">{transaction.productName}</td><td className="py-2 pr-3">{formatCurrency(transaction.amountMinor / 100, transaction.currency)}</td><td className={`py-2 pr-3 font-semibold ${statusClass}`}>{t(`payment.${statusKey}`)}</td><td className="py-2 text-right text-slate-400">{formatDate(new Date(transaction.createdAt))}</td></tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="mt-3 text-xs text-slate-400">{t("payment.noTransactions")}</p>}
            </section>
            
            <div className="profile-actions">
              {currentMode && (
                <DualModeButton
                  targetUserId={user.id}
                  currentMode={currentMode.currentMode}
                />
              )}
              <button className="action-btn secondary">
                <MessageCircle size={18} /> {t("profile.message")}
              </button>
              <button className="action-btn secondary">
                <Share2 size={18} /> {t("profile.share")}
              </button>
            </div>
            
            {currentMode?.currentMode === "social" && <div className="mt-4 rounded-xl border border-purple-300/20 bg-purple-500/5 p-3"><span className="text-xs font-semibold uppercase tracking-wider text-purple-200">{t("profile.followers")}</span><div className="mt-2 flex flex-wrap gap-2">{followersPreview?.followers.map((person) => <span key={person.id} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">{person.name || t("profile.communityMember")}</span>)}{followersPreview?.followers.length === 0 && <span className="text-xs text-slate-400">{t("profile.followerListEmpty")}</span>}</div></div>}
            {currentMode?.currentMode === "creator" && <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-500/5 p-3"><span className="text-xs font-semibold uppercase tracking-wider text-rose-200">{t("profile.subscribers")}</span><div className="mt-2 flex flex-wrap gap-2">{subscribersPreview?.subscribers.map((person) => <span key={person.id} className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">{person.name || t("profile.subscriber")}</span>)}{subscribersPreview?.subscribers.length === 0 && <span className="text-xs text-slate-400">{t("profile.subscriberListEmpty")}</span>}</div></div>}

            {levelStats && (
              <div className="mt-4">
                <LevelProgressBar
                  currentLevel={levelStats.currentLevel}
                  followers={levelStats.totalFollowers}
                  showDetails={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📸 {t("profile.posts")}
        </button>
        <button 
          className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          🎬 {t("profile.videos")}
        </button>
        <button 
          className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          🔖 {t("profile.saved")}
        </button>
      </div>

      {/* Level Info */}
      {levelStats && (
        <div className="level-info-section">
          <div className="level-badge-large">
            <LevelBadge 
              level={levelStats.currentLevel} 
              size="lg" 
              showDescription={true}
              followers={levelStats.totalFollowers}
            />
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {activeTab === 'posts' && (
        <div className="posts-grid">
          {posts.map((post) => (
            <div key={post.id} className="post-thumbnail">
              <div className="post-image">{post.image}</div>
              <div className="post-overlay">
                <div className="post-stats">
                  <span>❤️ {post.likes.toLocaleString()}</span>
                  <span>💬 {post.comments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Videos Tab */}
      {activeTab === 'videos' && (
        <div className="posts-grid">
          <div className="empty-state">
            <p>🎬 {t("profile.noVideos")}</p>
          </div>
        </div>
      )}

      {/* Saved Tab */}
      {activeTab === 'saved' && (
        <div className="posts-grid">
          <div className="empty-state">
            <p>🔖 {t("profile.noSavedPosts")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
