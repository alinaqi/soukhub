CREATE TABLE "provider_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text,
	"contact_phone" text NOT NULL,
	"item_wanted" text NOT NULL,
	"delivery_address" text,
	"emirate" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_place_id" text NOT NULL,
	"slug" text,
	"name" text NOT NULL,
	"phone" text,
	"whatsapp" text,
	"website" text,
	"address" text,
	"area" text,
	"emirate" text,
	"lat" numeric(10, 7),
	"lng" numeric(10, 7),
	"google_rating" numeric(2, 1),
	"google_review_count" integer,
	"category" text,
	"hours" jsonb DEFAULT '{}'::jsonb,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"claimed_org_id" uuid,
	"scraped_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_providers_place" UNIQUE("google_place_id")
);
--> statement-breakpoint
ALTER TABLE "provider_requests" ADD CONSTRAINT "provider_requests_provider_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_provider_requests_provider" ON "provider_requests" USING btree ("provider_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_provider_requests_created" ON "provider_requests" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_providers_emirate" ON "providers" USING btree ("emirate" text_ops);--> statement-breakpoint
CREATE INDEX "idx_providers_active" ON "providers" USING btree ("is_active");