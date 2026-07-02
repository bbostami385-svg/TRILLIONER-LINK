import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Settings, Edit2, UserPlus, UserCheck } from 'lucide-react';
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
              <h1>{user.name}</h1>
              <button className="settings-btn">
                <Settings size={20} />
              </button>
            </div>
            
            <p className="profile-bio">{user.bio}</p>
            
            {user.website && (
              <a href={`https://${user.website}`} className="profile-website">
                🔗 {user.website}
              </a>
            )}
            
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">{user.posts}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat">
                <span className="stat-value">{user.followers.toLocaleString()}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat">
                <span className="stat-value">{user.following.toLocaleString()}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
            
            <div className="profile-actions">
              <button 
                className={`action-btn ${isFollowing ? 'following' : ''}`}
                onClick={() => setIsFollowing(!isFollowing)}
              >
                {isFollowing ? (
                  <>
                    <UserCheck size={18} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Follow
                  </>
                )}
              </button>
              <button className="action-btn secondary">
                <MessageCircle size={18} /> Message
              </button>
              <button className="action-btn secondary">
                <Share2 size={18} /> Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📸 Posts
        </button>
        <button 
          className={`tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          🎬 Videos
        </button>
        <button 
          className={`tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          🔖 Saved
        </button>
      </div>

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
            <p>🎬 No videos yet</p>
          </div>
        </div>
      )}

      {/* Saved Tab */}
      {activeTab === 'saved' && (
        <div className="posts-grid">
          <div className="empty-state">
            <p>🔖 No saved posts yet</p>
          </div>
        </div>
      )}
    </div>
  );
}
