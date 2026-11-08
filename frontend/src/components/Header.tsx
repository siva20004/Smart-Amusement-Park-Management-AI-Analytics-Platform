import React, { useState, useEffect } from 'react';
import { Sun, ShieldCheck, Activity, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  japaneseTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, japaneseTitle }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ja-JP', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d1322]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div>
        <div className="flex items-center space-x-2.5">
          <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
          {japaneseTitle && (
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
              {japaneseTitle}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* Mount Fuji Sensor Node */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <Sun className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300 font-medium">Mt. Fuji Base: 18°C / Clear</span>
        </div>

        {/* Live Operational Status */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-semibold tracking-wide uppercase text-[11px]">System Live</span>
        </div>

        {/* Park Clock */}
        <div className="font-mono text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-semibold">
          {time || '09:00:00'} <span className="text-slate-400 text-[10px]">JST</span>
        </div>
      </div>
    </header>
  );
};
