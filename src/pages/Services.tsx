import { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Phone, Mail, Calendar, Wrench, Clock, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ServiceItem {
  id: number | string;
  srv_id: string;
  date: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  details: string;
  status: string;
}

export default function Services() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    details: '',
    status: 'Pending',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Services')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Error fetching services:', error);
      } else if (data) {
        const mapped: ServiceItem[] = data.map((item: any) => ({
          id: item.id,
          srv_id: item.ID || `SRV-${item.id}`,
          date: item.Date || item.created_at?.slice(0, 10) || '-',
          name: item.Name || 'Unknown Client',
          phone: item.Phone || '-',
          email: item.Email || '-',
          subject: item.Subject || 'General Service',
          details: item.Details || '',
          status: item.Status || 'Pending',
        }));
        setServices(mapped);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const generatedId = `SRV-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error } = await supabase.from('Services').insert([
        {
          ID: generatedId,
          Date: today,
          Name: form.name,
          Phone: form.phone,
          Email: form.email || 'N/A',
          Subject: form.subject,
          Details: form.details,
          Status: form.status,
        },
      ]);

      if (error) throw error;

      setForm({ name: '', phone: '', email: '', subject: '', details: '', status: 'Pending' });
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Failed to add service record:', err);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: number | string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('Services')
        .update({ Status: newStatus })
        .eq('id', id);

      if (!error) {
        setServices((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
        );
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  }

  const filtered = services.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) ||
      s.srv_id.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.phone.toLowerCase().includes(q) ||
      s.details.toLowerCase().includes(q);

    const matchStatus = statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name, SRV ID, service subject, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> نئی سروس اینٹری
        </button>
      </div>

      {/* Services Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">SRV ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client Details</th>
                <th className="px-4 py-3">Subject / Service</th>
                <th className="px-4 py-3">Project / Location Details</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
                    <p className="mt-2 text-xs text-slate-400">سروسز ڈیٹا لوڈ ہو رہا ہے...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    کوئی سروس ریکارڈ موجود نہیں۔
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isPending = s.status.toLowerCase() === 'pending';
                  const isCompleted = s.status.toLowerCase() === 'completed';

                  return (
                    <tr key={s.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                          {s.srv_id}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 font-mono text-xs text-slate-500">
                          <Calendar className="h-3 w-3" /> {s.date}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</p>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {s.phone}
                            </span>
                            {s.email && s.email !== 'N/A' && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {s.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          <Wrench className="h-3.5 w-3.5" /> {s.subject}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 max-w-[260px]">
                        <p className="line-clamp-2">{s.details || '-'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={s.status}
                          onChange={(e) => updateStatus(s.id, e.target.value)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold outline-none border transition ${
                            isCompleted
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : isPending
                              ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border border-amber-500/30 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-amber-500/10 px-6 py-4 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-amber-400">نئی سروس کی درخواست درج کریں</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddService} className="p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">کلائنٹ کا نام</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ahmad Ali"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">فون نمبر</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="03211234567"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">ای میل (اختیاری)</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="client@mail.com"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">سروس کا عنوان (Subject)</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Gray Structure Construction / Map Approval"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">پراجیکٹ کی لوکیشن اور تفصیلات (Details)</label>
                <textarea
                  rows={3}
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder="e.g. 1 Kanal Plot 120, Block C, LDA Avenue 1"
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
