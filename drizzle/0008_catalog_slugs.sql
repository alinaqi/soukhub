-- SEO-friendly catalog URLs: /m/{slug}-{short_id} (was /m/{uuid})
ALTER TABLE catalog_products
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE
    DEFAULT lower(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));

CREATE OR REPLACE FUNCTION short_slug(input TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $fn$
  SELECT CASE
    WHEN length(s) > 60 THEN regexp_replace(left(s, 60), '-[^-]*$', '')
    ELSE s
  END
  FROM (SELECT coalesce(slugify(input), 'item') AS s) t;
$fn$;

CREATE OR REPLACE FUNCTION catalog_slug_default()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := short_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_catalog_slug_default ON catalog_products;
CREATE TRIGGER trg_catalog_slug_default
  BEFORE INSERT ON catalog_products
  FOR EACH ROW EXECUTE FUNCTION catalog_slug_default();

UPDATE catalog_products SET slug = short_slug(title);
UPDATE catalog_products
  SET short_id = lower(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))
  WHERE short_id IS NULL;

-- search_catalog returns the URL fields (return type changes → drop first)
DROP FUNCTION IF EXISTS search_catalog(TEXT, TEXT, TEXT, NUMERIC, NUMERIC, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION search_catalog(
  p_query TEXT DEFAULT '',
  p_brand TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_limit INTEGER DEFAULT 12,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  title_ar TEXT,
  brand TEXT,
  model TEXT,
  category TEXT,
  condition TEXT,
  price NUMERIC,
  currency TEXT,
  images JSONB,
  source TEXT,
  url TEXT,
  slug TEXT,
  short_id TEXT,
  rank REAL
)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH q AS (
    SELECT
      NULLIF(trim(p_query), '') AS text_query,
      websearch_to_tsquery('english', coalesce(p_query, '')) AS ts_en,
      websearch_to_tsquery('simple', coalesce(p_query, '')) AS ts_simple
  )
  SELECT
    c.id, c.title, c.title_ar, c.brand, c.model, c.category, c.condition,
    c.price, c.currency, c.images, c.source, c.url, c.slug, c.short_id,
    (
      CASE WHEN q.text_query IS NULL THEN 0
        ELSE greatest(
          ts_rank(c.search_vector, q.ts_en),
          ts_rank(c.search_vector, q.ts_simple),
          similarity(coalesce(c.title, '') || ' ' || coalesce(c.brand, ''), q.text_query)
        )
      END
    )::real AS rank
  FROM catalog_products c
  CROSS JOIN q
  WHERE c.is_active
    AND (p_brand IS NULL OR c.brand ILIKE p_brand)
    AND (p_category IS NULL OR c.category ILIKE p_category)
    AND (p_min_price IS NULL OR c.price >= p_min_price)
    AND (p_max_price IS NULL OR c.price <= p_max_price)
    AND (
      q.text_query IS NULL
      OR c.search_vector @@ q.ts_en
      OR c.search_vector @@ q.ts_simple
      OR (coalesce(c.title, '') || ' ' || coalesce(c.brand, '')) % q.text_query
    )
  ORDER BY rank DESC, c.scraped_at DESC
  LIMIT least(greatest(p_limit, 1), 60)
  OFFSET greatest(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION search_catalog TO anon, authenticated;

-- anon needs the new columns
GRANT SELECT (slug, short_id) ON catalog_products TO anon;
