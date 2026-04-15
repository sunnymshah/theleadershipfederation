-- =========================================================================
-- Fix: RLS policies for public-facing form submission tables
--
-- Problem: `contact_inquiries` and `newsletter_subscribers` were created
-- without RLS policies. Supabase enables RLS by default on new tables,
-- so with zero policies ALL reads/writes were silently denied. Public
-- form submissions never landed, admin reads returned empty arrays.
--
-- Pattern follows add-feedback.sql / add-lead-capture.sql.
-- =========================================================================

-- =========================================================================
-- contact_inquiries
-- =========================================================================

ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Public visitors can submit an inquiry (INSERT only, no read/update)
DROP POLICY IF EXISTS "Public can submit contact inquiries" ON contact_inquiries;
CREATE POLICY "Public can submit contact inquiries"
  ON contact_inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Authenticated admin users get full access
DROP POLICY IF EXISTS "Authenticated can manage contact inquiries" ON contact_inquiries;
CREATE POLICY "Authenticated can manage contact inquiries"
  ON contact_inquiries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- =========================================================================
-- newsletter_subscribers
-- =========================================================================

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can subscribe to newsletter" ON newsletter_subscribers;
CREATE POLICY "Public can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can manage subscribers" ON newsletter_subscribers;
CREATE POLICY "Authenticated can manage subscribers"
  ON newsletter_subscribers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
