/*
# Add property dealer fields, lead detail fields, and dealers directory table

## What changes

1. Properties table: adds `phone`, `original_dealer_name`, `original_dealer_phone` columns
   - Phone lets agents store a contact number for each property listing
   - Original dealer fields track the source dealer who referred the property

2. Leads table: adds `cnic`, `address`, `service` columns
   - CNIC = Pakistani national ID number for client verification
   - Address = client's residential address
   - Service = what service the client is interested in (e.g. plot, shop, investment)

3. New table: `dealers` — a directory of original dealers/referrers
   - Tracks dealer name, mobile, category, and active/inactive status

## Security

- This is a no-auth single-tenant CRM. All tables use `TO anon, authenticated` policies
  so the anon-key frontend can read and write its own data.
- RLS enabled on the new `dealers` table with full CRUD for anon+authenticated.
*/

-- Add columns to properties (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'phone') THEN
    ALTER TABLE properties ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'original_dealer_name') THEN
    ALTER TABLE properties ADD COLUMN original_dealer_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'original_dealer_phone') THEN
    ALTER TABLE properties ADD COLUMN original_dealer_phone text;
  END IF;
END $$;

-- Add columns to leads (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'cnic') THEN
    ALTER TABLE leads ADD COLUMN cnic text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'address') THEN
    ALTER TABLE leads ADD COLUMN address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'service') THEN
    ALTER TABLE leads ADD COLUMN service text;
  END IF;
END $$;

-- Create dealers table
CREATE TABLE IF NOT EXISTS dealers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  mobile_number text NOT NULL,
  category text DEFAULT 'general',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_dealers" ON dealers;
CREATE POLICY "anon_select_dealers" ON dealers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_dealers" ON dealers;
CREATE POLICY "anon_insert_dealers" ON dealers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_dealers" ON dealers;
CREATE POLICY "anon_update_dealers" ON dealers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_dealers" ON dealers;
CREATE POLICY "anon_delete_dealers" ON dealers FOR DELETE
  TO anon, authenticated USING (true);
