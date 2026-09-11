CREATE TABLE `childSafetySettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`profileVisibility` enum('private','followers','public') NOT NULL DEFAULT 'followers',
	`followPermission` enum('approved_only','anyone') NOT NULL DEFAULT 'approved_only',
	`messagePermission` enum('no_one','followers','approved_requests') NOT NULL DEFAULT 'approved_requests',
	`commentPermission` enum('no_one','followers','approved_requests') NOT NULL DEFAULT 'followers',
	`mentionPermission` enum('no_one','followers','approved_requests') NOT NULL DEFAULT 'followers',
	`sharePermission` enum('no_one','followers','public') NOT NULL DEFAULT 'followers',
	`quietHoursEnabled` boolean NOT NULL DEFAULT true,
	`quietHoursStart` varchar(5) NOT NULL DEFAULT '22:00',
	`quietHoursEnd` varchar(5) NOT NULL DEFAULT '07:00',
	`screenTimeLimitMinutes` int,
	`screenTimeReminderMinutes` int NOT NULL DEFAULT 60,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `childSafetySettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `child_safety_settings_user_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `safetyAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int,
	`subjectUserId` int,
	`reportId` int,
	`action` varchar(80) NOT NULL,
	`category` varchar(80) NOT NULL,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `safetyAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safetyEnforcementActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subjectUserId` int NOT NULL,
	`reportId` int,
	`level` enum('warning','content_removal','feature_restriction','temporary_suspension','permanent_removal') NOT NULL,
	`reason` varchar(2000) NOT NULL,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	`reviewerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `safetyEnforcementActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `safetyInteractionEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int NOT NULL,
	`targetUserId` int NOT NULL,
	`eventType` enum('message_attempt','follow_attempt','comment_attempt','mention_attempt','share_attempt','block_evasion_flag') NOT NULL,
	`outcome` enum('allowed','warned','restricted','flagged') NOT NULL,
	`reason` varchar(500),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `safetyInteractionEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `moderationReports` MODIFY COLUMN `reason` enum('spam','inappropriate','harassment','violence','hate_speech','child_safety','grooming','sexual_exploitation','threat','dangerous_content','other_safety','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `moderationReports` ADD `safetyCategory` enum('child_safety','grooming','sexual_exploitation','harassment','threat','dangerous_content','other_safety');--> statement-breakpoint
ALTER TABLE `moderationReports` ADD `priority` enum('standard','high','urgent') DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `ageCategory` enum('teen','adult');--> statement-breakpoint
ALTER TABLE `users` ADD `safetyRestricted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `safetyRestrictionReason` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `safetyRestrictionUntil` timestamp;--> statement-breakpoint
ALTER TABLE `childSafetySettings` ADD CONSTRAINT `childSafetySettings_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyAuditLogs` ADD CONSTRAINT `safetyAuditLogs_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyAuditLogs` ADD CONSTRAINT `safetyAuditLogs_subjectUserId_users_id_fk` FOREIGN KEY (`subjectUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyAuditLogs` ADD CONSTRAINT `safetyAuditLogs_reportId_moderationReports_id_fk` FOREIGN KEY (`reportId`) REFERENCES `moderationReports`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyEnforcementActions` ADD CONSTRAINT `safetyEnforcementActions_subjectUserId_users_id_fk` FOREIGN KEY (`subjectUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyEnforcementActions` ADD CONSTRAINT `safetyEnforcementActions_reportId_moderationReports_id_fk` FOREIGN KEY (`reportId`) REFERENCES `moderationReports`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyEnforcementActions` ADD CONSTRAINT `safetyEnforcementActions_reviewerId_users_id_fk` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyInteractionEvents` ADD CONSTRAINT `safetyInteractionEvents_actorUserId_users_id_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `safetyInteractionEvents` ADD CONSTRAINT `safetyInteractionEvents_targetUserId_users_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `safety_audit_category_date_idx` ON `safetyAuditLogs` (`category`,`createdAt`);--> statement-breakpoint
CREATE INDEX `safety_audit_subject_date_idx` ON `safetyAuditLogs` (`subjectUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `safety_enforcement_subject_date_idx` ON `safetyEnforcementActions` (`subjectUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `safety_enforcement_report_idx` ON `safetyEnforcementActions` (`reportId`);--> statement-breakpoint
CREATE INDEX `safety_interaction_actor_target_date_idx` ON `safetyInteractionEvents` (`actorUserId`,`targetUserId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `safety_interaction_target_date_idx` ON `safetyInteractionEvents` (`targetUserId`,`createdAt`);