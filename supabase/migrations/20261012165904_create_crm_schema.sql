/*
# Real Estate Property CRM Schema

## Overview
Creates the full database schema for a Real Estate Property CRM web app.
This is a single-tenant app with no authentication — all data is shared/public.

## New Tables
1. `projects` — Societies/buildings/developments with construction progress
   - id, name, location, description, total_units, sold_units, construction_status, image_url, created_at
2. `properties` — Individual plots/units within projects
   - id, project_id (FK), title, plot_number, status (available/booked/sold), price, size_sqft, type, image_url, created_at
3. `leads` — CRM lead pipeline
   - id, name, phone, email, budget, interested_project_id (FK), status (new/follow_up/meeting/closed), notes, created_at
4. `bookings` — Sales records linking properties to leads
   - id, property_id (FK), lead_id (FK), booking_date, total_price, down_payment, created_at
5. `installments` — Monthly installment schedule for bookings
   - id, booking_id (FK), due_date, amount, status (pending/paid), paid_date, created_at
6. `transactions` — Revenue and expense records for dashboard charts
   - id, type (revenue/expense), category, amount, description, transaction_date, created_at

## Security
- RLS enabled on all tables.
- All policies use `TO anon, authenticated` since this is a single-tenant no-auth app.
- All CRUD operations allowed for anon + authenticated.
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  description text,
  total_units integer NOT NULL DEFAULT 0,
  sold_units integer NOT NULL DEFAULT 0,
  construction_status text NOT NULL DEFAULT 'planning' CHECK (construction_status IN ('planning', 'under_construction', 'near_completion', 'completed')),
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE TO anon, authenticated USING (true);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  plot_number text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'sold')),
  price numeric(14,2) NOT NULL DEFAULT 0,
  size_sqft numeric(10,2) NOT NULL DEFAULT 0,
  type text NOT NULL DEFAULT 'residential' CHECK (type IN ('residential', 'commercial', 'plot')),
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_properties" ON properties;
CREATE POLICY "anon_select_properties" ON properties FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_properties" ON properties;
CREATE POLICY "anon_insert_properties" ON properties FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_properties" ON properties;
CREATE POLICY "anon_update_properties" ON properties FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_properties" ON properties;
CREATE POLICY "anon_delete_properties" ON properties FOR DELETE TO anon, authenticated USING (true);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  budget numeric(14,2) NOT NULL DEFAULT 0,
  interested_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'follow_up', 'meeting', 'closed')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_leads" ON leads;
CREATE POLICY "anon_select_leads" ON leads FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_leads" ON leads;
CREATE POLICY "anon_insert_leads" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_leads" ON leads;
CREATE POLICY "anon_update_leads" ON leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_leads" ON leads;
CREATE POLICY "anon_delete_leads" ON leads FOR DELETE TO anon, authenticated USING (true);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  booking_date date NOT NULL DEFAULT CURRENT_DATE,
  total_price numeric(14,2) NOT NULL DEFAULT 0,
  down_payment numeric(14,2) NOT NULL DEFAULT 0,
  installment_months integer NOT NULL DEFAULT 12,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_bookings" ON bookings;
CREATE POLICY "anon_select_bookings" ON bookings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_bookings" ON bookings;
CREATE POLICY "anon_insert_bookings" ON bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_bookings" ON bookings;
CREATE POLICY "anon_update_bookings" ON bookings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_bookings" ON bookings;
CREATE POLICY "anon_delete_bookings" ON bookings FOR DELETE TO anon, authenticated USING (true);

-- Installments table
CREATE TABLE IF NOT EXISTS installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
  installment_number integer NOT NULL DEFAULT 1,
  due_date date NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  paid_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_installments" ON installments;
CREATE POLICY "anon_select_installments" ON installments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_installments" ON installments;
CREATE POLICY "anon_insert_installments" ON installments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_installments" ON installments;
CREATE POLICY "anon_update_installments" ON installments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_installments" ON installments;
CREATE POLICY "anon_delete_installments" ON installments FOR DELETE TO anon, authenticated USING (true);

-- Transactions table (for dashboard charts)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('revenue', 'expense')),
  category text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  description text,
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_transactions" ON transactions;
CREATE POLICY "anon_select_transactions" ON transactions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transactions" ON transactions;
CREATE POLICY "anon_insert_transactions" ON transactions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transactions" ON transactions;
CREATE POLICY "anon_update_transactions" ON transactions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transactions" ON transactions;
CREATE POLICY "anon_delete_transactions" ON transactions FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_project_id ON properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_installments_booking_id ON installments(booking_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);