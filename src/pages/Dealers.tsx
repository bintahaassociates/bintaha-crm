import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Phone, UserCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';

interface DealerItem {
  id: string | number;
  sr_no: string;
  client_name: string;
  mobile_number: string;
  category: string;
  status: string;
}

const ITEMS_PER_PAGE = 25;

const emptyForm = {
  client_name: '',
  mobile_number: '',
  category: 'Dealer',
  status: 'Active',
};

export default function Dealers() {
  const [dealers, setDealers] = useState<DealerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDealer, setEditDealer] = useState<DealerItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // سپابیس میں ٹیبل کا اصل نام "Dealers" ہے
      const { data, error } = await supabase
        .from('Dealers')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Supabase load error:', error);
      } else if (data) {
        const mapped: DealerItem[] = data.map((d: any, index: number) => ({
          id: d.id,
          sr_no: d['Sr No'] || String(index + 1),
          client_name: d['Client Name'] || d.client_name || 'N/A',
          mobile_number: d['Mobile Number'] || d.mobile_number || '-',
          category: d['Category'] || d.category || 'Dealer',
          status: d['Status'] || d.status || 'Active',
        }));
        setDealers(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch dealers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openAdd() {
    setEditDealer(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(d: DealerItem) {
    setEditDealer(d);
    setForm({
      client_name: d.client_name,
      mobile_number: d.mobile_number,
      category: d.category,
      status: d.status,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload: any = {
        'Client Name': form.client_name,
        'Mobile Number': form.mobile_number,
        'Category': form.category,
        'Status': form.status,
      };

      if (editDealer?.id) {
        await supabase.from('Dealers').update(payload).eq('id', editDealer.id);
      } else {
        await supabase.from('Dealers').insert([payload]);
      }
    } catch (err) {
      console.error('Failed to save dealer:', err);
    } finally {
      setSaving(false);
      setModalOpen(false);
      loadData();
    }
  }

  async function handleDelete(id: string | number) {
    if (!confirm('کیا آپ اس ڈیلر کو حذف کرنا چاہتے ہیں؟')) return;
    try {
      await supabase.from('Dealers').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete dealer:', err);
    }
    loadData();
  }

  const filtered = dealers.filter((d) => {
    const q = search.toLowerCase();
    const name = (d.client_name || '').toLowerCase();
    const mobile = (d.mobile_number || '').toLowerCase();
    const matchesSearch = name.includes(q) || mobile.includes(q);
    const matchesStatus = filterStatus === 'all' || d.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Filters & Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name or mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">تمام اسٹیٹس</option>
            <option value="Active">ایکٹو (Active)</option>
            <option value="Inactive">نان ایکٹو (Inactive)</option>
          </select>
          <button
            onClick={loadData}
            title="Reload Data"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> نیا ڈیلر شامل کریں
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Sr No</th>
                <th className="px-4 py-3">Client Name</th>
                <th className="px-4 py-3">Mobile Number</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
                    <p className="mt-2 text-xs text-slate-400">سپابیس ڈیٹا لوڈ ہو رہا ہے...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    کوئی ریکارڈ نہیں ملا۔
                  </td>
                </tr>
              ) : (
                paginated.map((d, idx) => {
                  const rowNum = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                  return (
                    <tr key={d.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-xs font-mono text-slate-400">{d.sr_no || rowNum}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                            <UserCircle className="h-5 w-5 text-slate-400" />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{d.client_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                          <Phone className="h-3 w-3 text-slate-400" /> {d.mobile_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          {d.category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            d.status.toLowerCase() === 'active'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(d)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-400">
              کل {filtered.length} ڈیلرز | دکھائے جا رہے ہیں {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editDealer ? 'ڈیلر میں ترمیم کریں' : 'نیا ڈیلر شامل کریں'}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              کینسل
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50"
            >
              {saving ? 'محفوظ ہو رہا ہے...' : editDealer ? 'اپ ڈیٹ کریں' : 'شامل کریں'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Client Name</label>
            <input
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              placeholder="مثال: 1036 D Oner"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Mobile Number</label>
            <input
              value={form.mobile_number}
              onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              placeholder="03218261789"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Category</label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
