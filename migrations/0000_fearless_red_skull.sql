CREATE TABLE IF NOT EXISTS "contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone_number" text,
	"email" text,
	"linked_id" integer,
	"link_precedence" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);

CREATE UNIQUE INDEX IF NOT EXISTS "email_idx" ON "contacts" ("email");
CREATE UNIQUE INDEX IF NOT EXISTS "phone_number_idx" ON "contacts" ("phone_number");