-- ============================================================
-- SEARCH V1 (TODO-044, ADR 0013)
-- Postgres-native product search: FTS (english + simple for Arabic)
-- + pg_trgm typo tolerance + attribute filters, one SQL function.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Weighted, bilingual search vector kept fresh by trigger (a generated column
-- cannot use to_tsvector(regconfig, text) since it is only STABLE).
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.brand, '') || ' ' || coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.title_ar, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description_ar, '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, brand, category, description, title_ar, description_ar
  ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- Backfill existing rows (touch a search-relevant column to fire the trigger)
UPDATE products SET name = name WHERE search_vector IS NULL;

-- URL slug default for new listings (short_id already defaults in the tenancy migration)
CREATE OR REPLACE FUNCTION products_slug_default()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := coalesce(slugify(NEW.name), 'listing');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_products_slug_default ON products;
CREATE TRIGGER trg_products_slug_default
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION products_slug_default();

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN ((coalesce(name, '') || ' ' || coalesce(brand, '')) gin_trgm_ops);

-- ------------------------------------------------------------
-- search_listings(): SECURITY INVOKER — RLS keeps drafts and
-- unpublished stores out for every caller including anon.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_listings(
  p_query TEXT DEFAULT '',
  p_brand TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_limit INTEGER DEFAULT 24,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  title_ar TEXT,
  brand TEXT,
  category TEXT,
  base_price NUMERIC,
  images JSONB,
  slug TEXT,
  short_id TEXT,
  org_id UUID,
  store_name TEXT,
  store_slug TEXT,
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
    p.id, p.name, p.title_ar, p.brand, p.category, p.base_price, p.images,
    p.slug, p.short_id, p.org_id,
    o.name AS store_name, o.slug AS store_slug,
    (
      CASE WHEN q.text_query IS NULL THEN 0
        ELSE greatest(
          ts_rank(p.search_vector, q.ts_en),
          ts_rank(p.search_vector, q.ts_simple),
          similarity(coalesce(p.name, '') || ' ' || coalesce(p.brand, ''), q.text_query)
        )
      END
      + least(0.1, 0.1 / (1 + extract(epoch FROM now() - p.created_at) / 604800))
    )::real AS rank
  FROM products p
  JOIN organizations o ON o.id = p.org_id
  CROSS JOIN q
  WHERE p.is_published
    AND o.is_published
    AND (p_brand IS NULL OR p.brand ILIKE p_brand)
    AND (p_category IS NULL OR p.category ILIKE p_category)
    AND (p_min_price IS NULL OR p.base_price >= p_min_price)
    AND (p_max_price IS NULL OR p.base_price <= p_max_price)
    AND (
      q.text_query IS NULL
      OR p.search_vector @@ q.ts_en
      OR p.search_vector @@ q.ts_simple
      OR (coalesce(p.name, '') || ' ' || coalesce(p.brand, '')) % q.text_query
    )
  ORDER BY rank DESC, p.created_at DESC
  LIMIT least(greatest(p_limit, 1), 60)
  OFFSET greatest(p_offset, 0);
$$;

GRANT EXECUTE ON FUNCTION search_listings TO anon, authenticated;
