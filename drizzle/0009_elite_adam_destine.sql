ALTER TABLE `users` ADD `handle` varchar(30);--> statement-breakpoint
ALTER TABLE `users` ADD `handleNormalized` varchar(30);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_handleNormalized_unique` UNIQUE(`handleNormalized`);