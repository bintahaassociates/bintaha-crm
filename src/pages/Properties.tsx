import { useState, useCallback } from 'react';
import { Plus, Pencil, Search, ChevronLeft, ChevronRight, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSyncTrigger } from '@/lib/sync';
import type { Property, Project } from '@/lib/types';
import { mockProperties, mockProjects } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

const ITEMS_PER_PAGE = 20;

const emptyForm = {
  title: '',
  plot_number: '',
  status: 'available' as Property['status'],
  price: '',
  size_sqft: '',
  type: 'plot' as Property['type'],
  project_id: '',
  image_url: '',
  phone: '',
  original_dealer_name: '',
  original_dealer_phone: '',
};

export default function Properties() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<Property | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [props, projs] = await Promise.all([
        supabase.from('properties').select('*, project(*)').order('created_at', { ascending: false }).limit(20),
        supabase.from('projects').select('*').limit(20),
      ]);
      if (props.data && props.data.length > 0) setProperties(props.data);
      if (projs.data && projs.data.length > 0) setProjects(projs.data);
    } catch (err) {
      console.error('Failed to load properties data, using fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  function reloadData() { loadData(); }
  useSyncTrigger(loadData);

  function openAdd() {
    setEditProperty(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(p: Property) {
    setEditProperty(p);
    setForm({
      title: p.title,
      plot_number: p.plot_number,
      status: p.status,
      price: String(p.price),
      size_sqft: String(p.size_sqft),
      type: p.type,
      project_id: p.project_id || '',
      image_url: p.image_url || '',
      phone: p.phone || '',
      original_dealer_name: p.original_dealer_name || '',
      original_dealer_phone: p.original_dealer_phone || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        plot_number: form.plot_number,
        status: form.status,
        price: Number(form.price) || 0,
        size_sqft: Number(form.size_sqft) || 0,
        type: form.type,
        project_id: form.project_id || null,
        image_url: form.image_url || null,
        phone: form.phone || null,
        original_dealer_name: form.original_dealer_name || null,
        original_dealer_phone: form.original_dealer_phone || null,
      };
      if (editProperty) {
        await supabase.from('properties').update(payload).eq('id', editProperty.id);
      } else {
        await supabase.from('properties').insert(payload);
      }
    } catch (err) {
      console.error('Failed to save property:', err);
    } finally {
      setSaving(false);
      setModalOpen(false);
      reloadData();
    }
  }

  const filtered = properties.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.plot_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
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
      {/* Filters & Add button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title or plot number..."
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
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="sold">Sold</option>
          </select>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Property
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Society</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Original Dealer Name</th>
                <th className="px-4 py-3">Dealer Phone</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.map((p, idx) => {
                const rowNum = (safePage - 1) * ITEMS_PER_PAGE + idx + 1;
                return (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{rowNum}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={p.status} />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{p.title}</span>
                      </div>
                      <span className="text-xs text-slate-400">{p.plot_number}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {p.project?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">{p.type}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(Number(p.price))}</td>
                    <td className="px-4 py-3">
                      {p.phone ? (
                        <span className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                          <Phone className="h-3 w-3 text-slate-400" /> {p.phone}
                        </span>
                      ) : <span className="text-xs text-slate-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.original_dealer_name || '-'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">{p.original_dealer_phone || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-amber-600 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {paginated.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-slate-400">No properties match your filters</p>
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
        title={editProperty ? 'Edit Property' : 'Add New Property'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl disabled:opacity-50">
              {saving ? 'Saving...' : editProperty ? 'Update' : 'Add Property'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormRow label="Title">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="e.g. Plot A-12" />
          </FormRow>
          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Plot Number">
              <input value={form.plot_number} onChange={(e) => setForm({ ...form, plot_number: e.target.value })} className={inputClass} placeholder="A-12" />
            </FormRow>
            <FormRow label="Society / Project">
              <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className={inputClass}>
                <option value="">Unassigned</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Price (PKR)">
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} placeholder="4500000" />
            </FormRow>
            <FormRow label="Size (sqft)">
              <input type="number" value={form.size_sqft} onChange={(e) => setForm({ ...form, size_sqft: e.target.value })} className={inputClass} placeholder="1200" />
            </FormRow>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Property['status'] })} className={inputClass}>
                <option value="available">Available</option>
                <option value="booked">Booked</option>
                <option value="sold">Sold</option>
              </select>
            </FormRow>
            <FormRow label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Property['type'] })} className={inputClass}>
                <option value="plot">Plot</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
              </select>
            </FormRow>
          </div>
          <FormRow label="Contact Phone">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="+92 300 1234567" />
          </FormRow>
          <div className="grid grid-cols-2 gap-4">
            <FormRow label="Original Dealer Name">
              <input value={form.original_dealer_name} onChange={(e) => setForm({ ...form, original_dealer_name: e.target.value })} className={inputClass} placeholder="Dealer name" />
            </FormRow>
            <FormRow label="Dealer Phone">
              <input value={form.original_dealer_phone} onChange={(e) => setForm({ ...form, original_dealer_phone: e.target.value })} className={inputClass} placeholder="+92 321 4444444" />
            </FormRow>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">{label}</label>
      {children}
    </div>
  );
}
