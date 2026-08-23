CREATE TABLE `moderationAppeals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentType` enum('post','comment','video') NOT NULL,
	`targetId` int,
	`content` text NOT NULL,
	`mediaUrl` text,
	`mediaType` enum('image','video'),
	`appealReason` text NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewerId` int,
	`reviewerNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `moderationAppeals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `moderationAppeals` ADD CONSTRAINT `moderationAppeals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderationAppeals` ADD CONSTRAINT `moderationAppeals_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;