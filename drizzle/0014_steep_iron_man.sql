CREATE TABLE `profileRewards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`rewardId` varchar(80) NOT NULL,
	`rewardType` enum('badge','theme') NOT NULL,
	`cost` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `profileRewards_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_profile_reward` UNIQUE(`userId`,`rewardId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `activeProfileBadge` varchar(80);--> statement-breakpoint
ALTER TABLE `users` ADD `activeProfileTheme` varchar(80);--> statement-breakpoint
ALTER TABLE `profileRewards` ADD CONSTRAINT `profileRewards_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;