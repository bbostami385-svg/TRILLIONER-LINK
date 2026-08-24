import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Camera, Save, AlertCircle } from "lucide-react";
import "./ProfileEdit.css";

export default function ProfileEdit() {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    website: "",
    email: "",
    handle: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfileMutation.mutateAsync({
        name: formData.name,
        bio: formData.bio,
        website: formData.website,
        profileImage: profileImage || undefined,
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
