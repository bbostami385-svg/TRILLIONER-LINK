CREATE TABLE `verificationAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`livenessRecordId` int,
	`event` enum('challenge_started','challenge_expired','submission_pending','review_approved','review_rejected') NOT NULL,
	`actorUserId` int,
	`details` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verificationAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `verificationAuditLogs` ADD CONSTRAINT `verificationAuditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verificationAuditLogs` ADD CONSTRAINT `verificationAuditLogs_livenessRecordId_faceLivenessRecords_id_fk` FOREIGN KEY (`livenessRecordId`) REFERENCES `faceLivenessRecords`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `verificationAuditLogs` ADD CONSTRAINT `verificationAuditLogs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `verification_audit_user_date_idx` ON `verificationAuditLogs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `verification_audit_record_date_idx` ON `verificationAuditLogs` (`livenessRecordId`,`createdAt`);