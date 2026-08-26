-- Claim-my-store + Google review texts (ADR 0017 conversion path)
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "claimed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "providers" ADD COLUMN IF NOT EXISTS "google_reviews" jsonb DEFAULT '[]'::jsonb;
