ALTER TABLE `subscriptionCollectionMembers` DROP FOREIGN KEY `subscriptionCollectionMembers_collectionId_subscriptionCollections_id_fk`;
--> statement-breakpoint
ALTER TABLE `subscriptionCollectionMembers` DROP FOREIGN KEY `subscriptionCollectionMembers_subscriptionId_subscriptions_id_fk`;
--> statement-breakpoint
ALTER TABLE `subscriptionCollections` DROP FOREIGN KEY `subscriptionCollections_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `subscriptionCollectionMembers` ADD CONSTRAINT `scm_collection_fk` FOREIGN KEY (`collectionId`) REFERENCES `subscriptionCollections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptionCollectionMembers` ADD CONSTRAINT `scm_subscription_fk` FOREIGN KEY (`subscriptionId`) REFERENCES `subscriptions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptionCollections` ADD CONSTRAINT `sc_owner_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;