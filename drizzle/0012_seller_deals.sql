CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"deal_price" numeric(10, 2) NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_org_fkey" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_product_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_deals_org" ON "deals" USING btree ("org_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_product" ON "deals" USING btree ("product_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_deals_window" ON "deals" USING btree ("ends_at" DESC NULLS FIRST) WHERE is_active;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_deals_product_active" ON "deals" USING btree ("product_id" uuid_ops) WHERE is_active;--> statement-breakpoint
-- Seller-run deals (promoted marketplace-wide): RLS + guardrails
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY org_members_all ON deals FOR ALL TO public
  USING (
    is_org_member(org_id)
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = deals.product_id AND p.org_id = deals.org_id)
  )
  WITH CHECK (
    is_org_member(org_id)
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = deals.product_id AND p.org_id = deals.org_id)
  );--> statement-breakpoint
CREATE POLICY public_read_live_deals ON deals FOR SELECT TO public
  USING (
    is_active AND starts_at <= now() AND ends_at > now()
    AND EXISTS (
      SELECT 1 FROM products p JOIN organizations o ON o.id = p.org_id
      WHERE p.id = deals.product_id AND p.is_published AND o.is_published
    )
  );--> statement-breakpoint
ALTER TABLE deals ADD CONSTRAINT deals_price_positive CHECK (deal_price > 0);--> statement-breakpoint
ALTER TABLE deals ADD CONSTRAINT deals_window_valid CHECK (ends_at > starts_at);
--> statement-breakpoint
-- Freshness display (spec §7.6): public pages show "Verified {n}h ago"
GRANT SELECT (scraped_at) ON catalog_products TO anon, authenticated;
