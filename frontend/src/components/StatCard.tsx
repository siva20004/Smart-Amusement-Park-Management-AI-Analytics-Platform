import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  jpTitle?: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  color?: 'rose' | 'indigo' | 'emerald' | 'amber' | 'cyan';
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  jpTitle,
  value,
  change,
  isPositive = true,
  icon: Icon,
  color = 'indigo',
  subtitle
}) => {
  const colorMap = {
    rose: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30',
    indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
    cyan: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/30',
  };

  const iconBgMap = {
    rose: 'bg-rose-500/10 text-rose-400',
    indigo: 'bg-indigo-500/10 text-indigo-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    cyan: 'bg-cyan-500/10 text-cyan-400',
  };

  return (
    <div className={`p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm relative overflow-hidden group`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-medium text-slate-400">{title}</span>
            {jpTitle && <span className="text-[10px] text-slate-500">({jpTitle})</span>}
          </div>
          <div className="text-2xl font-bold text-white mt-1.5 tracking-tight font-mono">{value}</div>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBgMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(change || subtitle) && (
        <div className="mt-3.5 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
          {change && (
            <span className={`font-semibold flex items-center ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? '↑' : '↓'} {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
