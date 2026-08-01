CREATE TABLE `userLevels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentLevel` int NOT NULL DEFAULT 1,
	`totalFollowers` int NOT NULL DEFAULT 0,
	`levelUpCount` int NOT NULL DEFAULT 0,
	`lastLevelUpAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userLevels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userLevels` ADD CONSTRAINT `userLevels_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;