import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, uniqueIndex, index, date, decimal, json, foreignKey, unique } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

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
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  /** Public YouTube-style handle; nullable for legacy accounts that have not claimed one yet. */
  handle: varchar("handle", { length: 30 }),
  /** Lowercase normalized handle used for case-insensitive database uniqueness. */
  handleNormalized: varchar("handleNormalized", { length: 30 }).unique(),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  profileImage: text("profileImage"),
  bio: text("bio"),
  website: varchar("website", { length: 255 }),
  /** Account mode: 'social' (Follow/Followers) or 'creator' (Subscribe/Subscribers) */
  accountMode: mysqlEnum("accountMode", ["social", "creator"]).default("social").notNull(),
  /** Whether user has completed initial mode selection */
  modeSelected: boolean("modeSelected").default(false).notNull(),
  /** Invitation rewards: awarded once per accepted invitation. */
  successfulInvites: int("successfulInvites").default(0).notNull(),
  inviteRewardPoints: int("inviteRewardPoints").default(0).notNull(),
  activeProfileBadge: varchar("activeProfileBadge", { length: 80 }),
  activeProfileTheme: varchar("activeProfileTheme", { length: 80 }),
  
  /** Age Verification Fields */
  dateOfBirth: date("dateOfBirth"),
  age: int("age"),
  ageVerified: boolean("ageVerified").default(false).notNull(),
  ageVerificationAt: timestamp("ageVerificationAt"),
  
  /** Face Verification Fields (18+ only) */
  faceVerificationRequired: boolean("faceVerificationRequired").default(false).notNull(),
  faceVerified: boolean("faceVerified").default(false).notNull(),
  faceVerificationAt: timestamp("faceVerificationAt"),
  faceVerificationImageUrl: text("faceVerificationImageUrl"),
  faceVerificationStatus: mysqlEnum("faceVerificationStatus", ["pending", "approved", "rejected", "not_required"]).default("not_required").notNull(),
  
  /** Human Verification (Liveness Detection) - All new users */
  livenessVerified: boolean("livenessVerified").default(false).notNull(),
  livenessVerificationAt: timestamp("livenessVerificationAt"),
  livenessAttempts: int("livenessAttempts").default(0).notNull(),
  
  /** KYC (Identity Verification) - For monetization */
  kycVerified: boolean("kycVerified").default(false).notNull(),
  kycVerificationAt: timestamp("kycVerificationAt"),
  kycStatus: mysqlEnum("kycStatus", ["not_started", "pending", "approved", "rejected"]).default("not_started").notNull(),
  kycDocumentType: varchar("kycDocumentType", { length: 50 }),
  
  /** Social Account Linking */
  linkedAccounts: json("linkedAccounts"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Marketplace payment records. Product catalog data remains separate; this table stores order/payment metadata only. */
export const marketplaceTransactions = mysqlTable("marketplaceTransactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderId: varchar("orderId", { length: 80 }).notNull().unique(),
  productName: text("productName").notNull(),
  amountMinor: int("amountMinor").notNull(),
  currency: varchar("currency", { length: 3 }).default("BDT").notNull(),
  status: mysqlEnum("status", ["initiated", "paid", "failed", "cancelled"]).default("initiated").notNull(),
  providerTransactionId: varchar("providerTransactionId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketplaceTransaction = typeof marketplaceTransactions.$inferSelect;
export type InsertMarketplaceTransaction = typeof marketplaceTransactions.$inferInsert;

/**
 * User Mode Preferences table
 * Stores user preferences and statistics for each mode
 */
export const userModePreferences = mysqlTable("userModePreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: mysqlEnum("mode", ["social", "creator"]).notNull(),
  followers: int("followers").default(0).notNull(),
  following: int("following").default(0).notNull(),
  subscribers: int("subscribers").default(0).notNull(),
  totalViews: int("totalViews").default(0).notNull(),
  totalPosts: int("totalPosts").default(0).notNull(),
  totalVideos: int("totalVideos").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserModePreference = typeof userModePreferences.$inferSelect;
export type InsertUserModePreference = typeof userModePreferences.$inferInsert;

/**
 * Subscriptions table for Creator Mode (Subscribe/Subscribers)
 */
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    subscriberId: int("subscriberId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    creatorId: int("creatorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscriptionTier: mysqlEnum("subscriptionTier", ["free", "basic", "premium"]).default("free").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    uniqueSubscription: uniqueIndex("unique_subscription").on(table.subscriberId, table.creatorId),
  })
);

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/** User-defined topics for organizing Creator subscriptions. */
export const subscriptionCollections = mysqlTable("subscriptionCollections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  description: varchar("description", { length: 255 }),
  color: varchar("color", { length: 20 }).default("cyan").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerForeignKey: foreignKey({ name: "sc_owner_fk", columns: [table.userId], foreignColumns: [users.id] }).onDelete("cascade"),
}));

export type SubscriptionCollection = typeof subscriptionCollections.$inferSelect;
export type InsertSubscriptionCollection = typeof subscriptionCollections.$inferInsert;

/** Many-to-many membership between a user's topic and an active subscription. */
export const subscriptionCollectionMembers = mysqlTable("subscriptionCollectionMembers", {
  id: int("id").autoincrement().primaryKey(),
  collectionId: int("collectionId").notNull(),
  subscriptionId: int("subscriptionId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueCollectionSubscription: uniqueIndex("unique_collection_subscription").on(table.collectionId, table.subscriptionId),
  collectionForeignKey: foreignKey({ name: "scm_collection_fk", columns: [table.collectionId], foreignColumns: [subscriptionCollections.id] }).onDelete("cascade"),
  subscriptionForeignKey: foreignKey({ name: "scm_subscription_fk", columns: [table.subscriptionId], foreignColumns: [subscriptions.id] }).onDelete("cascade"),
}));

export type SubscriptionCollectionMember = typeof subscriptionCollectionMembers.$inferSelect;
export type InsertSubscriptionCollectionMember = typeof subscriptionCollectionMembers.$inferInsert;

/**
 * User Levels table for Follower-based leveling system
 * Levels 1-20 based on follower count
 */
export const userLevels = mysqlTable("userLevels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  currentLevel: int("currentLevel").default(1).notNull(),
  totalFollowers: int("totalFollowers").default(0).notNull(),
  levelUpCount: int("levelUpCount").default(0).notNull(),
  lastLevelUpAt: timestamp("lastLevelUpAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserLevel = typeof userLevels.$inferSelect;
export type InsertUserLevel = typeof userLevels.$inferInsert;

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
  category: varchar("category", { length: 80 }),
  videoUrl: text("videoUrl").notNull(),
  /** Optional creator-published renditions; no transcoding or third-party download bypass is implied. */
  renditionUrls: json("renditionUrls").$type<Partial<Record<"360p" | "480p" | "1080p", string>>>(),
  thumbnailUrl: text("thumbnailUrl"),
  hashtags: json("hashtags").$type<string[]>().default([]),
  backgroundMusicUrl: text("backgroundMusicUrl"),
  backgroundMusicTitle: varchar("backgroundMusicTitle", { length: 255 }),
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
  sharedSourceType: mysqlEnum("sharedSourceType", ["video", "reel"]),
  sharedSourceId: int("sharedSourceId"),
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
 * User appeals for automated moderation decisions. Content is stored as a
 * review snapshot because blocked content may never have been persisted.
 */
export const moderationAppeals = mysqlTable("moderationAppeals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentType: mysqlEnum("contentType", ["post", "comment", "video"]).notNull(),
  targetId: int("targetId"),
  content: text("content").notNull(),
  mediaUrl: text("mediaUrl"),
  mediaType: mysqlEnum("mediaType", ["image", "video"]),
  appealReason: text("appealReason").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewerId: int("reviewerId").references(() => users.id),
  reviewerNote: text("reviewerNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModerationAppeal = typeof moderationAppeals.$inferSelect;
export type InsertModerationAppeal = typeof moderationAppeals.$inferInsert;

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
  type: mysqlEnum("type", ["like", "comment", "follow", "subscribe", "share", "mention", "appeal_result", "event_rsvp"]).notNull(),
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

export const pageFollowers = mysqlTable("pageFollowers", {
  id: int("id").autoincrement().primaryKey(),
  pageId: int("pageId").notNull().references(() => pages.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userPageUnique: unique("pageFollowers_userPage_unique").on(table.pageId, table.userId),
}));

export type PageFollower = typeof pageFollowers.$inferSelect;
export type InsertPageFollower = typeof pageFollowers.$inferInsert;

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
  title: varchar("title", { length: 255 }),
  description: text("description"),
  category: varchar("category", { length: 80 }),
  hashtags: json("hashtags").$type<string[]>().default([]),
  backgroundMusicUrl: text("backgroundMusicUrl"),
  backgroundMusicTitle: varchar("backgroundMusicTitle", { length: 255 }),
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

/**
 * Age Verification Records table
 * Stores history of age verification attempts
 */
export const ageVerificationRecords = mysqlTable("ageVerificationRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dateOfBirth: date("dateOfBirth").notNull(),
  age: int("age").notNull(),
  verificationMethod: mysqlEnum("verificationMethod", ["manual_dob", "id_document", "email_verification"]).notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgeVerificationRecord = typeof ageVerificationRecords.$inferSelect;
export type InsertAgeVerificationRecord = typeof ageVerificationRecords.$inferInsert;

/**
 * Face Verification Records table
 * Stores history of face verification attempts (18+ only)
 */
export const faceVerificationRecords = mysqlTable("faceVerificationRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  imageUrl: text("imageUrl").notNull(),
  verificationProvider: varchar("verificationProvider", { length: 50 }).default("aws_rekognition"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FaceVerificationRecord = typeof faceVerificationRecords.$inferSelect;
export type InsertFaceVerificationRecord = typeof faceVerificationRecords.$inferInsert;


/**
 * Face Liveness Records table
 * Stores history of face liveness verification attempts (Human verification - Bot prevention)
 */
export const faceLivenessRecords = mysqlTable("faceLivenessRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  videoUrl: text("videoUrl").notNull(),
  challengeType: varchar("challengeType", { length: 50 }).notNull(), // nod, turn_left, turn_right, blink
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  rejectionReason: text("rejectionReason"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FaceLivenessRecord = typeof faceLivenessRecords.$inferSelect;
export type InsertFaceLivenessRecord = typeof faceLivenessRecords.$inferInsert;

/**
 * Liveness Challenge table
 * Stores random movement challenges for face liveness verification
 */
export const livenessChallenge = mysqlTable("livenessChallenge", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  challenges: json("challenges").notNull(), // Array of challenge types
  status: mysqlEnum("status", ["active", "completed", "expired"]).default("active").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LivenessChallenge = typeof livenessChallenge.$inferSelect;
export type InsertLivenessChallenge = typeof livenessChallenge.$inferInsert;

/**
 * KYC Documents table
 * Stores identity verification documents for monetization
 */
export const kycDocuments = mysqlTable("kycDocuments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  documentType: mysqlEnum("documentType", ["passport", "driver_license", "national_id", "other"]).notNull(),
  frontImageUrl: text("frontImageUrl").notNull(),
  backImageUrl: text("backImageUrl"),
  selfieImageUrl: text("selfieImageUrl"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  rejectionReason: text("rejectionReason"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KYCDocument = typeof kycDocuments.$inferSelect;
export type InsertKYCDocument = typeof kycDocuments.$inferInsert;

/**
 * KYC Verification Records table
 * Audit trail for KYC verification attempts
 */
export const kycVerificationRecords = mysqlTable("kycVerificationRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  documentId: int("documentId")
    .notNull()
    .references(() => kycDocuments.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id),
  rejectionReason: text("rejectionReason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KYCVerificationRecord = typeof kycVerificationRecords.$inferSelect;
export type InsertKYCVerificationRecord = typeof kycVerificationRecords.$inferInsert;

/**
 * Linked Accounts table
 * Stores social platform account links (YouTube, Google, Facebook, Instagram, TikTok)
 */
export const linkedAccounts = mysqlTable("linkedAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: mysqlEnum("provider", ["google", "youtube", "facebook", "instagram", "tiktok"]).notNull(),
  providerId: varchar("providerId", { length: 255 }).notNull(),
  providerUsername: varchar("providerUsername", { length: 255 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  profileData: json("profileData"), // Store profile info from provider
  isVerified: boolean("isVerified").default(false).notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LinkedAccount = typeof linkedAccounts.$inferSelect;
export type InsertLinkedAccount = typeof linkedAccounts.$inferInsert;

/**
 * Account Linking Records table
 * Audit trail for social account linking
 */
export const accountLinkingRecords = mysqlTable("accountLinkingRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  linkedAccountId: int("linkedAccountId")
    .notNull()
    .references(() => linkedAccounts.id, { onDelete: "cascade" }),
  action: mysqlEnum("action", ["linked", "unlinked", "synced"]).notNull(),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccountLinkingRecord = typeof accountLinkingRecords.$inferSelect;
export type InsertAccountLinkingRecord = typeof accountLinkingRecords.$inferInsert;

/**
 * Friend invitation links. Raw tokens are never persisted; only a SHA-256 hash is stored.
 */
export const friendInvitations = mysqlTable("friendInvitations", {
  id: int("id").autoincrement().primaryKey(),
  inviterId: int("inviterId").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "revoked"]).default("pending").notNull(),
  acceptedBy: int("acceptedBy").references(() => users.id, { onDelete: "set null" }),
  acceptedAt: timestamp("acceptedAt"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FriendInvitation = typeof friendInvitations.$inferSelect;
export type InsertFriendInvitation = typeof friendInvitations.$inferInsert;

/** Invite-point cosmetics owned by a user. One row per unlocked reward. */
export const profileRewards = mysqlTable("profileRewards", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  rewardId: varchar("rewardId", { length: 80 }).notNull(),
  rewardType: mysqlEnum("rewardType", ["badge", "theme"]).notNull(),
  cost: int("cost").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
}, (table) => ({ uniqueUserReward: uniqueIndex("unique_user_profile_reward").on(table.userId, table.rewardId) }));
export type ProfileReward = typeof profileRewards.$inferSelect;
export type InsertProfileReward = typeof profileRewards.$inferInsert;

/** Privacy-safe clicks on public profile social links. No raw IP or device fingerprint is stored. */
export const socialLinkClicks = mysqlTable("socialLinkClicks", {
  id: int("id").autoincrement().primaryKey(),
  profileOwnerId: int("profileOwnerId").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: mysqlEnum("provider", ["facebook", "instagram", "twitter", "youtube", "tiktok"]).notNull(),
  viewerId: int("viewerId").references(() => users.id, { onDelete: "set null" }),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
}, (table) => ({
  ownerProviderDateIdx: index("social_link_click_owner_provider_date_idx").on(table.profileOwnerId, table.provider, table.clickedAt),
}));
export type SocialLinkClick = typeof socialLinkClicks.$inferSelect;
export type InsertSocialLinkClick = typeof socialLinkClicks.$inferInsert;
