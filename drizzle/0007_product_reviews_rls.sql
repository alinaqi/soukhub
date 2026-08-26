-- Review intelligence is public read; writes via service role only
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY public_read_reviews ON product_reviews FOR SELECT USING (true);
