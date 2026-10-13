import { useEffect, useState } from 'react';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export default function PieChart({ data, size = 200 }: PieChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  const radius = size / 2 - 20;
  const center = size / 2;
  const strokeWidth = 28;

  let cumulativeAngle = -90;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-0">
          {/* Background circle */}
          <circle cx={center} cy={center} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-slate-100 dark:stroke-slate-800" />

          {data.map((d, i) => {
            const angle = (d.value / total) * 360 * (animated ? 1 : 0);
            const startAngle = cumulativeAngle;
            const endAngle = startAngle + angle;
            cumulativeAngle = endAngle;

            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
                fill="none"
                stroke={d.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{
                  transition: `all 1s cubic-bezier(0.4, 0, 0.2, 1)`,
                  transitionDelay: `${i * 150}ms`,
                  opacity: animated ? 1 : 0,
                }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">₹{(total / 100000).toFixed(0)}L</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-3" style={{ opacity: animated ? 1 : 0, transition: `opacity 0.5s ease ${i * 150 + 400}ms` }}>
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{d.label}</span>
              <span className="text-xs text-slate-400">
                ₹{(d.value / 100000).toFixed(1)}L · {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
