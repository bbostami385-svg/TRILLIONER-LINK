import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Bell, Lock, Globe, Palette, LogOut, ChevronRight, Zap, Trophy, MailPlus } from "lucide-react";
import { ModeSelector } from "@/components/ModeSelector";
import { ModeIndicator } from "@/components/ModeIndicator";
import { LevelBadge } from "@/components/LevelBadge";
import { LevelProgressBar } from "@/components/LevelProgressBar";
import { Leaderboard } from "@/components/Leaderboard";
import { LivenessVerification } from "@/components/LivenessVerification";
import { KYCForm } from "@/components/KYCForm";
import { SocialLinking } from "@/components/SocialLinking";
import { VerificationStatusTracker } from "@/components/VerificationStatusTracker";
import { trpc } from "@/lib/trpc";
import "./Settings.css";

export default function Settings() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const [verificationSection, setVerificationSection] = useState<"human" | "kyc" | "accounts">("human");
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    messages: true,
    follows: true,
  });

  // Queries
  const { data: currentMode, isLoading: modeLoading } =
    trpc.dualMode.getCurrentMode.useQuery();
  const { data: levelStats, isLoading: levelLoading } =
    trpc.levels.getLevelStats.useQuery();

  // Mutations
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = "/";
  };

  const handleModeChanged = () => {
    setShowModeSelector(false);
    utils.dualMode.getCurrentMode.invalidate();
    utils.dualMode.getModeStatistics.invalidate();
  };

  if (!isAuthenticated) {
    return (
      <div className="settings-container">
        <div className="loading">
          <p>Please log in to access settings</p>
          <Button onClick={() => setLocation("/signup")} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const settingsSections = [
    {
      title: "Account",
      icon: Lock,
      items: [
        { label: "Change Password", action: "password" },
        { label: "Two-Factor Authentication", action: "2fa" },
        { label: "Connected Accounts", action: "accounts" },
        { label: "Session Management", action: "sessions" },
      ],
    },
    {
      title: "Privacy & Safety",
      icon: Lock,
      items: [
        { label: "Privacy Settings", action: "privacy" },
        { label: "Blocked Users", action: "blocked" },
        { label: "Muted Accounts", action: "muted" },
        { label: "Report Settings", action: "report" },
      ],
    },
    {
      title: "Preferences",
      icon: Palette,
      items: [
        { label: "Theme", action: "theme" },
        { label: "Language", action: "language" },
        { label: "Content Preferences", action: "content" },
        { label: "Accessibility", action: "accessibility" },
      ],
    },
    {
      title: "Help & Support",
      icon: Globe,
      items: [
        { label: "Help Center", action: "help" },
        { label: "Contact Support", action: "support" },
        { label: "Report a Bug", action: "bug" },
        { label: "Feedback", action: "feedback" },
      ],
    },
  ];

  return (
    <div className="settings-container">
      {/* Header */}
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account, mode, and level</p>
      </div>

      {/* Account Overview */}
      <div className="account-overview">
        <div className="account-info">
          <div className="account-avatar">👤</div>
          <div>
            <h3>{user?.name || "User"}</h3>
            <p>{user?.email || "user@example.com"}</p>
          </div>
        </div>
        <Button className="edit-profile-btn">Edit Profile</Button>
      </div>

      {/* Tab Navigation */}
      <div className="settings-section">
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === "account" ? "active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            Account
          </button>
          <button
            className={`tab-button ${activeTab === "mode" ? "active" : ""}`}
            onClick={() => setActiveTab("mode")}
          >
            <Zap size={18} />
            Mode
          </button>
          <button
            className={`tab-button ${activeTab === "level" ? "active" : ""}`}
            onClick={() => setActiveTab("level")}
          >
            <Trophy size={18} />
            Level
          </button>
          <button
            className={`tab-button ${activeTab === "verification" ? "active" : ""}`}
            onClick={() => setActiveTab("verification")}
          >
            <Lock size={18} />
            Verification
          </button>
        </div>
      </div>

      {/* Account Tab */}
      {activeTab === "account" && (
        <>
          <div className="settings-section"><div className="section-header"><MailPlus size={20} /><div><h2>Invite your circle</h2><p>Share a secure, expiring link with friends.</p></div></div><Button onClick={() => setLocation("/invitations")} className="w-full justify-between bg-indigo-500 text-white hover:bg-indigo-400">Open invitation center<ChevronRight size={18} /></Button><Button onClick={() => setLocation("/profile-rewards")} variant="outline" className="mt-3 w-full justify-between border-cyan-300/25 bg-cyan-500/10 text-cyan-100 hover:bg-cyan-500/20">Open profile cosmetics<ChevronRight size={18} /></Button><Button onClick={() => setLocation("/subscription-topics")} variant="outline" className="mt-3 w-full justify-between border-emerald-300/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20">Organize subscriptions<ChevronRight size={18} /></Button>{user?.accountMode === "creator" && <Button onClick={() => setLocation("/creator-playlists")} variant="outline" className="mt-3 w-full justify-between border-indigo-300/25 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20">Manage creator playlists<ChevronRight size={18} /></Button>}</div>

          {/* Notification Settings */}
          <div className="settings-section">
            <div className="section-header">
              <Bell size={20} />
              <h2>Notifications</h2>
            </div>
            <div className="settings-list">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="setting-item">
                  <div className="setting-info">
                    <h4>{key.charAt(0).toUpperCase() + key.slice(1)} Notifications</h4>
                    <p>Get notified when someone {key}s your content</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          [key]: e.target.checked,
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Settings */}
          <div className="settings-section">
            <div className="section-header">
              <Palette size={20} />
              <h2>Appearance</h2>
            </div>
            <div className="settings-list">
              <div className="setting-item">
                <div className="setting-info">
                  <h4>Dark Mode</h4>
                  <p>Use dark theme for better visibility at night</p>
                </div>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Language</h4>
                  <p>Choose your preferred language</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="language-select"
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>
            </div>
          </div>

          {/* Settings Sections */}
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="settings-section">
                <div className="section-header">
                  <Icon size={20} />
                  <h2>{section.title}</h2>
                </div>
                <div className="settings-list">
                  {section.items.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      className="setting-link"
                      onClick={() => console.log(`Navigate to ${item.action}`)}
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Danger Zone */}
          <div className="settings-section danger-zone">
            <h2>Danger Zone</h2>
            <div className="danger-actions">
              <button className="danger-btn" onClick={handleLogout}>
                <LogOut size={18} />
                Log Out
              </button>
              <button className="danger-btn delete">Delete Account</button>
            </div>
          </div>
        </>
      )}

      {/* Verification Tab */}
      {activeTab === "verification" && (
        <div className="settings-section">
          <div className="section-header">
            <Lock size={20} />
            <div>
              <h2>Security & Verification</h2>
              <p className="text-sm text-gray-500">Human verification protects accounts; KYC is only needed for monetization.</p>
            </div>
          </div>
          <div className="mb-6"><VerificationStatusTracker /></div>
          <div className="flex flex-wrap gap-2 border-b pb-4 mb-6">
            <Button variant={verificationSection === "human" ? "default" : "outline"} onClick={() => setVerificationSection("human")}>Human Verification</Button>
            <Button variant={verificationSection === "kyc" ? "default" : "outline"} onClick={() => setVerificationSection("kyc")}>Monetization KYC</Button>
            <Button variant={verificationSection === "accounts" ? "default" : "outline"} onClick={() => setVerificationSection("accounts")}>Linked Accounts</Button>
          </div>
          {verificationSection === "human" && (
            <div className="space-y-4">
              <Card className="p-5 border-blue-200 bg-blue-50/60">
                <h3 className="font-semibold text-blue-950">Human verification, not identity verification</h3>
                <p className="text-sm text-blue-900/80 mt-1">You may be asked to move your head or blink so the system can distinguish a real person from an automated account. This does not verify your name or government identity.</p>
              </Card>
              <LivenessVerification />
            </div>
          )}
          {verificationSection === "kyc" && (
            <div className="space-y-4">
              <Card className="p-5 border-amber-200 bg-amber-50/60">
                <h3 className="font-semibold text-amber-950">KYC is only for financial features</h3>
                <p className="text-sm text-amber-900/80 mt-1">Identity documents are requested only when you apply for monetization, payouts, or another regulated financial feature. Submitting KYC does not happen during ordinary account creation.</p>
              </Card>
              <KYCForm />
            </div>
          )}
          {verificationSection === "accounts" && (
            <div className="space-y-4">
              <Card className="p-5 border-purple-200 bg-purple-50/60">
                <h3 className="font-semibold text-purple-950">Connect other platforms</h3>
                <p className="text-sm text-purple-900/80 mt-1">Link YouTube, Google, Facebook, Instagram, or TikTok from a desktop browser using the provider’s OAuth consent screen. We do not collect your provider password.</p>
              </Card>
              <SocialLinking />
            </div>
          )}
        </div>
      )}

      {/* Mode Tab */}
      {activeTab === "mode" && (
        <div className="settings-section">
          <div className="section-header">
            <Zap size={20} />
            <h2>Platform Mode</h2>
          </div>

          {modeLoading ? (
            <div className="loading">Loading mode settings...</div>
          ) : (
            <>
              {/* Current Mode */}
              <div className="mode-card">
                <div className="mode-header">
                  <div>
                    <h3>Current Mode</h3>
                    <p>
                      You're currently using{" "}
                      <span className="font-semibold">
                        {currentMode?.currentMode === "social" ? "Social Mode" : "Creator Mode"}
                      </span>
                    </p>
                  </div>
                  {currentMode && (
                    <ModeIndicator mode={currentMode.currentMode} size="lg" />
                  )}
                </div>

                {/* Mode Statistics */}
                {currentMode?.statistics && (
                  <div className="mode-stats">
                    <div className="stat-item">
                      <div className="stat-value">
                        {currentMode.currentMode === "social"
                          ? currentMode.statistics.followers
                          : currentMode.statistics.subscribers}
                      </div>
                      <div className="stat-label">
                        {currentMode.currentMode === "social" ? "Followers" : "Subscribers"}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {currentMode.currentMode === "social"
                          ? currentMode.statistics.following
                          : currentMode.statistics.totalVideos}
                      </div>
                      <div className="stat-label">
                        {currentMode.currentMode === "social" ? "Following" : "Videos"}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">
                        {currentMode.statistics.totalPosts || currentMode.statistics.totalViews}
                      </div>
                      <div className="stat-label">
                        {currentMode.currentMode === "social" ? "Posts" : "Views"}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Switch Mode Button */}
              <Button
                onClick={() => setShowModeSelector(true)}
                className="mode-switch-btn"
              >
                <Zap size={18} />
                Switch to {currentMode?.currentMode === "social" ? "Creator" : "Social"} Mode
              </Button>

              {/* Mode Selector Modal */}
              {showModeSelector && (
                <div className="mode-modal-overlay">
                  <Card className="mode-modal">
                    <div className="mode-modal-header">
                      <h3>Switch Platform Mode</h3>
                      <button
                        onClick={() => setShowModeSelector(false)}
                        className="close-btn"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mode-modal-content">
                      <ModeSelector onModeSelected={handleModeChanged} />
                    </div>
                  </Card>
                </div>
              )}

              {/* Mode Information */}
              <div className="mode-info-grid">
                <Card className="mode-info-card social">
                  <h4>Social Mode</h4>
                  <ul>
                    <li>✓ Follow & Followers</li>
                    <li>✓ Share Posts & Photos</li>
                    <li>✓ Stories & Reels</li>
                    <li>✓ Like & Comment</li>
                  </ul>
                </Card>

                <Card className="mode-info-card creator">
                  <h4>Creator Mode</h4>
                  <ul>
                    <li>✓ Subscribe & Subscribers</li>
                    <li>✓ Upload Videos</li>
                    <li>✓ View Analytics</li>
                    <li>✓ Monetization Options</li>
                  </ul>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* Level Tab */}
      {activeTab === "level" && (
        <div className="settings-section">
          <div className="section-header">
            <Trophy size={20} />
            <h2>Your Level</h2>
          </div>

          {levelLoading ? (
            <div className="loading">Loading level data...</div>
          ) : (
            <>
              {/* Current Level */}
              <div className="level-card">
                <div className="level-header">
                  <div>
                    <h3>Current Level</h3>
                    <p>Keep growing to unlock higher levels and special features</p>
                  </div>
                  {levelStats && (
                    <LevelBadge
                      level={levelStats.currentLevel}
                      size="lg"
                      showDescription
                      followers={levelStats.totalFollowers}
                    />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {levelStats && (
                <div className="level-progress">
                  <LevelProgressBar
                    currentLevel={levelStats.currentLevel}
                    followers={levelStats.totalFollowers}
                    showDetails
                  />
                </div>
              )}

              {/* Level Statistics */}
              {levelStats && (
                <div className="level-stats-grid">
                  <Card className="level-stat-card">
                    <div className="stat-number">{levelStats.currentLevel}</div>
                    <div className="stat-text">Current Level</div>
                  </Card>

                  <Card className="level-stat-card">
                    <div className="stat-number">{levelStats.totalFollowers}</div>
                    <div className="stat-text">Total Followers</div>
                  </Card>

                  <Card className="level-stat-card">
                    <div className="stat-number">
                      {levelStats.currentLevel === 20 ? "∞" : levelStats.nextLevelThreshold}
                    </div>
                    <div className="stat-text">Next Target</div>
                  </Card>
                </div>
              )}

              {/* Leaderboard */}
              <div className="leaderboard-section">
                <h3>Top Creators</h3>
                <Leaderboard limit={10} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
