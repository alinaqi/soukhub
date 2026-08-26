-- catalog_requests: buyers create via the API (service role); owners read
-- their own; operators use the service role. No anon table access.
ALTER TABLE catalog_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_catalog_requests ON catalog_requests FOR SELECT
  USING (user_id IS NOT NULL AND user_id = auth.uid());
