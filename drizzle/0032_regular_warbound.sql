CREATE TABLE `familyCircleMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`circleId` int NOT NULL,
	`userId` int NOT NULL,
	`invitedById` int NOT NULL,
	`role` enum('owner','member') NOT NULL DEFAULT 'member',
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `familyCircleMembers_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_family_circle_member` UNIQUE(`circleId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `familyCircles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(500),
	`privacy` enum('invite_only') NOT NULL DEFAULT 'invite_only',
	`maxMembers` int NOT NULL DEFAULT 20,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `familyCircles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `familyMeetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`circleId` int NOT NULL,
	`createdById` int NOT NULL,
	`title` varchar(160) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`roomCode` varchar(96) NOT NULL,
	`status` enum('scheduled','live','ended','cancelled') NOT NULL DEFAULT 'scheduled',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `familyMeetings_id` PRIMARY KEY(`id`),
	CONSTRAINT `familyMeetings_roomCode_unique` UNIQUE(`roomCode`)
);
--> statement-breakpoint
ALTER TABLE `familyCircleMembers` ADD CONSTRAINT `familyCircleMembers_circleId_familyCircles_id_fk` FOREIGN KEY (`circleId`) REFERENCES `familyCircles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `familyCircleMembers` ADD CONSTRAINT `familyCircleMembers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `familyCircleMembers` ADD CONSTRAINT `familyCircleMembers_invitedById_users_id_fk` FOREIGN KEY (`invitedById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `familyCircles` ADD CONSTRAINT `familyCircles_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `familyMeetings` ADD CONSTRAINT `familyMeetings_circleId_familyCircles_id_fk` FOREIGN KEY (`circleId`) REFERENCES `familyCircles`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `familyMeetings` ADD CONSTRAINT `familyMeetings_createdById_users_id_fk` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;