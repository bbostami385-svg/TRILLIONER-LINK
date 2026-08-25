CREATE TABLE `recommendationInteractions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentId` int NOT NULL,
	`contentType` enum('post','video','comment') NOT NULL,
	`interactionType` enum('like','comment','share','view') NOT NULL,
	`duration` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendationInteractions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `recommendationInteractions` ADD CONSTRAINT `recommendationInteractions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;