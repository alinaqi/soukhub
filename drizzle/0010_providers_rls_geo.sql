-- Provider directory: RLS, slug default, nearest-provider search (ADR 0017)

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_read_providers ON providers FOR SELECT USING (is_active);
-- writes: service role only

ALTER TABLE provider_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_provider_requests ON provider_requests FOR SELECT
  USING (user_id IS NOT NULL AND user_id = auth.uid());
-- inserts via API (service role)

-- slug default from name (+ area to disambiguate chains)
CREATE OR REPLACE FUNCTION provider_slug_default()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug := short_slug(coalesce(NEW.name, 'shop') || ' ' || coalesce(NEW.area, ''));
    IF EXISTS (SELECT 1 FROM providers WHERE slug = NEW.slug AND id <> NEW.id) THEN
      NEW.slug := NEW.slug || '-' || substr(md5(NEW.google_place_id), 1, 5);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_provider_slug_default ON providers;
CREATE TRIGGER trg_provider_slug_default
  BEFORE INSERT ON providers
  FOR EACH ROW EXECUTE FUNCTION provider_slug_default();

CREATE UNIQUE INDEX IF NOT EXISTS uq_providers_slug ON providers(slug);

-- Nearest providers by haversine distance (km); anon-callable, active only
CREATE OR REPLACE FUNCTION nearby_providers(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  area TEXT,
  emirate TEXT,
  lat NUMERIC,
  lng NUMERIC,
  google_rating NUMERIC,
  google_review_count INTEGER,
  image_url TEXT,
  distance_km NUMERIC
)
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT
    p.id, p.slug, p.name, p.phone, p.whatsapp, p.address, p.area, p.emirate,
    p.lat, p.lng, p.google_rating, p.google_review_count, p.image_url,
    round((
      6371 * acos(
        least(1, greatest(-1,
          cos(radians(p_lat)) * cos(radians(p.lat)) *
          cos(radians(p.lng) - radians(p_lng)) +
          sin(radians(p_lat)) * sin(radians(p.lat))
        ))
      )
    )::numeric, 2) AS distance_km
  FROM providers p
  WHERE p.is_active AND p.lat IS NOT NULL AND p.lng IS NOT NULL
  ORDER BY distance_km ASC
  LIMIT least(greatest(p_limit, 1), 60);
$$;

GRANT EXECUTE ON FUNCTION nearby_providers TO anon, authenticated;
