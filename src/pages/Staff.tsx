import { useState, useCallback } from 'react';
import { Plus, Phone, Mail, PhoneCall, MessageCircle, Users, Calendar, TrendingUp, Eye, Clock, ChevronRight, UserCog, Award, Target, Activity as ActivityIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useSyncTrigger } from '@/lib/sync';
import type { Staff as StaffType, StaffActivity, Lead } from '@/lib/types';
import { mockStaff, mockActivities, mockLeads as mockLeadsData } from '@/lib/mockData';
import { formatDate, daysUntil } from '@/lib/utils';
import StatusBadge from '@/components/StatusBadge';
import Modal from '@/components/Modal';

const roleLabels: Record<string, string> = {
  agent: 'Agent',
  senior_agent: 'Senior Agent',
  manager: 'Manager',
  admin: 'Administrator',
  worker: 'Field Worker',
};

const activityIcons: Record<string, typeof PhoneCall> = {
  call: PhoneCall,
  meeting: Users,
  whatsapp: MessageCircle,
  site_visit: Eye,
  follow_up: Clock,
  deal_progress: TrendingUp,
  note: ActivityIcon,
};

const activityColors: Record<string, string> = {
  call: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  meeting: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  whatsapp: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  site_visit: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400',
  follow_up: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  deal_progress: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  note: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

export default function Staff() {
  const [staff, setStaff] = useState<StaffType[]>(mockStaff);
  const [activities, setActivities] = useState<StaffActivity[]>(mockActivities);
  const [leads, setLeads] = useState<Lead[]>(mockLeadsData);
  const [loading, setLoading] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [logActivityOpen, setLogActivityOpen] = useState(false);
  const [timelineStaff, setTimelineStaff] = useState<StaffType | null>(null);
  const [staffForm, setStaffForm] = useState({ name: '', role: 'agent', phone: '', email: '' });
  const [activityForm, setActivityForm] = useState({
    staff_id: '',
    lead_id: '',
    activity_type: 'call',
    deal_stage: 'initial_inquiry',
    notes: '',
    next_followup_date: '',
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stf, acts, lds] = await Promise.all([
        supabase.from('staff').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('staff_activities').select('*, staff(*), lead(*)').order('activity_date', { ascending: false }).limit(20),
        supabase.from('leads').select('*').limit(20),
      ]);
      if (stf.data && stf.data.length > 0) setStaff(stf.data);
      if (acts.data && acts.data.length > 0) setActivities(acts.data);
      if (lds.data && lds.data.length > 0) setLeads(lds.data);
    } catch (err) {
      console.error('Failed to load staff data, using fallback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  function reloadData() { loadData(); }

  useSyncTrigger(loadData);

  async function handleAddStaff() {
    setSaving(true);
    try {
      await supabase.from('staff').insert({
        name: staffForm.name,
        role: staffForm.role,
        phone: staffForm.phone || null,
        email: staffForm.email || null,
      });
      setAddStaffOpen(false);
      setStaffForm({ name: '', role: 'agent', phone: '', email: '' });
    } catch (err) {
      console.error('Failed to add staff:', err);
    } finally {
      setSaving(false);
      reloadData();
    }
  }

  async function handleLogActivity() {
    setSaving(true);
    try {
      await supabase.from('staff_activities').insert({
        staff_id: activityForm.staff_id,
        lead_id: activityForm.lead_id || null,
        activity_type: activityForm.activity_type,
        deal_stage: activityForm.deal_stage,
        notes: activityForm.notes || null,
        next_followup_date: activityForm.next_followup_date || null,
        activity_date: new Date().toISOString().split('T')[0],
      });
      setLogActivityOpen(false);
      setActivityForm({ staff_id: '', lead_id: '', activity_type: 'call', deal_stage: 'initial_inquiry', notes: '', next_followup_date: '' });
    } catch (err) {
      console.error('Failed to log activity:', err);
    } finally {
      setSaving(false);
      reloadData();
    }
  }

  function openLogActivity(staffMember?: StaffType) {
    setActivityForm({
      staff_id: staffMember?.id || '',
      lead_id: '',
      activity_type: 'call',
      deal_stage: 'initial_inquiry',
      notes: '',
      next_followup_date: '',
    });
    setLogActivityOpen(true);
  }

  // Compute stats per staff
  function getStaffStats(staffId: string) {
    const staffActs = activities.filter((a) => a.staff_id === staffId);
    const staffLeads = leads.filter((l) => l.assigned_staff_id === staffId);
    const activeLeads = staffLeads.filter((l) => l.status !== 'closed');
    const closedLeads = staffLeads.filter((l) => l.status === 'closed');
    const todayActs = staffActs.filter((a) => daysUntil(a.activity_date) === 0);
    const upcomingFollowups = staffActs.filter((a) => a.next_followup_date && daysUntil(a.next_followup_date) >= 0);
    return { total: staffActs.length, activeLeads: activeLeads.length, closedLeads: closedLeads.length, today: todayActs.length, upcoming: upcomingFollowups.length };
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
      </div>
    );
  }

  const totalActiveDeals = staff.reduce((s, m) => s + getStaffStats(m.id).activeLeads, 0);
  const totalActivities = activities.length;
  const totalClosed = staff.reduce((s, m) => s + getStaffStats(m.id).closedLeads, 0);
  const todayActivities = activities.filter((a) => daysUntil(a.activity_date) === 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Team Members" value={String(staff.length)} icon={<UserCog className="h-5 w-5" />} color="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" />
        <SummaryCard title="Active Deals" value={String(totalActiveDeals)} icon={<Target className="h-5 w-5" />} color="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" />
        <SummaryCard title="Total Activities" value={String(totalActivities)} icon={<ActivityIcon className="h-5 w-5" />} color="bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400" />
        <SummaryCard title="Closed Deals" value={String(totalClosed)} icon={<Award className="h-5 w-5" />} color="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3">
        <button
          onClick={() => openLogActivity()}
          className="flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
        >
          <ActivityIcon className="h-4 w-4" /> Log Activity
        </button>
        <button
          onClick={() => setAddStaffOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add Staff Member
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {staff.map((member) => {
          const stats = getStaffStats(member.id);
          const memberLeads = leads.filter((l) => l.assigned_staff_id === member.id);
          const recentActs = activities.filter((a) => a.staff_id === member.id).slice(0, 3);

          return (
            <div
              key={member.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Header with gradient */}
              <div className="relative bg-gradient-to-r from-black to-slate-900 p-5">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900/20 to-transparent" />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-black shadow-lg"
                      style={{ backgroundColor: member.avatar_color }}
                    >
                      {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-amber-400">{member.name}</h3>
                      <p className="text-xs text-amber-600/70">{roleLabels[member.role] || member.role}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400">
                    {stats.activeLeads} active
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5">
                {/* Contact info */}
                <div className="space-y-1.5">
                  {member.phone && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Phone className="h-3 w-3" /> {member.phone}
                    </p>
                  )}
                  {member.email && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Mail className="h-3 w-3" /> {member.email}
                    </p>
                  )}
                </div>

                {/* Performance Stats */}
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <StatBox value={stats.activeLeads} label="Active" color="text-blue-600 dark:text-blue-400" />
                  <StatBox value={stats.closedLeads} label="Closed" color="text-emerald-600 dark:text-emerald-400" />
                  <StatBox value={stats.total} label="Logs" color="text-purple-600 dark:text-purple-400" />
                  <StatBox value={stats.today} label="Today" color="text-amber-600 dark:text-amber-400" />
                </div>

                {/* Assigned Leads */}
                {memberLeads.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Assigned Clients</p>
                    <div className="flex flex-wrap gap-1.5">
                      {memberLeads.slice(0, 4).map((l) => (
                        <span key={l.id} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {l.name}
                        </span>
                      ))}
                      {memberLeads.length > 4 && (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800">
                          +{memberLeads.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Activities Preview */}
                {recentActs.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">Recent Activity</p>
                    <div className="space-y-2">
                      {recentActs.map((act) => {
                        const Icon = activityIcons[act.activity_type] || ActivityIcon;
                        return (
                          <div key={act.id} className="flex items-center gap-2 text-xs">
                            <div className={`flex h-6 w-6 items-center justify-center rounded ${activityColors[act.activity_type]}`}>
                              <Icon className="h-3 w-3" />
                            </div>
                            <span className="flex-1 truncate text-slate-600 dark:text-slate-400">
                              {act.lead?.name || 'General'} — {act.notes?.slice(0, 40) || 'No notes'}
                            </span>
                            <span className="text-slate-400">{formatDate(act.activity_date)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setTimelineStaff(member)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Eye className="h-3.5 w-3.5" /> View Timeline
                  </button>
                  <button
                    onClick={() => openLogActivity(member)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30"
                  >
                    <Plus className="h-3.5 w-3.5" /> Log Activity
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Today's Activity Feed */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recent Activity Feed</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Latest staff interactions with clients</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 dark:bg-amber-500/10">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{todayActivities} today</span>
          </div>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.slice(0, 15).map((act) => {
            const Icon = activityIcons[act.activity_type] || ActivityIcon;
            const followupDays = act.next_followup_date ? daysUntil(act.next_followup_date) : null;
            return (
              <div key={act.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activityColors[act.activity_type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {act.staff?.name || 'Unknown'}
                      <span className="font-normal text-slate-400"> → {act.lead?.name || 'General'}</span>
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">{formatDate(act.activity_date)}</span>
                  </div>
                  {act.notes && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{act.notes}</p>}
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={act.deal_stage} />
                    {followupDays !== null && (
                      <span className={`text-xs font-medium ${followupDays < 0 ? 'text-red-500' : followupDays === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        <Calendar className="mr-1 inline h-3 w-3" />
                        {followupDays < 0 ? `${Math.abs(followupDays)}d overdue` : followupDays === 0 ? 'Follow up today' : `Follow up in ${followupDays}d`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {activities.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">No activities logged yet</p>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <Modal
        open={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        title="Add Staff Member"
        footer={
          <>
            <button onClick={() => setAddStaffOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button onClick={handleAddStaff} disabled={saving} className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Member'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Full Name</label>
            <input value={staffForm.name} onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })} className={inputClass} placeholder="Ahmed Raza" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Role</label>
            <select value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })} className={inputClass}>
              <option value="agent">Agent</option>
              <option value="senior_agent">Senior Agent</option>
              <option value="manager">Manager</option>
              <option value="admin">Administrator</option>
              <option value="worker">Field Worker</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Phone</label>
              <input value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} className={inputClass} placeholder="+92 300 1234567" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Email</label>
              <input value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} className={inputClass} placeholder="name@bintaha.com" />
            </div>
          </div>
        </div>
      </Modal>

      {/* Log Activity Modal */}
      <Modal
        open={logActivityOpen}
        onClose={() => setLogActivityOpen(false)}
        title="Log Staff Activity"
        footer={
          <>
            <button onClick={() => setLogActivityOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button>
            <button onClick={handleLogActivity} disabled={saving} className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-50">
              {saving ? 'Saving...' : 'Log Activity'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Staff Member</label>
            <select value={activityForm.staff_id} onChange={(e) => setActivityForm({ ...activityForm, staff_id: e.target.value })} className={inputClass}>
              <option value="">Select staff</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name} — {roleLabels[s.role]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Client / Lead</label>
            <select value={activityForm.lead_id} onChange={(e) => setActivityForm({ ...activityForm, lead_id: e.target.value })} className={inputClass}>
              <option value="">Select lead (optional)</option>
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.phone}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Activity Type</label>
              <select value={activityForm.activity_type} onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })} className={inputClass}>
                <option value="call">Phone Call</option>
                <option value="meeting">Meeting</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="site_visit">Site Visit</option>
                <option value="follow_up">Follow-up</option>
                <option value="deal_progress">Deal Progress</option>
                <option value="note">Note</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Deal Stage</label>
              <select value={activityForm.deal_stage} onChange={(e) => setActivityForm({ ...activityForm, deal_stage: e.target.value })} className={inputClass}>
                <option value="initial_inquiry">Initial Inquiry</option>
                <option value="discussion_held">Discussion Held</option>
                <option value="token_stage">Token Stage</option>
                <option value="follow_up_required">Follow-up Required</option>
                <option value="deal_closed">Deal Closed</option>
                <option value="deal_lost">Deal Lost</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Notes / Conversation Summary</label>
            <textarea value={activityForm.notes} onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })} className={`${inputClass} min-h-[100px] resize-y`} placeholder="Call notes, meeting discussion, WhatsApp summary..." />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Next Follow-up Date</label>
            <input type="date" value={activityForm.next_followup_date} onChange={(e) => setActivityForm({ ...activityForm, next_followup_date: e.target.value })} className={inputClass} />
          </div>
        </div>
      </Modal>

      {/* Timeline Modal */}
      <Modal
        open={!!timelineStaff}
        onClose={() => setTimelineStaff(null)}
        title={`Activity Timeline — ${timelineStaff?.name || ''}`}
        footer={
          <>
            <button onClick={() => openLogActivity(timelineStaff || undefined)} className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              <Plus className="h-4 w-4" /> Log New Activity
            </button>
            <button onClick={() => setTimelineStaff(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">Close</button>
          </>
        }
      >
        {timelineStaff && (
          <div className="space-y-1">
            {/* Staff header */}
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-black to-slate-900 p-4">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-black"
                style={{ backgroundColor: timelineStaff.avatar_color }}
              >
                {timelineStaff.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-amber-400">{timelineStaff.name}</p>
                <p className="text-xs text-amber-600/70">{roleLabels[timelineStaff.role]}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-lg font-bold text-amber-400">{getStaffStats(timelineStaff.id).activeLeads}</p>
                <p className="text-xs text-amber-600/70">Active Deals</p>
              </div>
            </div>

            {/* Timeline */}
            <div className="relative space-y-4 pl-6">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-amber-400 via-amber-300 to-slate-200 dark:to-slate-700" />
              {activities
                .filter((a) => a.staff_id === timelineStaff.id)
                .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
                .map((act) => {
                  const Icon = activityIcons[act.activity_type] || ActivityIcon;
                  const followupDays = act.next_followup_date ? daysUntil(act.next_followup_date) : null;
                  return (
                    <div key={act.id} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-5 top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900 ${activityColors[act.activity_type]}`}>
                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                      </div>
                      {/* Content */}
                      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${activityColors[act.activity_type]}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {act.lead?.name || 'General Activity'}
                              </p>
                              <p className="text-xs text-slate-400">{formatDate(act.activity_date)}</p>
                            </div>
                          </div>
                          <StatusBadge status={act.deal_stage} />
                        </div>
                        {act.notes && (
                          <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">{act.notes}</p>
                        )}
                        {followupDays !== null && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span className={followupDays < 0 ? 'font-semibold text-red-500' : followupDays === 0 ? 'font-semibold text-amber-500' : 'text-slate-400'}>
                              Next follow-up: {formatDate(act.next_followup_date!)}
                              {followupDays < 0 ? ` (${Math.abs(followupDays)}d overdue)` : followupDays === 0 ? ' (today)' : ` (in ${followupDays}d)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              {activities.filter((a) => a.staff_id === timelineStaff.id).length === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No activities logged for this staff member</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";

function SummaryCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

function StatBox({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/50">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
