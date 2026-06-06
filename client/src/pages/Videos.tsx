import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Play } from 'lucide-react';
import './Videos.css';

interface Video {
  id: number;
  userId: number;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  views: number;
  likes: number;
  comments: number;
  createdAt: Date;
}

export default function Videos() {
  const [videos] = useState<Video[]>([
    {
      id: 1,
      userId: 1,
      title: 'Amazing Travel Vlog - Dubai',
      description: 'Exploring the beautiful city of Dubai with stunning views',
      videoUrl: 'https://example.com/video1.mp4',
      thumbnailUrl: '🏙️',
      duration: 1245,
      views: 15420,
      likes: 2341,
      comments: 456,
      createdAt: new Date(),
    },
    {
      id: 2,
      userId: 2,
      title: 'Cooking Tutorial - Biryani',
      description: 'Learn how to make authentic biryani at home',
      videoUrl: 'https://example.com/video2.mp4',
      thumbnailUrl: '🍛',
      duration: 890,
      views: 8932,
      likes: 1203,
      comments: 234,
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: 3,
      userId: 3,
      title: 'Fitness Workout - Full Body',
      description: '30 minute full body workout for beginners',
      videoUrl: 'https://example.com/video3.mp4',
      thumbnailUrl: '💪',
      duration: 1800,
      views: 23451,
      likes: 3456,
      comments: 678,
      createdAt: new Date(Date.now() - 172800000),
    },
  ]);

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  return (
    <div className="videos-container">
      <div className="videos-header">
        <h1>Videos</h1>
        <div className="videos-tabs">
          <button className="tab-btn active">Trending</button>
          <button className="tab-btn">Following</button>
          <button className="tab-btn">Subscriptions</button>
        </div>
      </div>

      {selectedVideo && (
        <div className="video-player-section">
          <div className="video-player">
            <div className="video-placeholder">
              <Play className="play-icon" />
              <span>{selectedVideo.thumbnailUrl}</span>
            </div>
          </div>
          <div className="video-details">
            <h2>{selectedVideo.title}</h2>
            <p className="video-description">{selectedVideo.description}</p>
            <div className="video-stats">
              <span>👁️ {selectedVideo.views.toLocaleString()} views</span>
              <span>❤️ {selectedVideo.likes.toLocaleString()} likes</span>
              <span>💬 {selectedVideo.comments.toLocaleString()} comments</span>
            </div>
            <div className="video-actions">
              <button className="action-btn">
                <Heart size={20} /> Like
              </button>
              <button className="action-btn">
                <MessageCircle size={20} /> Comment
              </button>
              <button className="action-btn">
                <Share2 size={20} /> Share
              </button>
            </div>
            <button 
              className="close-btn"
              onClick={() => setSelectedVideo(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="videos-grid">
        {videos.map((video) => (
          <div 
            key={video.id} 
            className="video-card"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="video-thumbnail">
              <div className="thumbnail-placeholder">{video.thumbnailUrl}</div>
              <div className="play-overlay">
                <Play className="play-btn-icon" />
              </div>
              {video.duration && (
                <div className="duration-badge">
                  {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                </div>
              )}
            </div>
            <div className="video-info">
              <h3>{video.title}</h3>
              <p className="video-meta">
                {video.views.toLocaleString()} views • 2 days ago
              </p>
              <div className="video-engagement">
                <span>❤️ {video.likes}</span>
                <span>💬 {video.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
