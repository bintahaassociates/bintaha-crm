import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  UserCircle, 
  RefreshCw,
  Users,
  UserCheck,
  Briefcase,
  UserX,
  Layers,
  ExternalLink
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'dealers' | 'inactive'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDealer, setEditDealer] = useState<DealerItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
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

  // Stat Counts
  const totalCount = dealers.length;
  const activeCount = dealers.filter((d) => d.status.toLowerCase() === 'active').length;
  const dealerCatCount = dealers.filter((d) => d.category.toLowerCase().includes('dealer')).length;
  const inactiveCount = dealers.filter((d) => d.status.toLowerCase() !== 'active').length;

  const filtered = dealers.filter((d) => {
    const q = search.toLowerCase();
    const name = (d.client_name || '').toLowerCase();
    const mobile = (d.mobile_number || '').toLowerCase();
    const category = (d.category || '').toLowerCase();
    const matchesSearch = name.includes(q) || mobile.includes(q) || category.includes(q);

    let matchesTab = true;
    if (activeTab === 'active') {
      matchesTab = d.status.toLowerCase() === 'active';
    } else if (activeTab === 'dealers') {
      matchesTab = d.category.toLowerCase().includes('dealer');
    } else if (activeTab === 'inactive') {
      matchesTab = d.status.toLowerCase() !== 'active';
    }

    return matchesSearch && matchesTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Network */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Registered Network</p>
            <p className="mt-2 text-2xl font-bold text-slate-800 dark:text-slate-100">{totalCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Active Dealers */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Partners</p>
            <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        {/* Primary Dealers */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Market Dealers</p>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{dealerCatCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        {/* Inactive Records */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Inactive Records</p>
            <p className="mt-2 text-2xl font-bold text-slate-500 dark:text-slate-400">{inactiveCount}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
            <UserX className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        <button
          onClick={() => {
            setActiveTab('all');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'all'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="h-4 w-4" /> All Directory
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('active');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'active'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <UserCheck className="h-4 w-4" /> Active Partners
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('dealers');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'dealers'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Briefcase className="h-4 w-4" /> Market Dealers
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {dealerCatCount}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('inactive');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'inactive'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <UserX className="h-4 w-4" /> Inactive
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {inactiveCount}
          </span>
        </button>

        <a
          href="https://bintahaassociates.github.io/bintaha-dc/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline dark:text-amber-400"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Network Hub
        </a>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client name, mobile or category..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>

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
                <th className="px-4 py-3">Client / Dealer Name</th>
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
                    <p className="mt-2 text-xs text-slate-400">ڈیلرز ڈیٹا لوڈ ہو رہا ہے...</p>
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
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 font-mono text-xs text-slate-600 dark:text-slate-300">
                            <Phone className="h-3 w-3 text-slate-400" /> {d.mobile_number}
                          </span>
                          {d.mobile_number && d.mobile_number !== '-' && (
                            <a
                              href={`https://wa.me/${d.mobile_number.replace(/[^0-9]/g, '')}`}
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
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Client / Dealer Name</label>
            <input
              value={form.client_name}
              onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              placeholder="مثال: Ahmad Real Estate"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Mobile Number</label>
            <input
              value={form.mobile_number}
              onChange={(e) => setForm({ ...form, mobile_number: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              placeholder="03211234567"
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
