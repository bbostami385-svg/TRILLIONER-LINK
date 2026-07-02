import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** TRILLIONER LINK OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  profileImage: text("profileImage"),
  bio: text("bio"),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Posts table for feed functionality
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  videoUrl: text("videoUrl"),
  likes: int("likes").notNull(),
  comments: int("comments").notNull(),
  shares: int("shares").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Videos table for YouTube-style video uploads
 */
export const videos = mysqlTable("videos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  duration: int("duration"), // in seconds
  views: int("views").notNull(),
  likes: int("likes").notNull(),
  comments: int("comments").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Stories table for Instagram-style stories (24-hour expiry)
 */
export const stories = mysqlTable("stories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  mediaUrl: text("mediaUrl").notNull(),
  mediaType: mysqlEnum("mediaType", ["image", "video"]).notNull(),
  caption: text("caption"),
  views: int("views").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Story = typeof stories.$inferSelect;
export type InsertStory = typeof stories.$inferInsert;

/**
 * Comments table for post/video comments
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  postId: int("postId").references(() => posts.id),
  videoId: int("videoId").references(() => videos.id),
  parentCommentId: int("parentCommentId"),
  content: text("content").notNull(),
  likes: int("likes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Hashtags table for trending topics
 */
export const hashtags = mysqlTable("hashtags", {
  id: int("id").autoincrement().primaryKey(),
  tag: varchar("tag", { length: 100 }).notNull().unique(),
  count: int("count").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Hashtag = typeof hashtags.$inferSelect;
export type InsertHashtag = typeof hashtags.$inferInsert;

/**
 * Post-Hashtag relationship table
 */
export const postHashtags = mysqlTable("postHashtags", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => posts.id),
  hashtagId: int("hashtagId")
    .notNull()
    .references(() => hashtags.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostHashtag = typeof postHashtags.$inferSelect;
export type InsertPostHashtag = typeof postHashtags.$inferInsert;

/**
 * Notifications table
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  fromUserId: int("fromUserId").references(() => users.id),
  type: mysqlEnum("type", ["like", "comment", "follow", "share", "mention"]).notNull(),
  postId: int("postId").references(() => posts.id),
  videoId: int("videoId").references(() => videos.id),
  commentId: int("commentId").references(() => comments.id),
  message: text("message"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Conversations table for messaging
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  participant1Id: int("participant1Id")
    .notNull()
    .references(() => users.id),
  participant2Id: int("participant2Id")
    .notNull()
    .references(() => users.id),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table for chat functionality
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId")
    .notNull()
    .references(() => conversations.id),
  senderId: int("senderId")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  isRead: int("isRead").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Likes table for tracking post likes
 */
export const likes = mysqlTable("likes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  postId: int("postId").references(() => posts.id),
  videoId: int("videoId").references(() => videos.id),
  commentId: int("commentId").references(() => comments.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Like = typeof likes.$inferSelect;
export type InsertLike = typeof likes.$inferInsert;

/**
 * Follows table for user relationships
 */
export const follows = mysqlTable("follows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId")
    .notNull()
    .references(() => users.id),
  followingId: int("followingId")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;


/**
 * Groups/Communities table
 */
export const groups = mysqlTable("groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId")
    .notNull()
    .references(() => users.id),
  coverImage: text("coverImage"),
  memberCount: int("memberCount").default(1).notNull(),
  isPrivate: boolean("isPrivate").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * Group members table
 */
export const groupMembers = mysqlTable("groupMembers", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId")
    .notNull()
    .references(() => groups.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  role: mysqlEnum("role", ["admin", "moderator", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

/**
 * Pages/Channels table
 */
export const pages = mysqlTable("pages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId")
    .notNull()
    .references(() => users.id),
  profileImage: text("profileImage"),
  coverImage: text("coverImage"),
  followers: int("followers").notNull(),
  isVerified: boolean("isVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Page = typeof pages.$inferSelect;
export type InsertPage = typeof pages.$inferInsert;

/**
 * Events table
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  creatorId: int("creatorId")
    .notNull()
    .references(() => users.id),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  location: varchar("location", { length: 255 }),
  coverImage: text("coverImage"),
  attendees: int("attendees").notNull(),
  isOnline: boolean("isOnline").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Event RSVPs table
 */
export const eventRsvps = mysqlTable("eventRsvps", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId")
    .notNull()
    .references(() => events.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  status: mysqlEnum("status", ["going", "interested", "not_going"]).default("interested").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventRsvp = typeof eventRsvps.$inferSelect;
export type InsertEventRsvp = typeof eventRsvps.$inferInsert;

/**
 * Reels/Shorts table
 */
export const reels = mysqlTable("reels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  videoUrl: text("videoUrl").notNull(),
  thumbnail: text("thumbnail"),
  caption: text("caption"),
  duration: int("duration"), // in seconds
  likes: int("likes").notNull(),
  comments: int("comments").notNull(),
  shares: int("shares").notNull(),
  views: int("views").notNull(),
  soundId: int("soundId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reel = typeof reels.$inferSelect;
export type InsertReel = typeof reels.$inferInsert;

/**
 * Trending Sounds table
 */
export const sounds = mysqlTable("sounds", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  artist: varchar("artist", { length: 255 }),
  audioUrl: text("audioUrl").notNull(),
  duration: int("duration"), // in seconds
  uses: int("uses").notNull(),
  likes: int("likes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Sound = typeof sounds.$inferSelect;
export type InsertSound = typeof sounds.$inferInsert;

/**
 * Polls table
 */
export const polls = mysqlTable("polls", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => posts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  question: varchar("question", { length: 255 }).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Poll = typeof polls.$inferSelect;
export type InsertPoll = typeof polls.$inferInsert;

/**
 * Poll options table
 */
export const pollOptions = mysqlTable("pollOptions", {
  id: int("id").autoincrement().primaryKey(),
  pollId: int("pollId")
    .notNull()
    .references(() => polls.id),
  text: varchar("text", { length: 255 }).notNull(),
  votes: int("votes").notNull(),
});

export type PollOption = typeof pollOptions.$inferSelect;
export type InsertPollOption = typeof pollOptions.$inferInsert;

/**
 * Reactions table (heart, laugh, sad, angry, wow)
 */
export const reactions = mysqlTable("reactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  postId: int("postId").references(() => posts.id),
  commentId: int("commentId").references(() => comments.id),
  type: mysqlEnum("type", ["heart", "laugh", "sad", "angry", "wow"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = typeof reactions.$inferInsert;

/**
 * Saved Collections table
 */
export const collections = mysqlTable("collections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;

/**
 * Saved items in collections
 */
export const savedItems = mysqlTable("savedItems", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId")
    .notNull()
    .references(() => collections.id),
  postId: int("postId").references(() => posts.id),
  videoId: int("videoId").references(() => videos.id),
  reelId: int("reelId").references(() => reels.id),
  savedAt: timestamp("savedAt").defaultNow().notNull(),
});

export type SavedItem = typeof savedItems.$inferSelect;
export type InsertSavedItem = typeof savedItems.$inferInsert;

/**
 * Watch History table
 */
export const watchHistory = mysqlTable("watchHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  videoId: int("videoId").references(() => videos.id),
  reelId: int("reelId").references(() => reels.id),
  watchedAt: timestamp("watchedAt").defaultNow().notNull(),
  duration: int("duration"), // in seconds watched
});

export type WatchHistoryEntry = typeof watchHistory.$inferSelect;
export type InsertWatchHistoryEntry = typeof watchHistory.$inferInsert;

/**
 * User Verification Badges table
 */
export const verificationBadges = mysqlTable("verificationBadges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id)
    .unique(),
  badgeType: mysqlEnum("badgeType", ["verified", "creator", "business", "media"]).notNull(),
  verifiedAt: timestamp("verifiedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
});

export type VerificationBadge = typeof verificationBadges.$inferSelect;
export type InsertVerificationBadge = typeof verificationBadges.$inferInsert;

/**
 * Mentions/Tags in posts
 */
export const mentions = mysqlTable("mentions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => posts.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  mentionedAt: timestamp("mentionedAt").defaultNow().notNull(),
});

export type Mention = typeof mentions.$inferSelect;
export type InsertMention = typeof mentions.$inferInsert;

/**
 * Duets/Collaborations table
 */
export const duets = mysqlTable("duets", {
  id: int("id").autoincrement().primaryKey(),
  originalReelId: int("originalReelId")
    .notNull()
    .references(() => reels.id),
  duetReelId: int("duetReelId")
    .notNull()
    .references(() => reels.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Duet = typeof duets.$inferSelect;
export type InsertDuet = typeof duets.$inferInsert;

/**
 * Hashtag Challenges table
 */
export const challenges = mysqlTable("challenges", {
  id: int("id").autoincrement().primaryKey(),
  hashtag: varchar("hashtag", { length: 255 }).notNull().unique(),
  description: text("description"),
  creatorId: int("creatorId")
    .notNull()
    .references(() => users.id),
  coverImage: text("coverImage"),
  participants: int("participants").notNull(),
  views: int("views").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;

/**
 * Sponsored Posts/Ads table
 */
export const sponsoredPosts = mysqlTable("sponsoredPosts", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId")
    .notNull()
    .references(() => posts.id),
  advertiserUserId: int("advertiserUserId")
    .notNull()
    .references(() => users.id),
  budget: varchar("budget", { length: 20 }).notNull(),
  spent: varchar("spent", { length: 20 }).notNull(),
  impressions: int("impressions").notNull(),
  clicks: int("clicks").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["active", "paused", "ended"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SponsoredPost = typeof sponsoredPosts.$inferSelect;
export type InsertSponsoredPost = typeof sponsoredPosts.$inferInsert;

/**
 * AR Filters table
 */
export const arFilters = mysqlTable("arFilters", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  creatorId: int("creatorId")
    .notNull()
    .references(() => users.id),
  filterUrl: text("filterUrl").notNull(),
  thumbnail: text("thumbnail"),
  uses: int("uses").notNull(),
  likes: int("likes").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArFilter = typeof arFilters.$inferSelect;
export type InsertArFilter = typeof arFilters.$inferInsert;
