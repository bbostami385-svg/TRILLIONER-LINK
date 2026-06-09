import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Bell, Lock, Globe, Palette, LogOut, ChevronRight } from "lucide-react";
import "./Settings.css";

export default function Settings() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    messages: true,
    follows: true,
  });

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
        <p>Manage your account and preferences</p>
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
          <button className="danger-btn">
            <LogOut size={18} />
            Log Out
          </button>
          <button className="danger-btn delete">Delete Account</button>
        </div>
      </div>
    </div>
  );
}
