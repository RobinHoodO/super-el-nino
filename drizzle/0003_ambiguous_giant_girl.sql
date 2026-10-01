CREATE TABLE `places` (
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`country_code` text DEFAULT '' NOT NULL,
	`admin_code` text DEFAULT '' NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`precision` text NOT NULL,
	`source` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `entries` ADD `place_id` text;--> statement-breakpoint
ALTER TABLE `entries` ADD `location_scope` text DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `online_available` integer DEFAULT 0 NOT NULL;