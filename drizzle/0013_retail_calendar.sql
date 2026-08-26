CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text,
	"emoji" text,
	"category" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"expected_discount_pct" integer,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "events_window_valid" CHECK (ends_at > starts_at)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_events_slug" ON "events" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "idx_events_window" ON "events" USING btree ("ends_at" DESC NULLS FIRST) WHERE is_active;--> statement-breakpoint
-- UAE retail calendar (ADR 0018 ring-2 / spec §7.4): public read; seeded schedule
ALTER TABLE events ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY public_read_events ON events FOR SELECT TO public USING (is_active);--> statement-breakpoint
GRANT SELECT ON events TO anon, authenticated;--> statement-breakpoint
INSERT INTO events (slug, name, name_ar, emoji, category, starts_at, ends_at, expected_discount_pct, priority) VALUES
  ('back-to-school',       'Back to School',        'العودة إلى المدرسة',  '🎒', 'laptops',   '2026-08-01', '2026-09-20', 20, 10),
  ('emirati-womens-day',   'Emirati Women''s Day',  'يوم المرأة الإماراتية','🌸', NULL,        '2026-08-26', '2026-08-30', 15, 5),
  ('gitex-global',         'GITEX Tech Week',       'أسبوع جيتكس للتقنية',  '💻', 'laptops',   '2026-10-13', '2026-10-19', 15, 6),
  ('white-friday',         'White Friday',          'الجمعة البيضاء',       '🏷️', NULL,        '2026-11-26', '2026-11-30', 40, 9),
  ('uae-national-day',     'UAE National Day',      'اليوم الوطني للإمارات','🇦🇪', NULL,        '2026-11-30', '2026-12-04', 25, 7),
  ('dubai-shopping-festival','Dubai Shopping Festival','مهرجان دبي للتسوق', '🛍️', NULL,        '2026-12-15', '2027-01-29', 30, 8),
  ('chinese-new-year',     'Chinese New Year',      'رأس السنة الصينية',    '🧧', 'phones',    '2027-02-04', '2027-02-10', 20, 5),
  ('ramadan',              'Ramadan Offers',        'عروض رمضان',           '🌙', NULL,        '2027-02-08', '2027-03-09', 25, 8),
  ('eid-al-fitr',          'Eid al-Fitr',           'عيد الفطر',            '🎉', NULL,        '2027-03-09', '2027-03-14', 25, 9);
