import { useState, useCallback } from 'react';
import { Globe, Image, Phone, Mail, MessageSquare, Star, Plus, Trash2, Eye, CheckCircle2, Clock, User, ArrowRight, Save, Facebook, Instagram, Twitter, Linkedin, Youtube, MapPin, ExternalLink, Calculator, Smartphone, Contact, Link2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSyncTrigger } from '@/lib/sync';
import type { Property, FeaturedListing, HomepageBanner, SiteSettings, WebInquiry } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { ecosystemLinks, mockProperties, mockFeatured, mockBanners, mockSettings, mockInquiries } from '@/lib/mockData';
import { syncInquiryToGoogleScript } from '@/lib/webhook';
import Modal from '@/components/Modal';

type TabId = 'featured' | 'banners' | 'contact' | 'inquiries' | 'ecosystem';

const inquiryStatusConfig: Record<string, { label: string; classes: string; dot: string }> = {
  new: { label: 'New', classes: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', dot: 'bg-blue-500' },
  contacted: { label: 'Contacted', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500' },
  converted: { label: 'Converted', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500' },
  ignored: { label: 'Ignored', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
};

export default function WebsiteManagement() {
  const [activeTab, setActiveTab] = useState<TabId>('featured');
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [featured, setFeatured] = useState<FeaturedListing[]>(mockFeatured);
  const [banners, setBanners] = useState<HomepageBanner[]>(mockBanners);
  const [settings, setSettings] = useState<SiteSettings | null>(mockSettings);
  const [inquiries, setInquiries] = useState<WebInquiry[]>(mockInquiries);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<HomepageBanner | null>(null);
  const [bannerForm, setBannerForm] = useState({ title: '', subtitle: '', button_text: '', button_link: '', bg_color: '#d4af37', is_active: true, display_order: 0 });
  const [settingsForm, setSettingsForm] = useState<SiteSettings | null>(mockSettings);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [props, feat, bann, sett, inq] = await Promise.all([
        supabase.from('properties').select('*, project(*)').order('created_at', { ascending: false }).limit(20),
        supabase.from('featured_listings').select('*, property(*, project(*))').order('display_order', { ascending: true }).limit(20),
        supabase.from('homepage_banners').select('*').order('display_order', { ascending: true }).limit(20),
        supabase.from('site_settings').select('*').limit(1).maybeSingle(),
        supabase.from('web_inquiries').select('*, property(*, project(*))').order('created_at', { ascending: false }).limit(20),
      ]);
      if (props.data && props.data.length > 0) setProperties(props.data);
      if (feat.data && feat.data.length > 0) setFeatured(feat.data);
      if (bann.data && bann.data.length > 0) setBanners(bann.data);
      if (sett.data) { setSettings(sett.data); setSettingsForm(sett.data); }
      if (inq.data && inq.data.length > 0) setInquiries(inq.data);
    } catch (err) {
      console.error('Failed to load website management data, using fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useSyncTrigger(loadData);

  function reloadData() { loadData(); }

  // Featured listings toggle
  async function toggleFeatured(property: Property) {
    try {
      const existing = featured.find((f) => f.property_id === property.id);
      if (existing) {
        await supabase.from('featured_listings').delete().eq('id', existing.id);
      } else {
        const maxOrder = featured.length > 0 ? Math.max(...featured.map((f) => f.display_order)) : 0;
        await supabase.from('featured_listings').insert({ property_id: property.id, display_order: maxOrder + 1, is_active: true });
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
    reloadData();
  }

  async function toggleFeaturedActive(item: FeaturedListing) {
    try {
      await supabase.from('featured_listings').update({ is_active: !item.is_active }).eq('id', item.id);
    } catch (err) {
      console.error('Failed to toggle featured active:', err);
    }
    reloadData();
  }

  // Banners
  function openBannerModal(banner?: HomepageBanner) {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({ title: banner.title, subtitle: banner.subtitle || '', button_text: banner.button_text || '', button_link: banner.button_link || '', bg_color: banner.bg_color, is_active: banner.is_active, display_order: banner.display_order });
    } else {
      setEditingBanner(null);
      setBannerForm({ title: '', subtitle: '', button_text: '', button_link: '', bg_color: '#d4af37', is_active: true, display_order: banners.length + 1 });
    }
    setBannerModalOpen(true);
  }

  async function saveBanner() {
    setSaving(true);
    try {
      const payload = {
        title: bannerForm.title,
        subtitle: bannerForm.subtitle || null,
        button_text: bannerForm.button_text || null,
        button_link: bannerForm.button_link || null,
        bg_color: bannerForm.bg_color,
        is_active: bannerForm.is_active,
        display_order: bannerForm.display_order,
      };
      if (editingBanner) {
        await supabase.from('homepage_banners').update(payload).eq('id', editingBanner.id);
      } else {
        await supabase.from('homepage_banners').insert(payload);
      }
    } catch (err) {
      console.error('Failed to save banner:', err);
    } finally {
      setSaving(false);
      setBannerModalOpen(false);
      reloadData();
    }
  }

  async function deleteBanner(id: string) {
    try {
      await supabase.from('homepage_banners').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
    reloadData();
  }

  async function toggleBannerActive(banner: HomepageBanner) {
    try {
      await supabase.from('homepage_banners').update({ is_active: !banner.is_active }).eq('id', banner.id);
    } catch (err) {
      console.error('Failed to toggle banner:', err);
    }
    reloadData();
  }

  // Settings
  async function saveSettings() {
    if (!settingsForm) return;
    setSaving(true);
    const payload = {
      office_address: settingsForm.office_address || null,
      phone: settingsForm.phone || null,
      whatsapp_link: settingsForm.whatsapp_link || null,
      email: settingsForm.email || null,
      facebook: settingsForm.facebook || null,
      instagram: settingsForm.instagram || null,
      twitter: settingsForm.twitter || null,
      linkedin: settingsForm.linkedin || null,
      youtube: settingsForm.youtube || null,
      map_embed_url: settingsForm.map_embed_url || null,
    };
    if (settingsForm.id) {
      await supabase.from('site_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', settingsForm.id);
    } else {
      await supabase.from('site_settings').insert(payload);
    }
    setSaving(false);
    reloadData();
  }

  // Inquiries
  async function updateInquiryStatus(id: string, status: string) {
    try {
      await supabase.from('web_inquiries').update({ status }).eq('id', id);
    } catch (err) {
      console.error('Failed to update inquiry:', err);
    }
    reloadData();
  }

  async function convertInquiryToLead(inq: WebInquiry) {
    try {
      await supabase.from('leads').insert({
        name: inq.name,
        phone: inq.phone || '',
        email: inq.email || null,
        budget: 0,
        status: 'new',
        notes: inq.message || null,
      });
      await supabase.from('web_inquiries').update({ status: 'converted' }).eq('id', inq.id);
      syncInquiryToGoogleScript({ name: inq.name, phone: inq.phone, email: inq.email, message: inq.message, source: 'crm_converted_lead' });
    } catch (err) {
      console.error('Failed to convert inquiry:', err);
    }
    reloadData();
  }

  const tabs: { id: TabId; label: string; icon: typeof Globe; count?: number }[] = [
    { id: 'featured', label: 'Featured Listings', icon: Star, count: featured.filter((f) => f.is_active).length },
    { id: 'banners', label: 'Banners & Sliders', icon: Image, count: banners.filter((b) => b.is_active).length },
    { id: 'contact', label: 'Contact & Social', icon: Phone },
    { id: 'inquiries', label: 'Web Inquiries', icon: MessageSquare, count: inquiries.filter((i) => i.status === 'new').length },
    { id: 'ecosystem', label: 'Official Ecosystem', icon: Link2 },
  ];

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  const newInquiryCount = inquiries.filter((i) => i.status === 'new').length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Featured Properties" value={String(featured.filter((f) => f.is_active).length)} icon={<Star className="h-5 w-5" />} color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <MiniStat label="Active Banners" value={String(banners.filter((b) => b.is_active).length)} icon={<Image className="h-5 w-5" />} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <MiniStat label="New Inquiries" value={String(newInquiryCount)} icon={<MessageSquare className="h-5 w-5" />} color="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400" />
        <MiniStat label="Total Inquiries" value={String(inquiries.length)} icon={<Globe className="h-5 w-5" />} color="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" />
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? 'border-b-2 border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-black">{tab.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Featured Listings Tab */}
      {activeTab === 'featured' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Featured Listings Manager</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Toggle which properties appear on your public website homepage</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((prop) => {
              const featItem = featured.find((f) => f.property_id === prop.id);
              const isFeatured = !!featItem;
              const isActive = featItem?.is_active ?? false;
              return (
                <div key={prop.id} className={`rounded-xl border p-4 transition-all ${isFeatured ? 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-900/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{prop.title}</p>
                      <p className="text-xs text-slate-400">Plot: {prop.plot_number}</p>
                      <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">Rs {Number(prop.price).toLocaleString()}</p>
                      <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${prop.status === 'available' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : prop.status === 'booked' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                        {prop.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{isFeatured ? (isActive ? 'Live on website' : 'Hidden') : 'Not featured'}</span>
                    <div className="flex items-center gap-2">
                      {isFeatured && (
                        <button
                          onClick={() => toggleFeaturedActive(featItem!)}
                          className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                          title="Toggle visibility"
                        >
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      )}
                      <button
                        onClick={() => toggleFeatured(prop)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${isFeatured ? 'bg-amber-500 text-black hover:bg-amber-600' : 'border border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600 dark:border-slate-700 dark:text-slate-300'}`}
                      >
                        {isFeatured ? 'Featured' : 'Add Feature'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Homepage Banners & Sliders</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage marketing banners, promotional headings, and announcements</p>
            </div>
            <button
              onClick={() => openBannerModal()}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" /> Add Banner
            </button>
          </div>
          <div className="space-y-3">
            {banners.map((banner) => (
              <div key={banner.id} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                {/* Banner preview */}
                <div
                  className="relative flex items-center justify-between p-5"
                  style={{ backgroundColor: banner.bg_color, minHeight: '80px' }}
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-lg font-bold text-black">{banner.title}</h4>
                    {banner.subtitle && <p className="mt-1 text-sm text-black/70">{banner.subtitle}</p>}
                    {banner.button_text && (
                      <span className="mt-2 inline-block rounded-lg bg-black/20 px-3 py-1 text-xs font-semibold text-black">
                        {banner.button_text} → {banner.button_link || '#'}
                      </span>
                    )}
                  </div>
                  <span className="rounded-full bg-black/20 px-2.5 py-1 text-xs font-bold text-black">Order: {banner.display_order}</span>
                </div>
                {/* Controls */}
                <div className="flex items-center justify-between bg-white px-4 py-3 dark:bg-slate-900">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBannerActive(banner)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${banner.is_active ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${banner.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{banner.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openBannerModal(banner)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {banners.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-400">No banners yet. Click "Add Banner" to create one.</p>
            )}
          </div>
        </div>
      )}

      {/* Contact & Social Tab */}
      {activeTab === 'contact' && settingsForm && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Contact & Social Info Settings</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Edit the contact details and social media links shown on your public website</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contact info */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Contact Information</h4>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Office Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={settingsForm.office_address || ''} onChange={(e) => setSettingsForm({ ...settingsForm, office_address: e.target.value })} className={`${inputClass} pl-10`} placeholder="Office address" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={settingsForm.phone || ''} onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })} className={`${inputClass} pl-10`} placeholder="+92 300 1234567" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">WhatsApp Link</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={settingsForm.whatsapp_link || ''} onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_link: e.target.value })} className={`${inputClass} pl-10`} placeholder="https://wa.me/923001234567" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={settingsForm.email || ''} onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })} className={`${inputClass} pl-10`} placeholder="info@bintaha.com" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Google Maps Embed URL</label>
                <input value={settingsForm.map_embed_url || ''} onChange={(e) => setSettingsForm({ ...settingsForm, map_embed_url: e.target.value })} className={inputClass} placeholder="https://maps.google.com/..." />
              </div>
            </div>

            {/* Social media */}
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">Social Media Handles</h4>
              </div>
              {[
                { key: 'facebook' as const, icon: Facebook, label: 'Facebook URL' },
                { key: 'instagram' as const, icon: Instagram, label: 'Instagram URL' },
                { key: 'twitter' as const, icon: Twitter, label: 'Twitter / X URL' },
                { key: 'linkedin' as const, icon: Linkedin, label: 'LinkedIn URL' },
                { key: 'youtube' as const, icon: Youtube, label: 'YouTube URL' },
              ].map(({ key, icon: Icon, label }) => (
                <div key={key}>
                  <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input value={(settingsForm as any)[key] || ''} onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value })} className={`${inputClass} pl-10`} placeholder={`https://${key}.com/...`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      )}
      {activeTab === 'contact' && !settingsForm && (
        <p className="py-12 text-center text-sm text-slate-400">Settings could not be loaded. Try refreshing the page.</p>
      )}

      {/* Web Inquiries Tab */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Web Inquiries Feed</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">New inquiries submitted through your public website contact form</p>
          </div>
          <div className="space-y-3">
            {inquiries.map((inq) => {
              const status = inquiryStatusConfig[inq.status] || inquiryStatusConfig.new;
              return (
                <div key={inq.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                          {inq.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{inq.name}</p>
                          <p className="text-xs text-slate-400">{formatDate(inq.created_at)}</p>
                        </div>
                        <span className={`ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.classes}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {inq.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {inq.phone}</span>}
                        {inq.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {inq.email}</span>}
                      </div>
                      {inq.message && (
                        <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">{inq.message}</p>
                      )}
                    </div>
                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2">
                      {inq.status === 'new' && (
                        <button onClick={() => updateInquiryStatus(inq.id, 'contacted')} className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark Contacted
                        </button>
                      )}
                      {inq.status !== 'converted' && (
                        <button onClick={() => convertInquiryToLead(inq)} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400">
                          <ArrowRight className="h-3.5 w-3.5" /> Convert to Lead
                        </button>
                      )}
                      {inq.phone && (
                        <a href={`tel:${inq.phone}`} className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400">
                          <Phone className="h-3.5 w-3.5" /> Call
                        </a>
                      )}
                      {inq.status !== 'ignored' && inq.status !== 'converted' && (
                        <button onClick={() => updateInquiryStatus(inq.id, 'ignored')} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400">
                          Ignore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {inquiries.length === 0 && (
              <p className="py-12 text-center text-sm text-slate-400">No web inquiries yet. Inquiries from your public website contact form will appear here.</p>
            )}
          </div>
        </div>
      )}

      {/* Official Ecosystem & Links Tab */}
      {activeTab === 'ecosystem' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Official Ecosystem & Quick Links</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Quick access to all Bin Taha Associates digital properties and services</p>
          </div>

          {/* Google Apps Script webhook status */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-800/30 dark:bg-amber-900/10">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Google Apps Script Integration</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Inquiry sync webhook is active. New web inquiries and lead conversions are automatically forwarded to your Google Apps Script endpoint for form processing and CRM sync.
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
              </span>
            </div>
          </div>

          {/* Ecosystem links grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ecosystemLinks.map((link) => {
              const iconMap: Record<string, typeof Globe> = {
                globe: Globe,
                contact: Contact,
                calculator: Calculator,
                smartphone: Smartphone,
                star: Star,
              };
              const Icon = iconMap[link.icon] || Globe;
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:border-amber-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6 text-black" />
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-300 transition-colors group-hover:text-amber-500 dark:text-slate-600" />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">{link.label}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{link.description}</p>
                  <p className="mt-3 truncate text-xs text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400">{link.url}</p>
                </a>
              );
            })}
          </div>

          {/* Quick launch bar */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-black p-6 dark:border-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-amber-400">Quick Launch</p>
                <p className="text-sm text-slate-400">Jump directly to any Bin Taha digital platform</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ecosystemLinks.slice(0, 4).map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500 hover:text-black"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      <Modal
        open={bannerModalOpen}
        onClose={() => setBannerModalOpen(false)}
        title={editingBanner ? 'Edit Banner' : 'Add New Banner'}
        footer={
          <>
            <button onClick={() => setBannerModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button onClick={saveBanner} disabled={saving} className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Banner Title / Heading</label>
            <input value={bannerForm.title} onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })} className={inputClass} placeholder="Premium Plots in Green Valley" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Subtitle / Description</label>
            <textarea value={bannerForm.subtitle} onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })} className={`${inputClass} min-h-[70px] resize-y`} placeholder="Invest in your future with luxury residential plots..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Button Text</label>
              <input value={bannerForm.button_text} onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })} className={inputClass} placeholder="View Plots" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Button Link</label>
              <input value={bannerForm.button_link} onChange={(e) => setBannerForm({ ...bannerForm, button_link: e.target.value })} className={inputClass} placeholder="#properties" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Background Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={bannerForm.bg_color} onChange={(e) => setBannerForm({ ...bannerForm, bg_color: e.target.value })} className="h-10 w-16 rounded-lg border border-slate-200 dark:border-slate-700" />
                <input value={bannerForm.bg_color} onChange={(e) => setBannerForm({ ...bannerForm, bg_color: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Display Order</label>
              <input type="number" value={bannerForm.display_order} onChange={(e) => setBannerForm({ ...bannerForm, display_order: Number(e.target.value) })} className={inputClass} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBannerForm({ ...bannerForm, is_active: !bannerForm.is_active })}
              className={`relative h-6 w-11 rounded-full transition-colors ${bannerForm.is_active ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${bannerForm.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-400">Active (visible on website)</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

function MiniStat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}
