CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subscriberId` int NOT NULL,
	`creatorId` int NOT NULL,
	`subscriptionTier` enum('free','basic','premium') NOT NULL DEFAULT 'free',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_subscription` UNIQUE(`subscriberId`,`creatorId`)
);
--> statement-breakpoint
CREATE TABLE `userModePreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`mode` enum('social','creator') NOT NULL,
	`followers` int NOT NULL DEFAULT 0,
	`following` int NOT NULL DEFAULT 0,
	`subscribers` int NOT NULL DEFAULT 0,
	`totalViews` int NOT NULL DEFAULT 0,
	`totalPosts` int NOT NULL DEFAULT 0,
	`totalVideos` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userModePreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `arFilters` MODIFY COLUMN `uses` int NOT NULL;--> statement-breakpoint
ALTER TABLE `arFilters` MODIFY COLUMN `likes` int NOT NULL;--> statement-breakpoint
ALTER TABLE `challenges` MODIFY COLUMN `participants` int NOT NULL;--> statement-breakpoint
ALTER TABLE `challenges` MODIFY COLUMN `views` int NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` MODIFY COLUMN `likes` int NOT NULL;--> statement-breakpoint
ALTER TABLE `events` MODIFY COLUMN `attendees` int NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `isRead` int NOT NULL;--> statement-breakpoint
ALTER TABLE `pages` MODIFY COLUMN `followers` int NOT NULL;--> statement-breakpoint
ALTER TABLE `pollOptions` MODIFY COLUMN `votes` int NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `likes` int NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `comments` int NOT NULL;--> statement-breakpoint
ALTER TABLE `posts` MODIFY COLUMN `shares` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reels` MODIFY COLUMN `likes` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reels` MODIFY COLUMN `comments` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reels` MODIFY COLUMN `shares` int NOT NULL;--> statement-breakpoint
ALTER TABLE `reels` MODIFY COLUMN `views` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sounds` MODIFY COLUMN `uses` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sounds` MODIFY COLUMN `likes` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sponsoredPosts` MODIFY COLUMN `budget` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `sponsoredPosts` MODIFY COLUMN `spent` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `sponsoredPosts` MODIFY COLUMN `impressions` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sponsoredPosts` MODIFY COLUMN `clicks` int NOT NULL;--> statement-breakpoint
ALTER TABLE `stories` MODIFY COLUMN `views` int NOT NULL;--> statement-breakpoint
ALTER TABLE `videos` MODIFY COLUMN `views` int NOT NULL;--> statement-breakpoint
ALTER TABLE `videos` MODIFY COLUMN `likes` int NOT NULL;--> statement-breakpoint
ALTER TABLE `videos` MODIFY COLUMN `comments` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `accountMode` enum('social','creator') DEFAULT 'social' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `modeSelected` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_subscriberId_users_id_fk` FOREIGN KEY (`subscriberId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userModePreferences` ADD CONSTRAINT `userModePreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;