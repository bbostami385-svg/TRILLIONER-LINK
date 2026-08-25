CREATE TABLE `creatorAnalyticsSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`snapshotDate` date NOT NULL,
	`subscribers` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`videos` int NOT NULL DEFAULT 0,
	`posts` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creatorAnalyticsSnapshots_id` PRIMARY KEY(`id`),
	CONSTRAINT `creator_analytics_creator_date_unique` UNIQUE(`creatorId`,`snapshotDate`)
);
--> statement-breakpoint
ALTER TABLE `creatorAnalyticsSnapshots` ADD CONSTRAINT `creatorAnalyticsSnapshots_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `creator_analytics_creator_date_idx` ON `creatorAnalyticsSnapshots` (`creatorId`,`snapshotDate`);