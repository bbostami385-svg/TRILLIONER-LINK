import { describe, it, expect, beforeEach, vi } from 'vitest';
import { videosRouter } from './videos';
import * as db from '../db';

vi.mock('../db');

describe('Videos Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTrending', () => {
    it('should return trending videos', async () => {
      const mockVideos = [
        { id: 1, title: 'Video 1', views: 1000 },
        { id: 2, title: 'Video 2', views: 500 },
      ];
      
      vi.mocked(db.getTrendingVideos).mockResolvedValue(mockVideos as any);
      
      const caller = videosRouter.createCaller({} as any);
      const result = await caller.getTrending({ limit: 20 });
      
      expect(result).toEqual(mockVideos);
      expect(db.getTrendingVideos).toHaveBeenCalledWith(20);
    });
  });

  describe('getUserVideos', () => {
    it('should return user videos with pagination', async () => {
      const mockVideos = [{ id: 1, title: 'My Video', userId: 1 }];
      
      vi.mocked(db.getVideosByUserId).mockResolvedValue(mockVideos as any);
      
      const caller = videosRouter.createCaller({} as any);
      const result = await caller.getUserVideos({ userId: 1, limit: 20, offset: 0 });
      
      expect(result).toEqual(mockVideos);
      expect(db.getVideosByUserId).toHaveBeenCalledWith(1, 20, 0);
    });
  });

  describe('getVideo', () => {
    it('should increment views and return video', async () => {
      const mockVideo = { id: 1, title: 'Video', views: 100 };
      
      vi.mocked(db.getVideoById).mockResolvedValue(mockVideo as any);
      vi.mocked(db.incrementVideoViews).mockResolvedValue();
      
      const caller = videosRouter.createCaller({} as any);
      const result = await caller.getVideo({ videoId: 1 });
      
      expect(result).toEqual(mockVideo);
      expect(db.incrementVideoViews).toHaveBeenCalledWith(1);
    });

    it('should throw error if video not found', async () => {
      vi.mocked(db.getVideoById).mockResolvedValue(null);
      
      const caller = videosRouter.createCaller({} as any);
      
      expect(caller.getVideo({ videoId: 999 })).rejects.toThrow('Video not found');
    });
  });
});
