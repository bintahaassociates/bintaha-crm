/*
# Add Staff / Agents and Activity Tracking System

## Overview
Adds staff member tracking and activity logging for the Bin Taha Associates CRM.
Also adds an assigned_staff_id column to leads so each client can be linked to the staff member handling them.

## New Tables
1. `staff` — Team members / agents / workers
   - id, name, role, phone, email, avatar_color, active_deals, created_at
2. `staff_activities` — Activity logs for each staff member's interactions with leads/clients
   - id, staff_id (FK), lead_id (FK), activity_type, deal_stage, notes, activity_date, next_followup_date, created_at

## Modified Tables
- `leads` — Added `assigned_staff_id` column (uuid, references staff(id), ON DELETE SET NULL)

## Security
- RLS enabled on all new tables.
- All policies use `TO anon, authenticated` (single-tenant no-auth app).
*/

-- Staff table (must be created before leads references it)
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'agent' CHECK (role IN ('agent', 'senior_agent', 'manager', 'admin', 'worker')),
  phone text,
  email text,
  avatar_color text NOT NULL DEFAULT '#d4af37',
  active_deals integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_staff" ON staff;
CREATE POLICY "anon_select_staff" ON staff FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_staff" ON staff;
CREATE POLICY "anon_insert_staff" ON staff FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_staff" ON staff;
CREATE POLICY "anon_update_staff" ON staff FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_staff" ON staff;
CREATE POLICY "anon_delete_staff" ON staff FOR DELETE TO anon, authenticated USING (true);

-- Add assigned_staff_id to leads
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'assigned_staff_id') THEN
    ALTER TABLE leads ADD COLUMN assigned_staff_id uuid REFERENCES staff(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Staff Activities table
CREATE TABLE IF NOT EXISTS staff_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('call', 'meeting', 'whatsapp', 'site_visit', 'follow_up', 'deal_progress', 'note')),
  deal_stage text NOT NULL DEFAULT 'initial_inquiry' CHECK (deal_stage IN ('initial_inquiry', 'discussion_held', 'token_stage', 'follow_up_required', 'deal_closed', 'deal_lost')),
  notes text,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  next_followup_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE staff_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_staff_activities" ON staff_activities;
CREATE POLICY "anon_select_staff_activities" ON staff_activities FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_staff_activities" ON staff_activities;
CREATE POLICY "anon_insert_staff_activities" ON staff_activities FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_staff_activities" ON staff_activities;
CREATE POLICY "anon_update_staff_activities" ON staff_activities FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_staff_activities" ON staff_activities;
CREATE POLICY "anon_delete_staff_activities" ON staff_activities FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_activities_staff_id ON staff_activities(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_activities_lead_id ON staff_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_staff_activities_date ON staff_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_staff ON leads(assigned_staff_id);
