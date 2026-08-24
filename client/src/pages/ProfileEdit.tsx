import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Camera, Save, AlertCircle, GripVertical } from "lucide-react";
import "./ProfileEdit.css";

const socialProviders = ["facebook", "instagram", "twitter", "youtube", "tiktok"] as const;
function readSocialValue(value: unknown, provider: string) { const root = value && typeof value === "object" ? (value as Record<string, unknown>) : {}; const links = root.socialLinks && typeof root.socialLinks === "object" ? (root.socialLinks as Record<string, unknown>) : {}; return typeof links[provider] === "string" ? links[provider] : ""; }
function readSocialOrder(value: unknown): Array<(typeof socialProviders)[number]> { const root = value && typeof value === "object" ? (value as Record<string, unknown>) : {}; const requested = Array.isArray(root.socialLinkOrder) ? root.socialLinkOrder.filter((item): item is (typeof socialProviders)[number] => typeof item === "string" && socialProviders.includes(item as (typeof socialProviders)[number])) : []; return Array.from(new Set([...requested, ...socialProviders])) as Array<(typeof socialProviders)[number]>; }

export default function ProfileEdit() {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    website: "",
    email: "",
    handle: "",
    facebook: "",
    instagram: "",
    twitter: "",
    youtube: "",
    tiktok: "",
    socialLinkOrder: [...socialProviders],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const handleAvailability = trpc.profileEdit.checkHandleAvailability.useQuery({ handle: formData.handle }, { enabled: isAuthenticated && formData.handle.replace(/^@+/, "").trim().length > 0, retry: false, staleTime: 5_000 });
  const handleSuggestions = trpc.profileEdit.suggestHandles.useQuery({ handle: formData.handle, limit: 6 }, { enabled: isAuthenticated && handleAvailability.data?.available === false, retry: false, staleTime: 5_000 });
  const claimHandleMutation = trpc.profileEdit.claimHandle.useMutation({ onSuccess: () => { setSuccess("Handle saved successfully!"); setSaving(false); }, onError: (error) => { setError(error.message || "Could not save handle"); setSaving(false); } });

  // Fetch profile data
  const { data: profile } = trpc.profileEdit.getProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Get user stats
  const { data: stats } = trpc.profileEdit.getUserStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = trpc.profileEdit.updateProfile.useMutation({
    onSuccess: () => {
      setSuccess("Profile updated successfully!");
      setSaving(false);
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (error) => {
      setError(error.message || "Failed to update profile");
      setSaving(false);
    },
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        website: profile.website || "",
        email: profile.email || "",
        handle: profile.handle || "",
        facebook: readSocialValue(profile.linkedAccounts, "facebook"),
        instagram: readSocialValue(profile.linkedAccounts, "instagram"),
        twitter: readSocialValue(profile.linkedAccounts, "twitter"),
        youtube: readSocialValue(profile.linkedAccounts, "youtube"),
        tiktok: readSocialValue(profile.linkedAccounts, "tiktok"),
        socialLinkOrder: readSocialOrder(profile.linkedAccounts),
      });
      if (profile.profileImage) {
        setProfileImage(profile.profileImage);
      }
      setLoading(false);
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const moveSocialLink = (source: (typeof socialProviders)[number], target: (typeof socialProviders)[number]) => { if (source === target) return; setFormData((previous) => { const next = [...previous.socialLinkOrder]; const from = next.indexOf(source); const to = next.indexOf(target); if (from < 0 || to < 0) return previous; next.splice(from, 1); next.splice(to, 0, source); return { ...previous, socialLinkOrder: next }; }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        bio: formData.bio,
        website: formData.website,
        profileImage: profileImage || undefined,
        socialLinks: { facebook: formData.facebook || undefined, instagram: formData.instagram || undefined, twitter: formData.twitter || undefined, youtube: formData.youtube || undefined, tiktok: formData.tiktok || undefined },
        socialLinkOrder: formData.socialLinkOrder,
      });
      if (formData.handle.trim()) await claimHandleMutation.mutateAsync({ handle: formData.handle });
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="profile-edit-container">
        <div className="auth-required">
          <AlertCircle size={48} />
          <p>Please log in to edit your profile</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-edit-container">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="profile-edit-container">
      <div className="profile-edit-wrapper">
        {/* Header */}
        <div className="profile-edit-header">
          <h1>Edit Profile</h1>
          <p>Update your profile information</p>
        </div>

        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="profile-picture">
            {profileImage ? (
              <img src={profileImage} alt="Profile" />
            ) : (
              <div className="placeholder">
                <Camera size={40} />
              </div>
            )}
          </div>
          <label className="upload-button">
            <Camera size={20} />
            Change Photo
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
          </label>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="profile-edit-form">
          {/* Error Message */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="alert alert-success">
              <span>✓</span>
              {success}
            </div>
          )}

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              maxLength={100}
            />
            <span className="char-count">{formData.name.length}/100</span>
          </div>

          {/* Handle Field */}
          <div className="form-group">
            <label htmlFor="handle">Unique handle</label>
            <div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span><input type="text" id="handle" name="handle" value={formData.handle.replace(/^@+/, "")} onChange={handleInputChange} placeholder="your-unique-handle" maxLength={30} autoCapitalize="none" autoCorrect="off" spellCheck={false} className="pl-8" /></div>
            <span className={`hint ${handleAvailability.data?.available ? "text-emerald-600" : handleAvailability.data ? "text-rose-600" : ""}`}>{handleAvailability.isFetching ? "Checking availability…" : handleAvailability.data?.message ?? "3–30 lowercase letters, numbers, dots, underscores, or hyphens."}</span>
            {handleAvailability.data?.available === false && <div className="mt-2 rounded-xl border border-amber-200/30 bg-amber-50/10 p-3"><p className="text-xs font-semibold text-amber-700">Try an available variation</p><div className="mt-2 flex flex-wrap gap-2">{handleSuggestions.isFetching ? <span className="text-xs text-slate-500">Finding available handles…</span> : handleSuggestions.data?.map((suggestion) => <button type="button" key={suggestion} onClick={() => setFormData((prev) => ({ ...prev, handle: suggestion }))} className="rounded-full border border-indigo-200/40 px-3 py-1 text-xs font-medium text-indigo-700 transition hover:bg-indigo-50">@{suggestion}</button>)}</div></div>}
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              disabled
            />
            <span className="hint">Email cannot be changed here</span>
          </div>

          {/* Bio Field */}
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              maxLength={500}
              rows={4}
            />
            <span className="char-count">{formData.bio.length}/500</span>
          </div>

          {/* Website Field */}
          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
            />
          </div>

          {/* Social Links */}
          <div className="form-group">
            <label>Social links</label>
            <p className="hint">Add official profile URLs. They appear as a compact link rail on your public profile.</p>
            <div className="grid gap-3">
              <p className="text-xs text-slate-500">Drag a row to choose the order visitors see on your public profile.</p>
              {formData.socialLinkOrder.map((provider) => <div key={provider} draggable onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const source = event.dataTransfer.getData("text/social-provider"); moveSocialLink(source as (typeof socialProviders)[number], provider); }} onDragStart={(event) => event.dataTransfer.setData("text/social-provider", provider)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/10 p-2"><GripVertical className="h-4 w-4 shrink-0 cursor-grab text-slate-500" aria-hidden="true" /><input type="url" name={provider} value={formData[provider]} onChange={handleInputChange} placeholder={`https://${provider === "twitter" ? "x.com" : provider}.com/your-profile`} aria-label={`${provider} profile URL`} className="min-w-0 flex-1" /><span className="text-[10px] uppercase tracking-wider text-slate-500">drag</span></div>)}
            </div>
          </div>

          {/* Stats Display */}
          {stats && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.postsCount}</div>
                <div className="stat-label">Posts</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.followersCount}</div>
                <div className="stat-label">Followers</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.followingCount}</div>
                <div className="stat-label">Following</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.videosCount}</div>
                <div className="stat-label">Videos</div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="form-actions">
            <Button type="submit" className="save-btn" disabled={saving}>
              <Save size={20} />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" className="cancel-btn" onClick={() => window.history.back()}>
              Cancel
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="danger-zone">
          <h3>Danger Zone</h3>
          <p>Irreversible and destructive actions</p>
          <Button className="delete-btn">Delete Account</Button>
        </div>
      </div>
    </div>
  );
}
