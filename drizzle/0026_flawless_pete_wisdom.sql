CREATE TABLE `blockedUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`blockerId` int NOT NULL,
	`blockedId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `blockedUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `blocked_users_blocker_blocked_unique` UNIQUE(`blockerId`,`blockedId`)
);
--> statement-breakpoint
CREATE TABLE `moderationReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reporterId` int NOT NULL,
	`contentType` enum('post','video','comment','user') NOT NULL,
	`contentId` int NOT NULL,
	`reason` enum('spam','inappropriate','harassment','violence','hate_speech','other') NOT NULL,
	`description` varchar(2000),
	`status` enum('pending','resolved','rejected') NOT NULL DEFAULT 'pending',
	`reviewerId` int,
	`resolutionReason` varchar(2000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `moderationReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mutedUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`muterId` int NOT NULL,
	`mutedId` int NOT NULL,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mutedUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `muted_users_muter_muted_unique` UNIQUE(`muterId`,`mutedId`)
);
--> statement-breakpoint
ALTER TABLE `blockedUsers` ADD CONSTRAINT `blockedUsers_blockerId_users_id_fk` FOREIGN KEY (`blockerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `blockedUsers` ADD CONSTRAINT `blockedUsers_blockedId_users_id_fk` FOREIGN KEY (`blockedId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderationReports` ADD CONSTRAINT `moderationReports_reporterId_users_id_fk` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `moderationReports` ADD CONSTRAINT `moderationReports_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mutedUsers` ADD CONSTRAINT `mutedUsers_muterId_users_id_fk` FOREIGN KEY (`muterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mutedUsers` ADD CONSTRAINT `mutedUsers_mutedId_users_id_fk` FOREIGN KEY (`mutedId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `blocked_users_blocker_date_idx` ON `blockedUsers` (`blockerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `moderation_reports_status_date_idx` ON `moderationReports` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `moderation_reports_content_idx` ON `moderationReports` (`contentType`,`contentId`);--> statement-breakpoint
CREATE INDEX `muted_users_muter_date_idx` ON `mutedUsers` (`muterId`,`createdAt`);