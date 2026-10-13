import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Phone, Globe, Plus, X, MessageSquare, Tag, Calendar, User, ExternalLink } from 'lucide-react';
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
  const [clients, setClients] = useState<WebClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    clientName: '',
    inquiryTitle: '',
    contact: '',
    source: 'Main Web Portal',
    details: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
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
        setClients(mapped);
      }
    } catch (err) {
      console.error('Failed to load web clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddClient(e: React.FormEvent) {
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
      loadData();
    } catch (err) {
      console.error('Failed to add web client:', err);
    } finally {
      setSaving(false);
    }
  }

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.clientName.toLowerCase().includes(q) ||
      c.clientId.toLowerCase().includes(q) ||
      c.inquiryTitle.toLowerCase().includes(q) ||
      c.contact.toLowerCase().includes(q) ||
      c.details.toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Live Portal Banner */}
      <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-amber-500">Main Web Portal Inquiries</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bin Taha Associates کی ویب سائٹ سے براہ راست موصول ہونے والی لیڈز اور پیغامات
          </p>
        </div>
        <a
          href="https://bintahaassociates.github.io/bintaha-main/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-amber-400 shadow transition hover:bg-slate-900 border border-amber-500/30"
        >
          <Globe className="h-4 w-4" /> وزٹ ویب پورٹل <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name, inquiry title, phone, source..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>

          <button
            onClick={loadData}
            title="ریفریش کریں"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> نئی ویب انکوائری شامل کریں
        </button>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Client ID</th>
                <th className="px-4 py-3">تاریخ</th>
                <th className="px-4 py-3">کلائنٹ کا نام</th>
                <th className="px-4 py-3">رابطہ / WhatsApp</th>
                <th className="px-4 py-3">انکوائری عنوان</th>
                <th className="px-4 py-3">ذریعہ (Source)</th>
                <th className="px-4 py-3">تفصیلات و ضروریات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
                    <p className="mt-2 text-xs text-slate-400">ویب انکوائریز لوڈ ہو رہی ہیں...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-slate-400">
                    کوئی ویب انکوائری موجود نہیں ہے۔ (اوپر بٹن سے نئی انکوائری شامل کر سکتے ہیں)
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                      {c.clientId}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" /> {c.created_at}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" /> {c.clientName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                          {c.contact}
                        </span>
                        {c.contact && c.contact !== '-' && (
                          <a
                            href={`https://wa.me/${c.contact.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-600"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        <Tag className="h-3 w-3" /> {c.inquiryTitle}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                        <Globe className="h-3 w-3 text-slate-400" /> {c.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-[240px] truncate" title={c.details}>
                      {c.details || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Inquiry Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-amber-500/30 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-amber-500/10 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-amber-400">نئی ویب انکوائری شامل کریں</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">کلائنٹ کا نام</label>
                <input
                  required
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  placeholder="e.g. Usman Ali"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">فون / WhatsApp</label>
                  <input
                    required
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="03001234567"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">ذریعہ (Source)</label>
                  <input
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="Main Web Portal"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">انکوائری عنوان (Inquiry Title)</label>
                <input
                  required
                  value={form.inquiryTitle}
                  onChange={(e) => setForm({ ...form, inquiryTitle: e.target.value })}
                  placeholder="e.g. 1 Kanal Plot in LDA Avenue 1"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">تفصیلات و ضروریات</label>
                <textarea
                  rows={3}
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder="کلائنٹ کا بجٹ اور خاص مطالبات..."
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
