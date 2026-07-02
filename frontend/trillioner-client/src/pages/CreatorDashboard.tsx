import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { TrendingUp, Users, Heart, DollarSign, Eye, Share2 } from "lucide-react";
import "./CreatorDashboard.css";

export default function CreatorDashboard() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [timeRange, setTimeRange] = useState("7d");

  if (!isAuthenticated) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <p>Please log in to access creator dashboard</p>
          <Button onClick={() => setLocation("/signup")} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Total Views",
      value: "125.4K",
      change: "+12.5%",
      icon: Eye,
      color: "blue",
    },
    {
      label: "Followers",
      value: "8,234",
      change: "+234",
      icon: Users,
      color: "purple",
    },
    {
      label: "Total Likes",
      value: "45.2K",
      change: "+8.3%",
      icon: Heart,
      color: "red",
    },
    {
      label: "Earnings",
      value: "₹12,450",
      change: "+₹2,340",
      icon: DollarSign,
      color: "green",
    },
  ];

  const topPosts = [
    {
      id: 1,
      title: "My First Vlog",
      views: 45230,
      likes: 3421,
      comments: 234,
      shares: 123,
      date: "2 days ago",
    },
    {
      id: 2,
      title: "Tutorial: How to Edit Videos",
      views: 32145,
      likes: 2341,
      comments: 156,
      shares: 89,
      date: "5 days ago",
    },
    {
      id: 3,
      title: "Q&A with Followers",
      views: 28934,
      likes: 1923,
      comments: 234,
      shares: 67,
      date: "1 week ago",
    },
  ];

  const earningsData = [
    { date: "Mon", amount: 1200 },
    { date: "Tue", amount: 1900 },
    { date: "Wed", amount: 1500 },
    { date: "Thu", amount: 2200 },
    { date: "Fri", amount: 1800 },
    { date: "Sat", amount: 2500 },
    { date: "Sun", amount: 1600 },
  ];

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Creator Dashboard</h1>
          <p>Welcome back! Here's your performance overview</p>
        </div>
        <div className="time-range-selector">
          {["7d", "30d", "90d", "1y"].map((range) => (
            <button
              key={range}
              className={`range-btn ${timeRange === range ? "active" : ""}`}
              onClick={() => setTimeRange(range)}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "1 Year"}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`stat-card ${stat.color}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-change">
                  <TrendingUp size={14} />
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Earnings Chart */}
        <div className="chart-section">
          <h2>Weekly Earnings</h2>
          <div className="chart">
            <div className="chart-bars">
              {earningsData.map((data, index) => (
                <div key={index} className="bar-container">
                  <div
                    className="bar"
                    style={{
                      height: `${(data.amount / 2500) * 100}%`,
                    }}
                  ></div>
                  <p className="bar-label">{data.date}</p>
                  <p className="bar-value">₹{data.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Posts */}
        <div className="top-posts-section">
          <h2>Top Performing Posts</h2>
          <div className="posts-table">
            <div className="table-header">
              <div className="col-title">Post Title</div>
              <div className="col-stat">Views</div>
              <div className="col-stat">Likes</div>
              <div className="col-stat">Comments</div>
              <div className="col-stat">Shares</div>
              <div className="col-date">Date</div>
            </div>

            {topPosts.map((post) => (
              <div key={post.id} className="table-row">
                <div className="col-title">{post.title}</div>
                <div className="col-stat">
                  <Eye size={14} />
                  {post.views.toLocaleString()}
                </div>
                <div className="col-stat">
                  <Heart size={14} />
                  {post.likes.toLocaleString()}
                </div>
                <div className="col-stat">{post.comments}</div>
                <div className="col-stat">
                  <Share2 size={14} />
                  {post.shares}
                </div>
                <div className="col-date">{post.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Creator Fund Info */}
      <div className="creator-fund-section">
        <h2>Creator Fund</h2>
        <div className="fund-info">
          <div className="fund-card">
            <h3>Total Earnings</h3>
            <p className="fund-amount">₹12,450</p>
            <p className="fund-subtitle">From 234 posts</p>
          </div>
          <div className="fund-card">
            <h3>Pending Payout</h3>
            <p className="fund-amount">₹2,340</p>
            <p className="fund-subtitle">Next payout: 5 days</p>
          </div>
          <div className="fund-card">
            <h3>Withdrawal History</h3>
            <button className="view-btn">View Details</button>
          </div>
        </div>
      </div>

      {/* Monetization Settings */}
      <div className="monetization-section">
        <h2>Monetization Settings</h2>
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Ad Revenue Sharing</h4>
              <p>Earn from ads shown on your content</p>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Sponsorship Opportunities</h4>
              <p>Get brand collaboration offers</p>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h4>Super Likes & Tips</h4>
              <p>Allow followers to send you tips</p>
            </div>
            <label className="toggle">
              <input type="checkbox" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
