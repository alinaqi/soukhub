CREATE TABLE "promo_banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_slug" text,
	"headline" text NOT NULL,
	"image_url" text NOT NULL,
	"href" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_promo_banners_event" ON "promo_banners" USING btree ("event_slug" text_ops) WHERE is_active;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_promo_banners_event_locale" ON "promo_banners" USING btree ("event_slug" text_ops,"locale" text_ops) WHERE is_active;--> statement-breakpoint
-- Auto-generated promo banners (Protaige Sketch): public read; images in a public bucket
ALTER TABLE promo_banners ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY public_read_promo_banners ON promo_banners FOR SELECT TO public USING (is_active);--> statement-breakpoint
GRANT SELECT ON promo_banners TO anon, authenticated;--> statement-breakpoint
INSERT INTO storage.buckets (id, name, public) VALUES ('promo-banners', 'promo-banners', true)
  ON CONFLICT (id) DO NOTHING;
