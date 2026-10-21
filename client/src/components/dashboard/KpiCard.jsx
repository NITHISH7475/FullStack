import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const colorVariants = {
  green: {
    iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    trendBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    glow: 'from-emerald-500/5',
  },
  blue: {
    iconBg: 'bg-sky-50 text-sky-600 border border-sky-100',
    trendBg: 'bg-sky-50 text-sky-700 border-sky-200',
    glow: 'from-sky-500/5',
  },
  red: {
    iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    trendBg: 'bg-rose-50 text-rose-700 border-rose-200',
    glow: 'from-rose-500/5',
  },
  purple: {
    iconBg: 'bg-violet-50 text-violet-600 border border-violet-100',
    trendBg: 'bg-violet-50 text-violet-700 border-violet-200',
    glow: 'from-violet-500/5',
  },
  yellow: {
    iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    trendBg: 'bg-amber-50 text-amber-700 border-amber-200',
    glow: 'from-amber-500/5',
  },
};

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  trendValue,
  color = 'green',
  metricUnit,
}) {
  const selectedTheme = colorVariants[color] || colorVariants.green;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="relative bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-200 group overflow-hidden">
      {/* Subtle top edge accent gradient */}
      <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${selectedTheme.glow} to-transparent`}></div>

      {/* Header: Label & Icon */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${selectedTheme.iconBg} transition-transform group-hover:scale-105 duration-150`}>
          {Icon && <Icon className="w-4 h-4" />}
        </div>
      </div>

      {/* Metric Value */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
          {value}
        </span>
        {metricUnit && (
          <span className="text-xs font-mono text-slate-400 font-semibold">{metricUnit}</span>
        )}
      </div>

      {/* Micro-telemetry & Trend */}
      <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
        {trendValue ? (
          <div
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${selectedTheme.trendBg}`}
          >
            <TrendIcon className="w-3 h-3" />
            <span>{trendValue}</span>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-slate-400">STABLE</span>
        )}
        {subtitle && (
          <span className="text-[11px] text-slate-400 truncate max-w-[60%] text-right font-normal">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default KpiCard;
