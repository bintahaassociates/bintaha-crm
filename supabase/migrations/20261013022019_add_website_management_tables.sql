/*
# Website Management Tables

## Overview
Adds tables to support the Website Management section: featured listings, homepage banners, site contact/social settings, and web inquiry submissions from the public website.

## New Tables
1. `featured_listings` — Links to properties to toggle which appear on the public website homepage.
   - id, property_id (FK to properties), display_order, is_active, created_at
2. `homepage_banners` — Marketing banners, promotional headings, and announcements.
   - id, title, subtitle, button_text, button_link, bg_color, is_active, display_order, created_at
3. `site_settings` — Single-row table for contact & social info shown on the public site.
   - id, office_address, phone, whatsapp_link, email, facebook, instagram, twitter, linkedin, youtube, map_embed_url, updated_at
4. `web_inquiries` — Inquiries submitted through the public website contact form.
   - id, name, email, phone, message, interested_property_id (FK), status (new/contacted/converted/ignored), created_at

## Security
- RLS enabled on all new tables.
- All policies use `TO anon, authenticated` (single-tenant no-auth app).
- Web inquiries can be inserted by anon (public form) but managed by the CRM.
*/

-- Featured Listings table
CREATE TABLE IF NOT EXISTS featured_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE featured_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_featured" ON featured_listings;
CREATE POLICY "anon_select_featured" ON featured_listings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_featured" ON featured_listings;
CREATE POLICY "anon_insert_featured" ON featured_listings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_featured" ON featured_listings;
CREATE POLICY "anon_update_featured" ON featured_listings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_featured" ON featured_listings;
CREATE POLICY "anon_delete_featured" ON featured_listings FOR DELETE TO anon, authenticated USING (true);

-- Homepage Banners table
CREATE TABLE IF NOT EXISTS homepage_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  button_text text,
  button_link text,
  bg_color text NOT NULL DEFAULT '#d4af37',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE homepage_banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_banners" ON homepage_banners;
CREATE POLICY "anon_select_banners" ON homepage_banners FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_banners" ON homepage_banners;
CREATE POLICY "anon_insert_banners" ON homepage_banners FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_banners" ON homepage_banners;
CREATE POLICY "anon_update_banners" ON homepage_banners FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_banners" ON homepage_banners;
CREATE POLICY "anon_delete_banners" ON homepage_banners FOR DELETE TO anon, authenticated USING (true);

-- Site Settings table (single-row)
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_address text,
  phone text,
  whatsapp_link text,
  email text,
  facebook text,
  instagram text,
  twitter text,
  linkedin text,
  youtube text,
  map_embed_url text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_settings" ON site_settings;
CREATE POLICY "anon_select_settings" ON site_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON site_settings;
CREATE POLICY "anon_insert_settings" ON site_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON site_settings;
CREATE POLICY "anon_update_settings" ON site_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_settings" ON site_settings;
CREATE POLICY "anon_delete_settings" ON site_settings FOR DELETE TO anon, authenticated USING (true);

-- Web Inquiries table
CREATE TABLE IF NOT EXISTS web_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  message text,
  interested_property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'ignored')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE web_inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_inquiries" ON web_inquiries;
CREATE POLICY "anon_select_inquiries" ON web_inquiries FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_inquiries" ON web_inquiries;
CREATE POLICY "anon_insert_inquiries" ON web_inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inquiries" ON web_inquiries;
CREATE POLICY "anon_update_inquiries" ON web_inquiries FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_inquiries" ON web_inquiries;
CREATE POLICY "anon_delete_inquiries" ON web_inquiries FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_featured_property ON featured_listings(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON web_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON web_inquiries(created_at DESC);
