CREATE TABLE IF NOT EXISTS "music_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" varchar(255),
	"description" text,
	"lyrics" text,
	"audio_url" text,
	"image_url" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"suno_task_id" varchar(255),
	"duration" integer,
	"tags" text,
	"instrumental" varchar(10) DEFAULT 'false',
	"is_private" varchar(10) DEFAULT 'false',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "music_tracks" ADD CONSTRAINT "music_tracks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

