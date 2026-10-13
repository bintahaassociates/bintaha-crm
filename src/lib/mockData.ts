import type { Property, Lead, Transaction, Installment, Booking, Project, Staff, StaffActivity, FeaturedListing, HomepageBanner, SiteSettings, WebInquiry, Dealer } from './types';

export const mockProjects: Project[] = [
  { id: 'p1', name: 'Green Valley Residency', location: 'Banjara Hills, Hyderabad', description: 'Premium residential plots with gated community', total_units: 120, sold_units: 85, construction_status: 'under_construction', image_url: null, created_at: new Date().toISOString() },
  { id: 'p2', name: 'City Heights Commercial', location: 'Latifabad, Hyderabad', description: 'Commercial shops and offices', total_units: 60, sold_units: 30, construction_status: 'near_completion', image_url: null, created_at: new Date().toISOString() },
];

export const mockProperties: Property[] = [
  { id: 'pr1', project_id: 'p1', title: 'Residential Plot 24-A', plot_number: 'GV-24A', status: 'available', price: 2500000, size_sqft: 1500, type: 'residential', image_url: null, phone: '+92 300 1234567', original_dealer_name: 'Imran Qureshi', original_dealer_phone: '+92 321 4444444', created_at: new Date().toISOString(), project: mockProjects[0] },
  { id: 'pr2', project_id: 'p1', title: 'Residential Plot 25-B', plot_number: 'GV-25B', status: 'booked', price: 2800000, size_sqft: 1800, type: 'residential', image_url: null, phone: '+92 300 7654321', original_dealer_name: 'Kamran Sheikh', original_dealer_phone: '+92 333 5555555', created_at: new Date().toISOString(), project: mockProjects[0] },
  { id: 'pr3', project_id: 'p2', title: 'Commercial Shop 12', plot_number: 'CH-12', status: 'sold', price: 5000000, size_sqft: 800, type: 'commercial', image_url: null, phone: '+92 301 9876543', original_dealer_name: 'Direct', original_dealer_phone: '-', created_at: new Date().toISOString(), project: mockProjects[1] },
  { id: 'pr4', project_id: 'p1', title: 'Residential Plot 30-C', plot_number: 'GV-30C', status: 'available', price: 2200000, size_sqft: 1200, type: 'plot', image_url: null, phone: '+92 345 1111111', original_dealer_name: 'Sana Malik', original_dealer_phone: '+92 345 2222222', created_at: new Date().toISOString(), project: mockProjects[0] },
];

export const mockDealers: Dealer[] = [
  { id: 'd1', client_name: 'Imran Qureshi', mobile_number: '+92 321 4444444', category: 'Residential', status: 'active', created_at: new Date().toISOString() },
  { id: 'd2', client_name: 'Kamran Sheikh', mobile_number: '+92 333 5555555', category: 'Commercial', status: 'active', created_at: new Date().toISOString() },
  { id: 'd3', client_name: 'Sana Malik', mobile_number: '+92 345 2222222', category: 'Plots', status: 'inactive', created_at: new Date().toISOString() },
  { id: 'd4', client_name: 'Bilal Ahmed', mobile_number: '+92 333 7777777', category: 'Residential', status: 'active', created_at: new Date().toISOString() },
];

export const mockLeads: Lead[] = [
  { id: 'l1', name: 'Ahmed Raza', phone: '+92 300 1234567', email: 'ahmed@example.com', budget: 3000000, interested_project_id: 'p1', status: 'new', notes: 'Interested in 1500 sqft plot', assigned_staff_id: null, cnic: '42101-1234567-1', address: 'Block A, Gulshan, Karachi', service: 'Residential Plot', created_at: new Date().toISOString(), project: mockProjects[0] },
  { id: 'l2', name: 'Fatima Khan', phone: '+92 301 9876543', email: 'fatima@example.com', budget: 5000000, interested_project_id: 'p2', status: 'follow_up', notes: 'Wants commercial shop', assigned_staff_id: null, cnic: '42101-7654321-2', address: 'PECHS, Block 6, Karachi', service: 'Commercial Shop', created_at: new Date().toISOString(), project: mockProjects[1] },
  { id: 'l3', name: 'Bilal Ahmed', phone: '+92 333 5555555', email: null, budget: 2500000, interested_project_id: 'p1', status: 'meeting', notes: 'Scheduled site visit', assigned_staff_id: null, cnic: '42201-3456789-3', address: 'Latifabad, Hyderabad', service: 'Investment Plot', created_at: new Date().toISOString(), project: mockProjects[0] },
  { id: 'l4', name: 'Sana Malik', phone: '+92 345 1111111', email: 'sana@example.com', budget: 4500000, interested_project_id: null, status: 'closed', notes: 'Purchased plot 25-B', assigned_staff_id: null, cnic: '42101-9876543-4', address: 'Banjara Hills, Hyderabad', service: 'Residential Plot', created_at: new Date().toISOString() },
];

export const mockStaff: Staff[] = [
  { id: 's1', name: 'Usman Ali', role: 'senior_agent', phone: '+92 300 1111111', email: 'usman@bintaha.com', avatar_color: '#d4af37', active_deals: 5, created_at: new Date().toISOString() },
  { id: 's2', name: 'Ayesha Siddiqui', role: 'agent', phone: '+92 301 2222222', email: 'ayesha@bintaha.com', avatar_color: '#3b82f6', active_deals: 3, created_at: new Date().toISOString() },
  { id: 's3', name: 'Kamran Sheikh', role: 'manager', phone: '+92 333 3333333', email: 'kamran@bintaha.com', avatar_color: '#10b981', active_deals: 0, created_at: new Date().toISOString() },
];

export const mockActivities: StaffActivity[] = [
  { id: 'a1', staff_id: 's1', lead_id: 'l1', activity_type: 'call', deal_stage: 'initial_inquiry', notes: 'First call with Ahmed, interested in GV plots', activity_date: new Date().toISOString().split('T')[0], next_followup_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], created_at: new Date().toISOString(), staff: mockStaff[0], lead: mockLeads[0] },
  { id: 'a2', staff_id: 's2', lead_id: 'l2', activity_type: 'whatsapp', deal_stage: 'discussion_held', notes: 'Sent commercial shop details', activity_date: new Date().toISOString().split('T')[0], next_followup_date: null, created_at: new Date().toISOString(), staff: mockStaff[1], lead: mockLeads[1] },
];

export const mockBookings: Booking[] = [
  { id: 'b1', property_id: 'pr2', lead_id: 'l4', booking_date: new Date().toISOString().split('T')[0], total_price: 2800000, down_payment: 560000, installment_months: 24, created_at: new Date().toISOString(), property: mockProperties[1], lead: mockLeads[3] },
  { id: 'b2', property_id: 'pr3', lead_id: null, booking_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], total_price: 5000000, down_payment: 1500000, installment_months: 12, created_at: new Date(Date.now() - 30 * 86400000).toISOString(), property: mockProperties[2] },
];

export const mockInstallments: Installment[] = [
  { id: 'i1', booking_id: 'b1', installment_number: 1, due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], amount: 93333, status: 'pending', paid_date: null, created_at: new Date().toISOString() },
  { id: 'i2', booking_id: 'b1', installment_number: 2, due_date: new Date(Date.now() + 37 * 86400000).toISOString().split('T')[0], amount: 93333, status: 'pending', paid_date: null, created_at: new Date().toISOString() },
  { id: 'i3', booking_id: 'b2', installment_number: 1, due_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0], amount: 291666, status: 'paid', paid_date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 'i4', booking_id: 'b2', installment_number: 2, due_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], amount: 291666, status: 'pending', paid_date: null, created_at: new Date().toISOString() },
];

export const mockTransactions: Transaction[] = [
  { id: 't1', type: 'revenue', category: 'Plot Sale', amount: 2800000, description: 'Booking payment - GV-25B', transaction_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 't2', type: 'revenue', category: 'Installment', amount: 291666, description: 'Installment 1 - CH-12', transaction_date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 't3', type: 'expense', category: 'Construction', amount: 500000, description: 'Foundation work - Green Valley', transaction_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0], created_at: new Date().toISOString() },
  { id: 't4', type: 'revenue', category: 'Booking', amount: 1500000, description: 'Down payment - CH-12', transaction_date: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], created_at: new Date().toISOString() },
];

export const mockFeatured: FeaturedListing[] = [
  { id: 'f1', property_id: 'pr1', display_order: 1, is_active: true, created_at: new Date().toISOString(), property: mockProperties[0] },
  { id: 'f2', property_id: 'pr4', display_order: 2, is_active: true, created_at: new Date().toISOString(), property: mockProperties[3] },
];

export const mockBanners: HomepageBanner[] = [
  { id: 'bn1', title: 'Premium Plots in Green Valley', subtitle: 'Invest in your future with luxury residential plots', button_text: 'View Plots', button_link: '#properties', bg_color: '#d4af37', is_active: true, display_order: 1, created_at: new Date().toISOString() },
];

export const mockSettings: SiteSettings = {
  id: 'ss1',
  office_address: 'Banjara Hills, Hyderabad, Pakistan',
  phone: '+92 300 1234567',
  whatsapp_link: 'https://wa.me/923001234567',
  email: 'info@bintaha.com',
  facebook: 'https://facebook.com/bintaha',
  instagram: 'https://instagram.com/bintaha',
  twitter: null,
  linkedin: null,
  youtube: null,
  map_embed_url: null,
  updated_at: new Date().toISOString(),
};

export const mockInquiries: WebInquiry[] = [
  { id: 'w1', name: 'Imran Qureshi', email: 'imran@example.com', phone: '+92 321 4444444', message: 'Interested in Green Valley plots, need pricing details', interested_property_id: 'pr1', status: 'new', created_at: new Date().toISOString(), property: mockProperties[0] },
  { id: 'w2', name: 'Zainab Hassan', email: 'zainab@example.com', phone: '+92 322 5555555', message: 'Looking for commercial shop under 5 million', interested_property_id: null, status: 'contacted', created_at: new Date(Date.now() - 5 * 86400000).toISOString(), property: null },
];

export const externalHubs = [
  { label: 'Main Web Portal', url: 'https://bintahaassociates.github.io/bintaha-main/', description: 'Public-facing real estate website', icon: 'globe' },
  { label: 'Accounting ERP', url: 'https://bintahaassociates.github.io/bintaha-acconting/', description: 'Financial management system', icon: 'calculator' },
  { label: 'Digital Business Card', url: 'https://bintahaassociates.github.io/bintaha-dc/', description: 'Shareable digital visiting card', icon: 'contact' },
  { label: 'Bin Taha Mobile App', url: 'https://bintahaassociates.github.io/app/', description: 'Customer mobile app', icon: 'smartphone' },
  { label: 'Google Customer Review', url: 'https://g.page/r/CWz-AXhNPX1kEBM/review', description: 'Leave us a review on Google', icon: 'star' },
];

export const ecosystemLinks = externalHubs;
