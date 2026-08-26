-- ============================================================
-- Catalog + trade-in: RLS, FTS, search function (ADR 0016)
-- Hand-written SQL (RLS/functions/triggers stay out of schema.ts)
-- ============================================================

-- ------------------------------------------------------------
-- RLS: catalog is public reference data; trade-ins are private
-- ------------------------------------------------------------
ALTER TABLE catalog_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_read_catalog ON catalog_products FOR SELECT
  USING (is_active);
-- writes: service role only (no INSERT/UPDATE/DELETE policies)

ALTER TABLE trade_in_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_trade_ins ON trade_in_requests FOR SELECT
  USING (user_id IS NOT NULL AND user_id = auth.uid());
-- inserts happen through the API with the service role

-- ------------------------------------------------------------
-- FTS: same bilingual weighted vector approach as products
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION catalog_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.brand, '') || ' ' || coalesce(NEW.model, '') || ' ' || coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.title_ar, '')), 'A');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_catalog_search_vector ON catalog_products;
CREATE TRIGGER trg_catalog_search_vector
  BEFORE INSERT OR UPDATE OF title, title_ar, brand, model, category
  ON catalog_products
  FOR EACH ROW EXECUTE FUNCTION catalog_search_vector_update();

CREATE INDEX IF NOT EXISTS idx_catalog_search_vector
  ON catalog_products USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_catalog_title_trgm
  ON catalog_products USING GIN ((coalesce(title, '') || ' ' || coalesce(brand, '')) gin_trgm_ops);

-- ------------------------------------------------------------
-- search_catalog(): mirror of search_listings over reference data
-- ------------------------------------------------------------
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
    c.price, c.currency, c.images, c.source, c.url,
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
