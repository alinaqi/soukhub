CREATE TABLE "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_key" text NOT NULL,
	"rating" numeric(3, 2),
	"review_count" integer,
	"summary" text,
	"quotes" jsonb DEFAULT '[]'::jsonb,
	"fetched_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_product_reviews_key" UNIQUE("product_key")
);
