CREATE TABLE "catalog_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_product_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text,
	"contact_phone" text NOT NULL,
	"note" text,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "catalog_requests" ADD CONSTRAINT "catalog_requests_item_fkey" FOREIGN KEY ("catalog_product_id") REFERENCES "public"."catalog_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_catalog_requests_item" ON "catalog_requests" USING btree ("catalog_product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_catalog_requests_created" ON "catalog_requests" USING btree ("created_at" DESC NULLS FIRST);