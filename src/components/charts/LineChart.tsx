import { useEffect, useState } from 'react';

interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export default function LineChart({ data, height = 220, color = '#d4af37' }: LineChartProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const width = 600;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.value - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ minWidth: 400, height }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = padding.top + chartH * t;
          const val = maxVal - range * t;
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                ₹{(val / 100000).toFixed(0)}L
              </text>
            </g>
          );
        })}

        {/* Area */}
        <path
          d={areaPath}
          fill="url(#areaGradient)"
          style={{ opacity: animated ? 1 : 0, transition: 'opacity 1s ease 0.3s' }}
        />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 2000,
            strokeDashoffset: animated ? 0 : 2000,
            transition: 'stroke-dashoffset 1.5s ease-out',
          }}
        />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i} style={{ opacity: animated ? 1 : 0, transition: `opacity 0.3s ease ${0.5 + i * 0.1}s` }}>
            <circle cx={p.x} cy={p.y} r="5" fill="white" stroke={color} strokeWidth="2.5" className="drop-shadow-sm" />
            <text x={p.x} y={height - 8} textAnchor="middle" className="fill-slate-500 text-[10px] dark:fill-slate-400">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
