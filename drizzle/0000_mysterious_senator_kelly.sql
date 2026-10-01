CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`location` text NOT NULL,
	`category` text NOT NULL,
	`phase` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`contact_public` integer DEFAULT 0 NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`starts_at` text DEFAULT '' NOT NULL,
	`parent_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `entries_kind_location` ON `entries` (`kind`,`location`);--> statement-breakpoint
CREATE INDEX `entries_owner` ON `entries` (`owner_id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`reporter_id` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL
);
