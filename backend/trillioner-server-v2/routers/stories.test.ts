import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storiesRouter } from './stories';
import * as db from '../db';

vi.mock('../db');

describe('Stories Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserStories', () => {
    it('should return user stories', async () => {
      const mockStories = [
        { id: 1, userId: 1, mediaUrl: 'http://example.com/story1.jpg' },
      ];
      
      vi.mocked(db.getStoriesByUserId).mockResolvedValue(mockStories as any);
      
      const caller = storiesRouter.createCaller({} as any);
      const result = await caller.getUserStories({ userId: 1 });
      
      expect(result).toEqual(mockStories);
      expect(db.getStoriesByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe('createStory', () => {
    it('should create a story', async () => {
      const mockStory = {
        id: 1,
        userId: 1,
        mediaUrl: 'http://example.com/story.jpg',
        mediaType: 'image' as const,
      };
      
      vi.mocked(db.createStory).mockResolvedValue(mockStory as any);
      
      const caller = storiesRouter.createCaller({
        user: { id: 1 },
      } as any);
      
      const result = await caller.createStory({
        mediaUrl: 'http://example.com/story.jpg',
        mediaType: 'image',
        caption: 'My story',
      });
      
      expect(result).toEqual(mockStory);
      expect(db.createStory).toHaveBeenCalled();
    });
  });

  describe('viewStory', () => {
    it('should increment story views', async () => {
      vi.mocked(db.incrementStoryViews).mockResolvedValue();
      
      const caller = storiesRouter.createCaller({} as any);
      const result = await caller.viewStory({ storyId: 1 });
      
      expect(result).toEqual({ success: true });
      expect(db.incrementStoryViews).toHaveBeenCalledWith(1);
    });
  });
});
