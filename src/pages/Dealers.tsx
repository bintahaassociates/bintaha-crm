import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Phone, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSyncTrigger } from '@/lib/sync';
import type { Dealer } from '@/lib/types';
import { mockDealers } from '@/lib/mockData';
import Modal from '@/components/Modal';

const ITEMS_PER_PAGE = 20;

const emptyForm = {
  client_name: '',
  mobile_number: '',
  category: 'general',
  status: 'active',
};

export default function Dealers() {
  const [dealers, setDealers] = useState<Dealer[]>(mockDealers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editDealer, setEditDealer] = useState<Dealer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('dealers').select('*').order('created_at', { ascending: false }).limit(20);
      if (data && data.length > 0) setDealers(data);
    } catch (err) {
      console.error('Failed to load dealers data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  function reloadData() { loadData(); }
  useSyncTrigger(loadData);

  function openAdd() {
    setEditDealer(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(d: Dealer) {
    setEditDealer(d);
    setForm({ client_name: d.client_name, mobile_number: d.mobile_number, category: d.category, status: d.status });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        client_name: form.client_name,
        mobile_number: form.mobile_number,
        category: form.category,
        status: form.status,
      };
      if (editDealer) {
        await supabase.from('dealers').update(payload).eq('id', editDealer.id);
      } else {
        await supabase.from('dealers').insert(payload);
      }
    } catch (err) {
      console.error('Failed to save dealer:', err);
    } finally {
      setSaving(false);
      setModalOpen(false);
      reloadData();
    }
  }

  async function handleDelete(id: string) {
    try {
      await supabase.from('dealers').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete dealer:', err);
    }
    reloadData();
  }

  const filtered = dealers.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch = d.client_name.toLowerCase().includes(q) || d.mobile_number.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters & Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Dealer
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
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
              {paginated.map((d, idx) => {
                const rowNum = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                return (
                  <tr key={d.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{rowNum}</td>
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
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">{d.category}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        d.status === 'active'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(d.id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-slate-400">No dealers match your filters</p>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-400">
              Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">{safePage} / {totalPages}</span>
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
        title={editDealer ? 'Edit Dealer' : 'Add New Dealer'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50">
              {saving ? 'Saving...' : editDealer ? 'Update' : 'Add Dealer'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Client Name">
            <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} className={inputClass} placeholder="Imran Qureshi" />
          </FormField>
          <FormField label="Mobile Number">
            <input value={form.mobile_number} onChange={(e) => setForm({ ...form, mobile_number: e.target.value })} className={inputClass} placeholder="+92 321 4444444" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                <option value="general">General</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Plots">Plots</option>
              </select>
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}
