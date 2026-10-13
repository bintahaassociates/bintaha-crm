import { useEffect, useState } from 'react';

interface BarChartProps {
  data: { label: string; value: number; prevValue?: number }[];
  height?: number;
}

export default function BarChart({ data, height = 240 }: BarChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const maxVal = Math.max(...data.map((d) => Math.max(d.value, d.prevValue || 0)), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full" style={{ height }}>
      <div className="flex h-full items-end justify-around gap-2 px-2">
        {data.map((d, i) => {
          const barH = animated ? (d.value / maxVal) * 100 : 0;
          const prevH = d.prevValue ? (d.prevValue / maxVal) * 100 : 0;
          const growth = d.prevValue ? ((d.value - d.prevValue) / d.prevValue) * 100 : null;
          return (
            <div key={i} className="group relative flex h-full flex-1 flex-col items-center justify-end" style={{ maxWidth: `${barWidth}%` }}>
              {/* Tooltip */}
              <div className="absolute -top-2 z-10 hidden rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-xl group-hover:block dark:bg-slate-700">
                <p className="font-semibold">{d.label}: ₹{(d.value / 100000).toFixed(1)}L</p>
                {growth !== null && (
                  <p className={growth >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}% vs last period
                  </p>
                )}
              </div>

              {/* Previous period ghost bar */}
              {d.prevValue && (
                <div
                  className="absolute bottom-0 w-full max-w-[32px] rounded-t bg-slate-200 dark:bg-slate-700/50"
                  style={{ height: `${prevH}%`, transition: 'height 0.8s ease-out' }}
                />
              )}

              {/* Main bar */}
              <div
                className="relative w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-amber-500 to-amber-300 transition-all duration-1000 ease-out group-hover:from-amber-600 group-hover:to-amber-400"
                style={{ height: `${barH}%`, transitionDelay: `${i * 80}ms` }}
              >
                <div className="absolute inset-0 rounded-t-md bg-white/10 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              {/* Label */}
              <span className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{d.label}</span>

              {/* Growth indicator */}
              {growth !== null && (
                <span className={`mt-0.5 text-[10px] font-bold ${growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {growth >= 0 ? '↑' : '↓'}{Math.abs(growth).toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
