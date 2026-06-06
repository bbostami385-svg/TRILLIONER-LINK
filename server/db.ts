import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, posts, messages, conversations, likes, follows, 
  videos, stories, comments, notifications, hashtags, postHashtags,
  Post, Message, Conversation, Like, Follow, Video, Story, Comment, Notification, Hashtag
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0] || null;
}

export async function updateUserProfile(userId: number, data: { bio?: string; profileImage?: string; website?: string }) {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(users).set(data).where(eq(users.id, userId));
  return await getUserById(userId);
}

// ============ VIDEO QUERIES ============
export async function createVideo(userId: number, title: string, description: string, videoUrl: string, thumbnailUrl?: string, duration?: number): Promise<Video | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(videos).values({
    userId,
    title,
    description: description || null,
    videoUrl,
    thumbnailUrl: thumbnailUrl || null,
    duration: duration || null,
  });

  if (result[0].insertId) {
    return db.select().from(videos).where(eq(videos.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function getVideoById(videoId: number): Promise<Video | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
  return result[0] || null;
}

export async function getVideosByUserId(userId: number, limit: number = 20, offset: number = 0): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(videos)
    .where(and(eq(videos.userId, userId), eq(videos.isPublic, true)))
    .orderBy(desc(videos.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getTrendingVideos(limit: number = 20): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(videos)
    .where(eq(videos.isPublic, true))
    .orderBy(desc(videos.views))
    .limit(limit);
}

export async function incrementVideoViews(videoId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const video = await getVideoById(videoId);
  if (video) {
    await db.update(videos).set({ views: video.views + 1 }).where(eq(videos.id, videoId));
  }
}

export async function updateVideoLikes(videoId: number, increment: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const video = await getVideoById(videoId);
  if (video) {
    const newLikes = increment ? video.likes + 1 : Math.max(0, video.likes - 1);
    await db.update(videos).set({ likes: newLikes }).where(eq(videos.id, videoId));
  }
}

// ============ STORY QUERIES ============
export async function createStory(userId: number, mediaUrl: string, mediaType: "image" | "video", caption?: string): Promise<Story | null> {
  const db = await getDb();
  if (!db) return null;

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const result = await db.insert(stories).values({
    userId,
    mediaUrl,
    mediaType,
    caption: caption || null,
    expiresAt,
  });

  if (result[0].insertId) {
    return db.select().from(stories).where(eq(stories.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function getStoriesByUserId(userId: number): Promise<Story[]> {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();
  return db.select().from(stories)
    .where(and(
      eq(stories.userId, userId),
      gte(stories.expiresAt, now)
    ))
    .orderBy(desc(stories.createdAt));
}

export async function getFollowingStories(userId: number): Promise<Story[]> {
  const db = await getDb();
  if (!db) return [];

  const followingIds = await getFollowing(userId);
  const now = new Date();

  if (followingIds.length === 0) return [];

  return db.select().from(stories)
    .where(and(
      sql`${stories.userId} IN (${sql.join(followingIds)})`,
      gte(stories.expiresAt, now)
    ))
    .orderBy(desc(stories.createdAt));
}

export async function incrementStoryViews(storyId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const story = await db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
  if (story.length > 0) {
    await db.update(stories).set({ views: story[0].views + 1 }).where(eq(stories.id, storyId));
  }
}

// ============ COMMENT QUERIES ============
export async function createComment(userId: number, content: string, postId?: number, videoId?: number, parentCommentId?: number): Promise<Comment | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(comments).values({
    userId,
    content,
    postId: postId || null,
    videoId: videoId || null,
    parentCommentId: parentCommentId || null,
  });

  if (result[0].insertId) {
    return db.select().from(comments).where(eq(comments.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function getCommentsByPostId(postId: number, limit: number = 50): Promise<Comment[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

export async function getCommentsByVideoId(videoId: number, limit: number = 50): Promise<Comment[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(comments)
    .where(eq(comments.videoId, videoId))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

export async function getReplies(parentCommentId: number): Promise<Comment[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(comments)
    .where(eq(comments.parentCommentId, parentCommentId))
    .orderBy(desc(comments.createdAt));
}

export async function updateCommentLikes(commentId: number, increment: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const comment = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (comment.length > 0) {
    const newLikes = increment ? comment[0].likes + 1 : Math.max(0, comment[0].likes - 1);
    await db.update(comments).set({ likes: newLikes }).where(eq(comments.id, commentId));
  }
}

// ============ HASHTAG QUERIES ============
export async function getOrCreateHashtag(tag: string): Promise<Hashtag | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(hashtags).where(eq(hashtags.tag, tag.toLowerCase())).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(hashtags).values({
    tag: tag.toLowerCase(),
  });

  if (result[0].insertId) {
    return db.select().from(hashtags).where(eq(hashtags.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function getTrendingHashtags(limit: number = 10): Promise<Hashtag[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(hashtags)
    .orderBy(desc(hashtags.count))
    .limit(limit);
}

export async function searchHashtags(query: string, limit: number = 20): Promise<Hashtag[]> {
  const db = await getDb();
  if (!db) return [];

  const pattern = `%${query.toLowerCase()}%`;
  return db.select().from(hashtags)
    .where(sql`${hashtags.tag} LIKE ${pattern}`)
    .orderBy(desc(hashtags.count))
    .limit(limit);
}

export async function addHashtagToPost(postId: number, hashtagId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(postHashtags).values({
    postId,
    hashtagId,
  });

  // Increment hashtag count
  const hashtag = await db.select().from(hashtags).where(eq(hashtags.id, hashtagId)).limit(1);
  if (hashtag.length > 0) {
    await db.update(hashtags).set({ count: hashtag[0].count + 1 }).where(eq(hashtags.id, hashtagId));
  }
}

export async function getPostsByHashtag(hashtagId: number, limit: number = 20): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  const postIds = await db.select({ postId: postHashtags.postId })
    .from(postHashtags)
    .where(eq(postHashtags.hashtagId, hashtagId));

  if (postIds.length === 0) return [];

  return db.select().from(posts)
    .where(sql`${posts.id} IN (${sql.join(postIds.map(p => p.postId))})`)
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

// ============ NOTIFICATION QUERIES ============
export async function createNotification(userId: number, type: "like" | "comment" | "follow" | "share" | "mention", fromUserId?: number, postId?: number, videoId?: number, commentId?: number, message?: string): Promise<Notification | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(notifications).values({
    userId,
    type,
    fromUserId: fromUserId || null,
    postId: postId || null,
    videoId: videoId || null,
    commentId: commentId || null,
    message: message || null,
  });

  if (result[0].insertId) {
    return db.select().from(notifications).where(eq(notifications.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function getNotifications(userId: number, limit: number = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotifications(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.isRead, false)
    ))
    .orderBy(desc(notifications.createdAt));
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ============ POST QUERIES ============
export async function createPost(userId: number, content: string, imageUrl?: string, videoUrl?: string): Promise<Post | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(posts).values({
    userId,
    content,
    imageUrl: imageUrl || null,
    videoUrl: videoUrl || null,
  });

  if (result[0].insertId) {
    return db.select().from(posts).where(eq(posts.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function getPostsByUserId(userId: number, limit: number = 20, offset: number = 0): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(posts)
    .where(eq(posts.userId, userId))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getFeedPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(posts)
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getPostById(postId: number): Promise<Post | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  return result[0] || null;
}

export async function updatePostLikes(postId: number, increment: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const post = await getPostById(postId);
  if (!post) return;

  const newLikes = increment ? post.likes + 1 : Math.max(0, post.likes - 1);
  await db.update(posts).set({ likes: newLikes }).where(eq(posts.id, postId));
}

// ============ LIKE QUERIES ============
export async function addLike(userId: number, postId?: number, videoId?: number, commentId?: number): Promise<Like | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(likes).values({
    userId,
    postId: postId || null,
    videoId: videoId || null,
    commentId: commentId || null,
  });

  if (result[0].insertId) {
    return db.select().from(likes).where(eq(likes.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function removeLike(userId: number, postId?: number, videoId?: number, commentId?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const conditions = [eq(likes.userId, userId)];
  if (postId) conditions.push(eq(likes.postId, postId));
  if (videoId) conditions.push(eq(likes.videoId, videoId));
  if (commentId) conditions.push(eq(likes.commentId, commentId));

  await db.delete(likes).where(and(...conditions));
}

export async function hasUserLiked(userId: number, postId?: number, videoId?: number, commentId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const conditions = [eq(likes.userId, userId)];
  if (postId) conditions.push(eq(likes.postId, postId));
  if (videoId) conditions.push(eq(likes.videoId, videoId));
  if (commentId) conditions.push(eq(likes.commentId, commentId));

  const result = await db.select().from(likes).where(and(...conditions)).limit(1);
  return result.length > 0;
}

// ============ FOLLOW QUERIES ============
export async function followUser(followerId: number, followingId: number): Promise<Follow | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(follows).values({
    followerId,
    followingId,
  });

  if (result[0].insertId) {
    return db.select().from(follows).where(eq(follows.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function unfollowUser(followerId: number, followingId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(follows).where(and(
    eq(follows.followerId, followerId),
    eq(follows.followingId, followingId)
  ));
}

export async function isFollowing(followerId: number, followingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(follows)
    .where(and(
      eq(follows.followerId, followerId),
      eq(follows.followingId, followingId)
    ))
    .limit(1);

  return result.length > 0;
}

export async function getFollowers(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ followerId: follows.followerId }).from(follows)
    .where(eq(follows.followingId, userId));

  return result.map(r => r.followerId);
}

export async function getFollowing(userId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({ followingId: follows.followingId }).from(follows)
    .where(eq(follows.followerId, userId));

  return result.map(r => r.followingId);
}

// ============ MESSAGE QUERIES ============
export async function createMessage(conversationId: number, senderId: number, content: string, imageUrl?: string): Promise<Message | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(messages).values({
    conversationId,
    senderId,
    content,
    imageUrl: imageUrl || null,
  });

  if (result[0].insertId) {
    return db.select().from(messages).where(eq(messages.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function getMessagesByConversation(conversationId: number, limit: number = 50): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
}

export async function getOrCreateConversation(participant1Id: number, participant2Id: number): Promise<Conversation | null> {
  const db = await getDb();
  if (!db) return null;

  const [p1, p2] = participant1Id < participant2Id ? [participant1Id, participant2Id] : [participant2Id, participant1Id];

  const existing = await db.select().from(conversations)
    .where(and(
      eq(conversations.participant1Id, p1),
      eq(conversations.participant2Id, p2)
    ))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(conversations).values({
    participant1Id: p1,
    participant2Id: p2,
  });

  if (result[0].insertId) {
    return db.select().from(conversations).where(eq(conversations.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function getUserConversations(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(conversations)
    .where(sql`${conversations.participant1Id} = ${userId} OR ${conversations.participant2Id} = ${userId}`)
    .orderBy(desc(conversations.lastMessageAt));
}

// ============ SEARCH QUERIES ============
export async function searchUsers(query: string, limit: number = 20): Promise<typeof users.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  const pattern = `%${query}%`;
  return db.select().from(users)
    .where(sql`${users.name} LIKE ${pattern} OR ${users.email} LIKE ${pattern}`)
    .limit(limit);
}

export async function searchPosts(query: string, limit: number = 20): Promise<Post[]> {
  const db = await getDb();
  if (!db) return [];

  const pattern = `%${query}%`;
  return db.select().from(posts)
    .where(sql`${posts.content} LIKE ${pattern}`)
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

export async function searchVideos(query: string, limit: number = 20): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];

  const pattern = `%${query}%`;
  return db.select().from(videos)
    .where(sql`${videos.title} LIKE ${pattern} OR ${videos.description} LIKE ${pattern}`)
    .orderBy(desc(videos.createdAt))
    .limit(limit);
}
