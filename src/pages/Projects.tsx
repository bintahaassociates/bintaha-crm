import { useState, useCallback } from 'react';
import { Plus, Building2, MapPin, Home, TrendingUp, Pencil, HardHat } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSyncTrigger } from '@/lib/sync';
import type { Project, Property } from '@/lib/types';
import { mockProjects, mockProperties } from '@/lib/mockData';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

const emptyForm = {
  name: '',
  location: '',
  description: '',
  total_units: '',
  sold_units: '',
  construction_status: 'planning' as Project['construction_status'],
  image_url: '',
};

export default function Projects() {
  const [projects, setProjects] = useState<(Project & { propertyCount?: number })[]>(mockProjects.map((p) => ({ ...p, propertyCount: mockProperties.filter((prop) => prop.project_id === p.id).length })));
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: projs } = await supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(20);
      const { data: props } = await supabase.from('properties').select('*').limit(20);

      if (projs && projs.length > 0) {
        const projectsWithCounts = projs.map((p) => ({
          ...p,
          propertyCount: (props || []).filter((prop: Property) => prop.project_id === p.id).length,
        }));
        setProjects(projectsWithCounts);
      }
    } catch (err) {
      console.error('Failed to load projects data, using fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  function reloadData() { loadData(); }

  useSyncTrigger(loadData);

  function openAdd() {
    setEditProject(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(p: Project) {
    setEditProject(p);
    setForm({
      name: p.name,
      location: p.location,
      description: p.description || '',
      total_units: String(p.total_units),
      sold_units: String(p.sold_units),
      construction_status: p.construction_status,
      image_url: p.image_url || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        location: form.location,
        description: form.description || null,
        total_units: Number(form.total_units) || 0,
        sold_units: Number(form.sold_units) || 0,
        construction_status: form.construction_status,
        image_url: form.image_url || null,
      };
      if (editProject) {
        await supabase.from('projects').update(payload).eq('id', editProject.id);
      } else {
        await supabase.from('projects').insert(payload);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setSaving(false);
      setModalOpen(false);
      reloadData();
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <HeaderStat label="Total Projects" value={String(projects.length)} icon={<Building2 className="h-5 w-5" />} color="from-blue-500 to-indigo-600" />
        <HeaderStat label="Total Units" value={String(projects.reduce((s, p) => s + p.total_units, 0))} icon={<Home className="h-5 w-5" />} color="from-amber-500 to-amber-600" />
        <HeaderStat label="Units Sold" value={String(projects.reduce((s, p) => s + p.sold_units, 0))} icon={<TrendingUp className="h-5 w-5" />} color="from-amber-500 to-orange-600" />
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {projects.map((p) => {
          const soldPercent = p.total_units > 0 ? (p.sold_units / p.total_units) * 100 : 0;
          return (
            <div
              key={p.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Image Header */}
              <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Building2 className="h-16 w-16 text-slate-300 dark:text-slate-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{p.name}</h3>
                      <p className="flex items-center gap-1 text-sm text-white/80">
                        <MapPin className="h-3 w-3" /> {p.location}
                      </p>
                    </div>
                    <StatusBadge status={p.construction_status} />
                  </div>
                </div>
                <button
                  onClick={() => openEdit(p)}
                  className="absolute top-3 right-3 rounded-lg bg-white/20 p-2 text-white backdrop-blur-sm transition-all hover:bg-white/30"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {p.description && <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{p.description}</p>}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/50">
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{p.total_units}</p>
                    <p className="text-xs text-slate-400">Total Units</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-500/10">
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{p.sold_units}</p>
                    <p className="text-xs text-slate-400">Sold</p>
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-500/10">
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{p.propertyCount || 0}</p>
                    <p className="text-xs text-slate-400">Listed</p>
                  </div>
                </div>

                {/* Construction Progress */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardHat className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Sales Progress</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{soldPercent.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-1000"
                      style={{ width: `${soldPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          </div>
          <p className="mt-4 text-sm text-slate-400">No projects yet</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProject ? 'Edit Project' : 'Add New Project'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50">
              {saving ? 'Saving...' : editProject ? 'Update' : 'Add Project'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Project Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="Green Valley Residences" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputClass} placeholder="Sector 45, Gurgaon" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${inputClass} min-h-[70px] resize-y`} placeholder="Project description..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Total Units</label>
              <input type="number" value={form.total_units} onChange={(e) => setForm({ ...form, total_units: e.target.value })} className={inputClass} placeholder="120" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Sold Units</label>
              <input type="number" value={form.sold_units} onChange={(e) => setForm({ ...form, sold_units: e.target.value })} className={inputClass} placeholder="78" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Construction Status</label>
            <select value={form.construction_status} onChange={(e) => setForm({ ...form, construction_status: e.target.value as Project['construction_status'] })} className={inputClass}>
              <option value="planning">Planning</option>
              <option value="under_construction">Under Construction</option>
              <option value="near_completion">Near Completion</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={inputClass} placeholder="https://..." />
          </div>
        </div>
      </Modal>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

function HeaderStat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}
