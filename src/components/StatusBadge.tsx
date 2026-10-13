interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; classes: string; dot: string }> = {
  available: { label: 'Available', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500' },
  booked: { label: 'Booked', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500' },
  sold: { label: 'Sold', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  new: { label: 'New', classes: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', dot: 'bg-blue-500' },
  follow_up: { label: 'Follow-up', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500' },
  meeting: { label: 'Meeting', classes: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400', dot: 'bg-purple-500' },
  closed: { label: 'Closed Deal', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500' },
  pending: { label: 'Pending', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500' },
  paid: { label: 'Paid', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500' },
  planning: { label: 'Planning', classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' },
  under_construction: { label: 'Under Construction', classes: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', dot: 'bg-blue-500' },
  near_completion: { label: 'Near Completion', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500' },
  completed: { label: 'Completed', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500' },
  initial_inquiry: { label: 'Initial Inquiry', classes: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400', dot: 'bg-blue-500' },
  discussion_held: { label: 'Discussion Held', classes: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400', dot: 'bg-cyan-500' },
  token_stage: { label: 'Token Stage', classes: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400', dot: 'bg-amber-500' },
  follow_up_required: { label: 'Follow-up Required', classes: 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400', dot: 'bg-orange-500' },
  deal_closed: { label: 'Deal Closed', classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500' },
  deal_lost: { label: 'Deal Lost', classes: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400', dot: 'bg-red-500' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, classes: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
