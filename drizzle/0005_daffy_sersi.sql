CREATE TABLE `ageVerificationRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dateOfBirth` date NOT NULL,
	`age` int NOT NULL,
	`verificationMethod` enum('manual_dob','id_document','email_verification') NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ageVerificationRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faceVerificationRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`verificationProvider` varchar(50) DEFAULT 'aws_rekognition',
	`confidence` decimal(5,2),
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`rejectionReason` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faceVerificationRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `dateOfBirth` date;--> statement-breakpoint
ALTER TABLE `users` ADD `age` int;--> statement-breakpoint
ALTER TABLE `users` ADD `ageVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `ageVerificationAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `faceVerificationRequired` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `faceVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `faceVerificationAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `faceVerificationImageUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `faceVerificationStatus` enum('pending','approved','rejected','not_required') DEFAULT 'not_required' NOT NULL;--> statement-breakpoint
ALTER TABLE `ageVerificationRecords` ADD CONSTRAINT `ageVerificationRecords_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `faceVerificationRecords` ADD CONSTRAINT `faceVerificationRecords_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;