CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`service` text NOT NULL,
	`preferred_date` text DEFAULT '' NOT NULL,
	`budget` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`brief` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
