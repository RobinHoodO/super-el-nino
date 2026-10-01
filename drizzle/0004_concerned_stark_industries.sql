CREATE TABLE `work_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `work_items` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'todo' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`assignee_id` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`moderation` text DEFAULT 'visible' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `work_kind_status` ON `work_items` (`kind`,`status`);--> statement-breakpoint
CREATE TABLE `work_links` (
	`id` text PRIMARY KEY NOT NULL,
	`from_id` text NOT NULL,
	`to_id` text NOT NULL,
	`relation` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_link_unique` ON `work_links` (`from_id`,`to_id`,`relation`);--> statement-breakpoint
CREATE TABLE `work_members` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`joined_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_member_user` ON `work_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `work_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `work_subscription_unique` ON `work_subscriptions` (`item_id`,`user_id`);