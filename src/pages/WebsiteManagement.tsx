import { useState, useEffect, useCallback } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Plus, 
  Star, 
  Image as ImageIcon, 
  MessageSquare, 
  Phone, 
  Search, 
  RefreshCw, 
  Calendar, 
  User, 
  Tag, 
  X,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface WebClient {
  id: number | string;
  clientId: string;
  created_at: string;
  inquiryTitle: string;
  clientName: string;
  contact: string;
  source: string;
  details: string;
}

export default function WebsiteManagement() {
  const [activeTab, setActiveTab] = useState<'featured' | 'banners' | 'social' | 'inquiries'>('featured');
  const [inquiries, setInquiries] = useState<WebClient[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Inquiry Form
  const [form, setForm] = useState({
    clientName: '',
    inquiryTitle: '',
    contact: '',
    source: 'Main Web Portal',
    details: '',
  });

  // Featured Properties Mock State
  const [featuredProps] = useState([
    { id: '1', title: 'Residential Plot 24-A', plot: 'GV-24A', price: 'Rs 2,500,000', status: 'available' },
    { id: '2', title: 'Residential Plot 25-B', plot: 'GV-25B', price: 'Rs 2,800,000', status: 'booked' },
    { id: '3', title: 'Commercial Shop 12', plot: 'CH-12', price: 'Rs 5,000,000', status: 'sold' },
  ]);

  // Load Web_Clients from Supabase
  const loadInquiries = useCallback(async () => {
    setLoadingInquiries(true);
    try {
      const { data, error } = await supabase
        .from('Web_Clients')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error loading Web_Clients:', error);
      } else if (data) {
        const mapped: WebClient[] = data.map((d: any) => ({
          id: d.id,
          clientId: d['Client ID'] || d.client_id || `WC-${d.id}`,
          created_at: d.created_at ? d.created_at.slice(0, 10) : '-',
          inquiryTitle: d['Inquiry Title'] || d['Inquiry Tit'] || d.inquiry_title || 'General Inquiry',
          clientName: d['Client Name'] || d['Client Nam'] || d.client_name || 'Website Visitor',
          contact: d['Contact / WhatsApp Number'] || d.contact || d.phone || '-',
          source: d.Source || d.source || 'Website',
          details: d['Requirements & Details'] || d.details || '',
        }));
        setInquiries(mapped);
      }
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoadingInquiries(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  async function handleAddInquiry(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const newClientId = `WC-${Math.floor(1000 + Math.random() * 9000)}`;
      const payload: any = {
        'Client ID': newClientId,
        'Inquiry Title': form.inquiryTitle,
        'Client Name': form.clientName,
        'Contact / WhatsApp Number': form.contact,
        Source: form.source,
        'Requirements & Details': form.details,
      };

      const { error } = await supabase.from('Web_Clients').insert([payload]);
      if (error) throw error;

      setForm({ clientName: '', inquiryTitle: '', contact: '', source: 'Main Web Portal', details: '' });
      setModalOpen(false);
      loadInquiries();
    } catch (err) {
      console.error('Failed to add inquiry:', err);
    } finally {
      setSaving(false);
    }
  }

  const filteredInquiries = inquiries.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.clientName.toLowerCase().includes(q) ||
      c.clientId.toLowerCase().includes(q) ||
      c.inquiryTitle.toLowerCase().includes(q) ||
      c.contact.toLowerCase().includes(q) ||
      c.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards (Original Layout) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Featured Properties</p>
            <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{featuredProps.length}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Star className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Banners</p>
            <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">1</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <ImageIcon className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">New Inquiries</p>
            <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{inquiries.length}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Inquiries</p>
            <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{inquiries.length}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
            <Globe className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Original Layout) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('featured')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'featured'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Star className="h-4 w-4" /> Featured Listings <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">{featuredProps.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'banners'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ImageIcon className="h-4 w-4" /> Banners & Sliders <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800">1</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'social'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Phone className="h-4 w-4" /> Contact & Social
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'inquiries'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Web Inquiries <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600">{inquiries.length}</span>
        </button>

        {/* Official Ecosystem Link Button */}
        <a
          href="https://bintahaassociates.github.io/bintaha-main/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Official Ecosystem
        </a>
      </div>

      {/* TAB 1: Featured Listings (Original View) */}
      {activeTab === 'featured' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Featured Listings Manager</h3>
            <p className="text-xs text-slate-400">Toggle which properties appear on your public website homepage</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProps.map((p) => (
              <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100">{p.title}</h4>
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-600 capitalize dark:bg-amber-500/10 dark:text-amber-400">
                    {p.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Plot: {p.plot}</p>
                <p className="mt-3 font-bold text-amber-600 dark:text-amber-400">{p.price}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Banners & Sliders (Original View) */}
      {activeTab === 'banners' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Hero Banners & Promotional Sliders</h3>
          <p className="text-xs text-slate-400 mt-1">Manage header promotional banners on the main website</p>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Main Banner - Bin Taha Prime Projects</p>
              <p className="text-xs text-slate-400">Dimensions: 1920x600 | Status: Active</p>
            </div>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">Active</span>
          </div>
        </div>
      )}

      {/* TAB 3: Contact & Social */}
      {activeTab === 'social' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Public Contact & Social Channels</h3>
          <p className="text-xs text-slate-400 mt-1">Official contact channels shown on the website footer</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="text-xs text-slate-400">Official Phone</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">+92 321 9404812</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="text-xs text-slate-400">Office Location</p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Main Gate, LDA Avenue 1, Lahore</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Web Inquiries (Connected with Supabase Web_Clients) */}
      {activeTab === 'inquiries' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search web inquiries by name, phone, title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadInquiries}
                title="Refresh"
                className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              >
                <RefreshCw className={`h-4 w-4 ${loadingInquiries ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20"
              >
                <Plus className="h-4 w-4" /> نئی انکوائری شامل کریں
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
                  <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-3">Client ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Client Name</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Inquiry Title</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loadingInquiries ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-amber-500" />
                        <p className="mt-2 text-xs">Loading Inquiries...</p>
                      </td>
                    </tr>
                  ) : filteredInquiries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                        کوئی انکوائری موجود نہیں ہے۔
                      </td>
                    </tr>
                  ) : (
                    filteredInquiries.map((c) => (
                      <tr key={c.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{c.clientId}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.created_at}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{c.clientName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                          {c.contact}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            {c.inquiryTitle}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{c.source}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={c.details}>
                          {c.details || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Inquiry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-amber-500/30 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-amber-500/10 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-amber-400">نئی ویب انکوائری شامل کریں</h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddInquiry} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">کلائنٹ کا نام</label>
                <input
                  required
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">رابطہ / WhatsApp</label>
                  <input
                    required
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">ذریعہ (Source)</label>
                  <input
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">انکوائری عنوان</label>
                <input
                  required
                  value={form.inquiryTitle}
                  onChange={(e) => setForm({ ...form, inquiryTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">تفصیلات و ضروریات</label>
                <textarea
                  rows={3}
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                >
                  کینسل
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-lg disabled:opacity-50"
                >
                  {saving ? 'محفوظ ہو رہا ہے...' : 'شامل کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
