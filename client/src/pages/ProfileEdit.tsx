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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
