DROP INDEX "uq_promo_banners_event_locale";--> statement-breakpoint
ALTER TABLE "promo_banners" ADD COLUMN "category" text;--> statement-breakpoint
ALTER TABLE "promo_banners" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_promo_banners_category_locale" ON "promo_banners" USING btree ("category" text_ops,"locale" text_ops) WHERE is_active AND category IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_promo_banners_active_sort" ON "promo_banners" USING btree ("sort_order" int4_ops) WHERE is_active;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_promo_banners_event_locale" ON "promo_banners" USING btree ("event_slug" text_ops,"locale" text_ops) WHERE is_active AND event_slug IS NOT NULL;