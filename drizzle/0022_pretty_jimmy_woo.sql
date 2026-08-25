CREATE TABLE `pageFollowers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pageFollowers_id` PRIMARY KEY(`id`),
	CONSTRAINT `pageFollowers_userPage_unique` UNIQUE(`pageId`,`userId`)
);
--> statement-breakpoint
ALTER TABLE `pageFollowers` ADD CONSTRAINT `pageFollowers_pageId_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `pages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pageFollowers` ADD CONSTRAINT `pageFollowers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;