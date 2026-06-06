import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import './Stories.css';

interface Story {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  caption?: string;
  views: number;
  createdAt: Date;
  expiresAt: Date;
}

export default function Stories() {
  const [stories] = useState<Story[]>([
    {
      id: 1,
      userId: 1,
      userName: 'Sarah Ahmed',
      userAvatar: '👩',
      mediaUrl: 'https://example.com/story1.jpg',
      mediaType: 'image',
      caption: 'Beautiful sunset at the beach 🌅',
      views: 234,
      createdAt: new Date(Date.now() - 3600000),
      expiresAt: new Date(Date.now() + 82800000),
    },
    {
      id: 2,
      userId: 2,
      userName: 'Alex Khan',
      userAvatar: '👨',
      mediaUrl: 'https://example.com/story2.jpg',
      mediaType: 'image',
      caption: 'Coffee time ☕',
      views: 567,
      createdAt: new Date(Date.now() - 7200000),
      expiresAt: new Date(Date.now() + 79200000),
    },
    {
      id: 3,
      userId: 3,
      userName: 'Priya Singh',
      userAvatar: '👩‍🦰',
      mediaUrl: 'https://example.com/story3.jpg',
      mediaType: 'image',
      caption: 'Workout done! 💪',
      views: 892,
      createdAt: new Date(Date.now() - 10800000),
      expiresAt: new Date(Date.now() + 75600000),
    },
    {
      id: 4,
      userId: 4,
      userName: 'Ravi Patel',
      userAvatar: '👨‍💼',
      mediaUrl: 'https://example.com/story4.jpg',
      mediaType: 'image',
      caption: 'New project launch 🚀',
      views: 1203,
      createdAt: new Date(Date.now() - 14400000),
      expiresAt: new Date(Date.now() + 72000000),
    },
  ]);

  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  React.useEffect(() => {
    if (!selectedStory) return;

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          const nextIndex = stories.findIndex((s) => s.id === selectedStory.id) + 1;
          if (nextIndex < stories.length) {
            setSelectedStory(stories[nextIndex]);
            return 0;
          } else {
            setSelectedStory(null);
            return 0;
          }
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [selectedStory, stories]);

  return (
    <div className="stories-container">
      <div className="stories-header">
        <h1>Stories</h1>
        <button className="upload-story-btn">
          <Plus size={20} /> Add Story
        </button>
      </div>

      {selectedStory && (
        <div className="story-viewer">
          <div className="story-progress-bar">
            <div 
              className="story-progress-fill"
              style={{ width: `${storyProgress}%` }}
            />
          </div>

          <div className="story-header">
            <div className="story-user-info">
              <span className="story-avatar">{selectedStory.userAvatar}</span>
              <div>
                <p className="story-username">{selectedStory.userName}</p>
                <p className="story-time">2 hours ago</p>
              </div>
            </div>
            <button 
              className="story-close-btn"
              onClick={() => setSelectedStory(null)}
            >
              <X size={24} />
            </button>
          </div>

          <div className="story-content">
            <div className="story-media">📸</div>
            {selectedStory.caption && (
              <div className="story-caption">{selectedStory.caption}</div>
            )}
          </div>

          <div className="story-footer">
            <span className="story-views">👁️ {selectedStory.views} views</span>
            <div className="story-actions">
              <button className="story-action-btn">❤️</button>
              <button className="story-action-btn">💬</button>
              <button className="story-action-btn">↗️</button>
            </div>
          </div>

          <button 
            className="story-prev-btn"
            onClick={() => {
              const prevIndex = stories.findIndex((s) => s.id === selectedStory.id) - 1;
              if (prevIndex >= 0) {
                setSelectedStory(stories[prevIndex]);
                setStoryProgress(0);
              }
            }}
          >
            ‹
          </button>
          <button 
            className="story-next-btn"
            onClick={() => {
              const nextIndex = stories.findIndex((s) => s.id === selectedStory.id) + 1;
              if (nextIndex < stories.length) {
                setSelectedStory(stories[nextIndex]);
                setStoryProgress(0);
              }
            }}
          >
            ›
          </button>
        </div>
      )}

      <div className="stories-list">
        <div className="story-item add-story">
          <div className="story-add-placeholder">
            <Plus size={32} />
            <p>Your Story</p>
          </div>
        </div>

        {stories.map((story) => (
          <div 
            key={story.id}
            className="story-item"
            onClick={() => {
              setSelectedStory(story);
              setStoryProgress(0);
            }}
          >
            <div className="story-avatar-large">{story.userAvatar}</div>
            <div className="story-border" />
            <p className="story-name">{story.userName.split(' ')[0]}</p>
          </div>
        ))}
      </div>

      <div className="stories-section">
        <h2>Recent Stories</h2>
        <div className="stories-grid">
          {stories.map((story) => (
            <div 
              key={story.id}
              className="story-card"
              onClick={() => {
                setSelectedStory(story);
                setStoryProgress(0);
              }}
            >
              <div className="story-card-media">📸</div>
              <div className="story-card-info">
                <p className="story-card-username">{story.userName}</p>
                <p className="story-card-time">2 hours ago</p>
              </div>
              <span className="story-card-views">👁️ {story.views}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
