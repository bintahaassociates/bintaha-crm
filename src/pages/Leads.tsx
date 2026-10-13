import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Phone, MapPin, DollarSign, FileText, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSyncTrigger } from '@/lib/sync';
import type { Lead, Project } from '@/lib/types';
import { mockLeads, mockProjects } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

const ITEMS_PER_PAGE = 20;

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  budget: '',
  interested_project_id: '',
  status: 'new' as Lead['status'],
  notes: '',
  cnic: '',
  address: '',
  service: '',
};

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [lds, projs] = await Promise.all([
        supabase.from('leads').select('*, project(*)').order('created_at', { ascending: false }).limit(20),
        supabase.from('projects').select('*').limit(20),
      ]);
      if (lds.data && lds.data.length > 0) setLeads(lds.data);
      if (projs.data && projs.data.length > 0) setProjects(projs.data);
    } catch (err) {
      console.error('Failed to load leads data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  function reloadData() { loadData(); }
  useSyncTrigger(loadData);

  function openAdd() {
    setEditLead(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(l: Lead) {
    setEditLead(l);
    setForm({
      name: l.name,
      phone: l.phone,
      email: l.email || '',
      budget: String(l.budget),
      interested_project_id: l.interested_project_id || '',
      status: l.status,
      notes: l.notes || '',
      cnic: l.cnic || '',
      address: l.address || '',
      service: l.service || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        budget: Number(form.budget) || 0,
        interested_project_id: form.interested_project_id || null,
        status: form.status,
        notes: form.notes || null,
        cnic: form.cnic || null,
        address: form.address || null,
        service: form.service || null,
      };
      if (editLead) {
        await supabase.from('leads').update(payload).eq('id', editLead.id);
      } else {
        await supabase.from('leads').insert(payload);
      }
    } catch (err) {
      console.error('Failed to save lead:', err);
    } finally {
      setSaving(false);
      setModalOpen(false);
      reloadData();
    }
  }

  async function handleDelete(id: string) {
    try {
      await supabase.from('leads').delete().eq('id', id);
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
    reloadData();
  }

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch = l.name.toLowerCase().includes(q) || l.phone.toLowerCase().includes(q) || (l.cnic || '').toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || l.status === filterStatus;
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
              placeholder="Search by name, phone, or CNIC..."
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
            <option value="new">New</option>
            <option value="follow_up">Follow-up</option>
            <option value="meeting">Meeting</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Lead
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">CNIC</th>
                <th className="px-4 py-3">Address</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.map((l) => (
                <tr key={l.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-xs font-bold text-white">
                        {l.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{l.name}</p>
                        <StatusBadge status={l.status} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <Phone className="h-3 w-3 text-slate-400" /> {l.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-600 dark:text-slate-300">{l.cnic || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{l.address || '-'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {l.service ? (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">{l.service}</span>
                    ) : <span className="text-xs text-slate-300">-</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(Number(l.budget))}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[160px]">{l.notes || l.project?.name || '-'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(l)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(l.id)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-slate-400">No leads match your filters</p>
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
        title={editLead ? 'Edit Lead' : 'Add New Lead'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50">
              {saving ? 'Saving...' : editLead ? 'Update' : 'Add Lead'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Name">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="John Doe" />
            </FormField>
            <FormField label="Phone">
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+92 300 1234567" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="CNIC">
              <input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} className={inputClass} placeholder="42101-1234567-1" />
            </FormField>
            <FormField label="Email">
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="john@email.com" />
            </FormField>
          </div>
          <FormField label="Address">
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} placeholder="Block A, Gulshan, Karachi" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Service">
              <input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className={inputClass} placeholder="Residential Plot" />
            </FormField>
            <FormField label="Budget (PKR)">
              <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} className={inputClass} placeholder="5000000" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Interested Project">
              <select value={form.interested_project_id} onChange={(e) => setForm({ ...form, interested_project_id: e.target.value })} className={inputClass}>
                <option value="">None</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FormField>
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Lead['status'] })} className={inputClass}>
                <option value="new">New</option>
                <option value="follow_up">Follow-up</option>
                <option value="meeting">Meeting</option>
                <option value="closed">Closed Deal</option>
              </select>
            </FormField>
          </div>
          <FormField label="Details / Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={`${inputClass} min-h-[80px] resize-y`} placeholder="Additional notes..." />
          </FormField>
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
