CREATE TABLE "catalog_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"title_ar" text,
	"brand" text,
	"model" text,
	"category" text,
	"condition" text,
	"price" numeric(10, 2),
	"currency" text DEFAULT 'AED' NOT NULL,
	"images" jsonb DEFAULT '[]'::jsonb,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"search_vector" "tsvector",
	CONSTRAINT "uq_catalog_source_item" UNIQUE("source","source_id")
);
--> statement-breakpoint
CREATE TABLE "trade_in_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"contact_phone" text,
	"notes" text,
	"ai_assessment" jsonb DEFAULT '{}'::jsonb,
	"estimated_value" numeric(10, 2),
	"currency" text DEFAULT 'AED' NOT NULL,
	"status" text DEFAULT 'evaluated' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_catalog_brand" ON "catalog_products" USING btree ("brand" text_ops);--> statement-breakpoint
CREATE INDEX "idx_catalog_category" ON "catalog_products" USING btree ("category" text_ops);--> statement-breakpoint
CREATE INDEX "idx_catalog_active" ON "catalog_products" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_tradein_user" ON "trade_in_requests" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_tradein_created" ON "trade_in_requests" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
