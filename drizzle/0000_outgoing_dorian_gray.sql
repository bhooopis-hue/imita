CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `clients_owner` ON `clients` (`owner`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`delivery_id` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`decision` text DEFAULT 'comment' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`delivery_id`) REFERENCES `deliveries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `comments_delivery` ON `comments` (`delivery_id`);--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`reviewer` text NOT NULL,
	`status` text DEFAULT 'review' NOT NULL,
	`token` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `deliveries_token_unique` ON `deliveries` (`token`);--> statement-breakpoint
CREATE INDEX `deliveries_project` ON `deliveries` (`project_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`client_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`due` text NOT NULL,
	`status` text DEFAULT 'production' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `projects_owner` ON `projects` (`owner`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tasks_project` ON `tasks` (`project_id`);