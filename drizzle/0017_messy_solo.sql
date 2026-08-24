CREATE TABLE `subscriptionCollectionMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`collectionId` int NOT NULL,
	`subscriptionId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscriptionCollectionMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_collection_subscription` UNIQUE(`collectionId`,`subscriptionId`)
);
--> statement-breakpoint
CREATE TABLE `subscriptionCollections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(80) NOT NULL,
	`description` varchar(255),
	`color` varchar(20) NOT NULL DEFAULT 'cyan',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptionCollections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `subscriptionCollectionMembers` ADD CONSTRAINT `subscriptionCollectionMembers_collectionId_subscriptionCollections_id_fk` FOREIGN KEY (`collectionId`) REFERENCES `subscriptionCollections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptionCollectionMembers` ADD CONSTRAINT `subscriptionCollectionMembers_subscriptionId_subscriptions_id_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptionCollections` ADD CONSTRAINT `subscriptionCollections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;