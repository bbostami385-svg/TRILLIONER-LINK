CREATE TABLE `liveStreams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streamId` varchar(120) NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`thumbnail` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`status` enum('ready','live','ended') NOT NULL DEFAULT 'live',
	`streamKey` varchar(160) NOT NULL,
	`rtmpUrl` text NOT NULL,
	`hlsUrl` text NOT NULL,
	`viewerCount` int NOT NULL DEFAULT 0,
	`recordingId` varchar(160),
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liveStreams_id` PRIMARY KEY(`id`),
	CONSTRAINT `liveStreams_streamId_unique` UNIQUE(`streamId`),
	CONSTRAINT `liveStreams_streamKey_unique` UNIQUE(`streamKey`)
);
--> statement-breakpoint
CREATE TABLE `streamChatMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`streamId` varchar(120) NOT NULL,
	`userId` int,
	`username` varchar(160),
	`message` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `streamChatMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `liveStreams` ADD CONSTRAINT `liveStreams_creatorId_users_id_fk` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `streamChatMessages` ADD CONSTRAINT `streamChatMessages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `live_stream_creator_status_idx` ON `liveStreams` (`creatorId`,`status`);--> statement-breakpoint
CREATE INDEX `live_stream_public_status_idx` ON `liveStreams` (`isPublic`,`status`);--> statement-breakpoint
CREATE INDEX `stream_chat_stream_date_idx` ON `streamChatMessages` (`streamId`,`createdAt`);