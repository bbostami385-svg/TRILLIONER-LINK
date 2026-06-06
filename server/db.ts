import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, posts, messages, conversations, likes, follows, Post, Message, Conversation, Like, Follow } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

// Post queries
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

// Message queries
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

// Conversation queries
export async function getOrCreateConversation(participant1Id: number, participant2Id: number): Promise<Conversation | null> {
  const db = await getDb();
  if (!db) return null;

  // Ensure consistent ordering
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

// Like queries
export async function addLike(userId: number, postId: number): Promise<Like | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(likes).values({
    userId,
    postId,
  });

  if (result[0].insertId) {
    return db.select().from(likes).where(eq(likes.id, Number(result[0].insertId))).then(r => r[0] || null);
  }
  return null;
}

export async function removeLike(userId: number, postId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.delete(likes).where(and(
    eq(likes.userId, userId),
    eq(likes.postId, postId)
  ));
}

export async function hasUserLikedPost(userId: number, postId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.select().from(likes)
    .where(and(
      eq(likes.userId, userId),
      eq(likes.postId, postId)
    ))
    .limit(1);

  return result.length > 0;
}

// Follow queries
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
