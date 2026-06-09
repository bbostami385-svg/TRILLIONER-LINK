import { describe, it, expect, beforeEach, vi } from 'vitest';
import { commentsRouter } from './comments';
import * as db from '../db';

vi.mock('../db');

describe('Comments Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPostComments', () => {
    it('should return comments for a post', async () => {
      const mockComments = [
        { id: 1, content: 'Great post!', userId: 1, postId: 1 },
      ];
      
      vi.mocked(db.getCommentsByPostId).mockResolvedValue(mockComments as any);
      
      const caller = commentsRouter.createCaller({} as any);
      const result = await caller.getPostComments({ postId: 1, limit: 50 });
      
      expect(result).toEqual(mockComments);
      expect(db.getCommentsByPostId).toHaveBeenCalledWith(1, 50);
    });
  });

  describe('createComment', () => {
    it('should create a comment on a post', async () => {
      const mockComment = {
        id: 1,
        content: 'Nice!',
        userId: 1,
        postId: 1,
      };
      
      vi.mocked(db.createComment).mockResolvedValue(mockComment as any);
      
      const caller = commentsRouter.createCaller({
        user: { id: 1 },
      } as any);
      
      const result = await caller.createComment({
        content: 'Nice!',
        postId: 1,
      });
      
      expect(result).toEqual(mockComment);
      expect(db.createComment).toHaveBeenCalled();
    });

    it('should throw error if neither postId nor videoId provided', async () => {
      const caller = commentsRouter.createCaller({
        user: { id: 1 },
      } as any);
      
      expect(
        caller.createComment({ content: 'Comment' })
      ).rejects.toThrow('Either postId or videoId is required');
    });
  });

  describe('getReplies', () => {
    it('should return replies to a comment', async () => {
      const mockReplies = [
        { id: 2, content: 'Thanks!', userId: 2, parentCommentId: 1 },
      ];
      
      vi.mocked(db.getReplies).mockResolvedValue(mockReplies as any);
      
      const caller = commentsRouter.createCaller({} as any);
      const result = await caller.getReplies({ commentId: 1 });
      
      expect(result).toEqual(mockReplies);
      expect(db.getReplies).toHaveBeenCalledWith(1);
    });
  });
});
