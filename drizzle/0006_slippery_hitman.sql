CREATE TABLE `accountLinkingRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`linkedAccountId` int NOT NULL,
	`action` enum('linked','unlinked','synced') NOT NULL,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accountLinkingRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faceLivenessRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoUrl` text NOT NULL,
	`challengeType` varchar(50) NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`confidence` decimal(5,2),
	`rejectionReason` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faceLivenessRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kycDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('passport','driver_license','national_id','other') NOT NULL,
	`frontImageUrl` text NOT NULL,
	`backImageUrl` text,
	`selfieImageUrl` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kycDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kycVerificationRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedBy` int,
	`rejectionReason` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kycVerificationRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `linkedAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('google','youtube','facebook','instagram','tiktok') NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`providerUsername` varchar(255),
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`profileData` json,
	`isVerified` boolean NOT NULL DEFAULT false,
	`lastSyncedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `linkedAccounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `livenessChallenge` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challenges` json NOT NULL,
	`status` enum('active','completed','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `livenessChallenge_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `livenessVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `livenessVerificationAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `livenessAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `kycVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `kycVerificationAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `kycStatus` enum('not_started','pending','approved','rejected') DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `kycDocumentType` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `linkedAccounts` json;--> statement-breakpoint
ALTER TABLE `accountLinkingRecords` ADD CONSTRAINT `accountLinkingRecords_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accountLinkingRecords` ADD CONSTRAINT `accountLinkingRecords_linkedAccountId_linkedAccounts_id_fk` FOREIGN KEY (`linkedAccountId`) REFERENCES `linkedAccounts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `faceLivenessRecords` ADD CONSTRAINT `faceLivenessRecords_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kycDocuments` ADD CONSTRAINT `kycDocuments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kycVerificationRecords` ADD CONSTRAINT `kycVerificationRecords_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kycVerificationRecords` ADD CONSTRAINT `kycVerificationRecords_documentId_kycDocuments_id_fk` FOREIGN KEY (`documentId`) REFERENCES `kycDocuments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kycVerificationRecords` ADD CONSTRAINT `kycVerificationRecords_reviewedBy_users_id_fk` FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `linkedAccounts` ADD CONSTRAINT `linkedAccounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `livenessChallenge` ADD CONSTRAINT `livenessChallenge_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;