import { type ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: 'gold' | 'blue' | 'amber' | 'rose' | 'teal';
}

const colorMap = {
  gold: 'from-amber-400 to-amber-600 shadow-amber-500/20',
  blue: 'from-blue-500 to-indigo-600 shadow-blue-500/20',
  amber: 'from-amber-500 to-orange-600 shadow-amber-500/20',
  rose: 'from-rose-500 to-red-600 shadow-rose-500/20',
  teal: 'from-teal-500 to-cyan-600 shadow-teal-500/20',
};

export default function StatCard({ title, value, icon, trend, color = 'gold' }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${trend.value >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
          </span>
          <span className="text-xs text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
