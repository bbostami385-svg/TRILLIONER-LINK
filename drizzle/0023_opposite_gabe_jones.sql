CREATE TABLE `marketplaceProducts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(80) NOT NULL,
	`priceMinor` int NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BDT',
	`imageUrl` text,
	`stock` int NOT NULL DEFAULT 0,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceProducts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `marketplaceProducts` ADD CONSTRAINT `marketplaceProducts_sellerId_users_id_fk` FOREIGN KEY (`sellerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;