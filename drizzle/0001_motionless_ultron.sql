CREATE TABLE `administrators` (
	`email` text PRIMARY KEY NOT NULL,
	`added_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`community_id` text NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`joined_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `memberships_community` ON `memberships` (`community_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`sender_id` text NOT NULL,
	`recipient_id` text NOT NULL,
	`sender_name` text NOT NULL,
	`recipient_name` text NOT NULL,
	`body` text NOT NULL,
	`entry_id` text NOT NULL,
	`created_at` text NOT NULL,
	`read_at` text
);
--> statement-breakpoint
CREATE INDEX `message_recipient` ON `messages` (`recipient_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `message_sender` ON `messages` (`sender_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `moderation_log` (
	`id` text PRIMARY KEY NOT NULL,
	`entry_id` text NOT NULL,
	`action` text NOT NULL,
	`reason` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`assignee_id` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tasks_plan` ON `tasks` (`plan_id`);--> statement-breakpoint
ALTER TABLE `entries` ADD `languages` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `skills` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `availability` text DEFAULT 'unspecified' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `moderation` text DEFAULT 'visible' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `status` text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `review_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `reports` ADD `reviewed_at` text;