export interface Project {
  id: string;
  name: string;
  location: string;
  description: string | null;
  total_units: number;
  sold_units: number;
  construction_status: 'planning' | 'under_construction' | 'near_completion' | 'completed';
  image_url: string | null;
  created_at: string;
}

export interface Property {
  id: string;
  project_id: string | null;
  title: string;
  plot_number: string;
  status: 'available' | 'booked' | 'sold';
  price: number;
  size_sqft: number;
  type: 'residential' | 'commercial' | 'plot';
  image_url: string | null;
  phone: string | null;
  original_dealer_name: string | null;
  original_dealer_phone: string | null;
  created_at: string;
  project?: Project | null;
}

export interface Dealer {
  id: string;
  client_name: string;
  mobile_number: string;
  category: string;
  status: string;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'agent' | 'senior_agent' | 'manager' | 'admin' | 'worker';
  phone: string | null;
  email: string | null;
  avatar_color: string;
  active_deals: number;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  budget: number;
  interested_project_id: string | null;
  status: 'new' | 'follow_up' | 'meeting' | 'closed';
  notes: string | null;
  assigned_staff_id: string | null;
  cnic: string | null;
  address: string | null;
  service: string | null;
  created_at: string;
  project?: Project | null;
  assigned_staff?: Staff | null;
}

export interface StaffActivity {
  id: string;
  staff_id: string;
  lead_id: string | null;
  activity_type: 'call' | 'meeting' | 'whatsapp' | 'site_visit' | 'follow_up' | 'deal_progress' | 'note';
  deal_stage: 'initial_inquiry' | 'discussion_held' | 'token_stage' | 'follow_up_required' | 'deal_closed' | 'deal_lost';
  notes: string | null;
  activity_date: string;
  next_followup_date: string | null;
  created_at: string;
  staff?: Staff | null;
  lead?: Lead | null;
}

export interface Booking {
  id: string;
  property_id: string | null;
  lead_id: string | null;
  booking_date: string;
  total_price: number;
  down_payment: number;
  installment_months: number;
  created_at: string;
  property?: Property | null;
  lead?: Lead | null;
}

export interface Installment {
  id: string;
  booking_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid';
  paid_date: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

export interface FeaturedListing {
  id: string;
  property_id: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  property?: Property | null;
}

export interface HomepageBanner {
  id: string;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  bg_color: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  office_address: string | null;
  phone: string | null;
  whatsapp_link: string | null;
  email: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  linkedin: string | null;
  youtube: string | null;
  map_embed_url: string | null;
  updated_at: string;
}

export interface WebInquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  interested_property_id: string | null;
  status: 'new' | 'contacted' | 'converted' | 'ignored';
  created_at: string;
  property?: Property | null;
}
