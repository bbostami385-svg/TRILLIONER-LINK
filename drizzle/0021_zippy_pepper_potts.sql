CREATE TABLE `marketplaceTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`orderId` varchar(80) NOT NULL,
	`productName` text NOT NULL,
	`amountMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BDT',
	`status` enum('initiated','paid','failed','cancelled') NOT NULL DEFAULT 'initiated',
	`providerTransactionId` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceTransactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplaceTransactions_orderId_unique` UNIQUE(`orderId`)
);
--> statement-breakpoint
ALTER TABLE `marketplaceTransactions` ADD CONSTRAINT `marketplaceTransactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;