ALTER TABLE `reels` ADD `title` varchar(255);--> statement-breakpoint
ALTER TABLE `reels` ADD `description` text;--> statement-breakpoint
ALTER TABLE `reels` ADD `hashtags` json;--> statement-breakpoint
ALTER TABLE `reels` ADD `backgroundMusicUrl` text;--> statement-breakpoint
ALTER TABLE `reels` ADD `backgroundMusicTitle` varchar(255);--> statement-breakpoint
ALTER TABLE `videos` ADD `hashtags` json;--> statement-breakpoint
ALTER TABLE `videos` ADD `backgroundMusicUrl` text;--> statement-breakpoint
ALTER TABLE `videos` ADD `backgroundMusicTitle` varchar(255);