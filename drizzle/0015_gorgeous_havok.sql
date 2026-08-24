CREATE TABLE `socialLinkClicks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profileOwnerId` int NOT NULL,
	`provider` enum('facebook','instagram','twitter','youtube','tiktok') NOT NULL,
	`viewerId` int,
	`clickedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialLinkClicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `socialLinkClicks` ADD CONSTRAINT `socialLinkClicks_profileOwnerId_users_id_fk` FOREIGN KEY (`profileOwnerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `socialLinkClicks` ADD CONSTRAINT `socialLinkClicks_viewerId_users_id_fk` FOREIGN KEY (`viewerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `social_link_click_owner_provider_date_idx` ON `socialLinkClicks` (`profileOwnerId`,`provider`,`clickedAt`);