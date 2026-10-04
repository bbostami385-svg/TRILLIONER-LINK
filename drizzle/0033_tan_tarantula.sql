CREATE TABLE `copyrightClaims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`claimantId` int NOT NULL,
	`targetVideoId` int,
	`claimType` enum('copyright','unauthorized_reupload','privacy_screenshot','privacy_recording','privacy_call_capture') NOT NULL,
	`originalWorkUrl` text,
	`evidenceUrl` text,
	`description` varchar(4000) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`attestedOwnership` boolean NOT NULL DEFAULT false,
	`status` enum('pending','under_review','actioned','rejected') NOT NULL DEFAULT 'pending',
	`reviewerId` int,
	`resolutionNote` varchar(2000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`resolvedAt` timestamp,
	CONSTRAINT `copyrightClaims_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoProtectionSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`videoId` int NOT NULL,
	`ownerId` int NOT NULL,
	`allowDownload` boolean NOT NULL DEFAULT false,
	`watermarkEnabled` boolean NOT NULL DEFAULT true,
	`watermarkText` varchar(160),
	`screenshotRecordingNotice` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoProtectionSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `video_protection_video_unique` UNIQUE(`videoId`)
);
--> statement-breakpoint
ALTER TABLE `copyrightClaims` ADD CONSTRAINT `copyrightClaims_claimantId_users_id_fk` FOREIGN KEY (`claimantId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `copyrightClaims` ADD CONSTRAINT `copyrightClaims_targetVideoId_videos_id_fk` FOREIGN KEY (`targetVideoId`) REFERENCES `videos`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `copyrightClaims` ADD CONSTRAINT `copyrightClaims_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoProtectionSettings` ADD CONSTRAINT `videoProtectionSettings_videoId_videos_id_fk` FOREIGN KEY (`videoId`) REFERENCES `videos`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `videoProtectionSettings` ADD CONSTRAINT `videoProtectionSettings_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `copyright_claims_status_date_idx` ON `copyrightClaims` (`status`,`createdAt`);--> statement-breakpoint
CREATE INDEX `copyright_claims_target_idx` ON `copyrightClaims` (`targetVideoId`);--> statement-breakpoint
CREATE INDEX `copyright_claims_claimant_idx` ON `copyrightClaims` (`claimantId`);--> statement-breakpoint
CREATE INDEX `video_protection_owner_idx` ON `videoProtectionSettings` (`ownerId`);