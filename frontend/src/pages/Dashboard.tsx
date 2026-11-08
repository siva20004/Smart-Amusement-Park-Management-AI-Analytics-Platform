import React, { useState, useEffect } from 'react';
import {
  Users, Ticket, DollarSign, Clock, Layers, AlertTriangle,
  TrendingUp, CheckCircle2, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { dashboardApi } from '../services/api';
import type { DashboardSummary } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getSummary();
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to connect to Fuji-Q telemetry backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
          <p className="text-sm text-slate-400 font-mono">Aggregating telemetry from Fuji-Q database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Fuji-Q Highland Operations Overview"
        subtitle="Real-time amusement park digital twin, turnstile telemetry, and operational intelligence"
        japaneseTitle="運行統合ダッシュボード"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Today's Park Performance</h2>
            <p className="text-xs text-slate-400">Synchronized directly with production database records</p>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-2 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Operational Alerts Banner */}
        {data?.operational_alerts && data.operational_alerts.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">Operational Notices</span>
              <ul className="text-xs text-slate-300 space-y-1">
                {data.operational_alerts.map((alert, idx) => (
                  <li key={idx} className="flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>{alert.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 5 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Visitors Today"
            jpTitle="本日入園者数"
            value={data?.total_visitors_today?.toLocaleString() || '0'}
            change="+12.4% vs last week"
            isPositive={true}
            icon={Users}
            color="rose"
            subtitle="Admitted via turnstiles"
          />
          <StatCard
            title="Tickets Sold Today"
            jpTitle="発券枚数"
            value={data?.total_tickets_sold_today?.toLocaleString() || '0'}
            change="+8.1%"
            isPositive={true}
            icon={Ticket}
            color="indigo"
            subtitle="All ticket tiers"
          />
          <StatCard
            title="Gross Revenue Today"
            jpTitle="本日売上合計"
            value={`¥${Math.round(data?.total_revenue_today || 0).toLocaleString()}`}
            change="+14.8%"
            isPositive={true}
            icon={DollarSign}
            color="emerald"
            subtitle="Tickets + F&B + Retail"
          />
          <StatCard
            title="Active Attractions"
            jpTitle="運行中アトラクション"
            value={`${data?.active_attractions_count || 0} / ${data?.total_attractions_count || 0}`}
            icon={Layers}
            color="cyan"
            subtitle="Operational Status"
          />
          <StatCard
            title="Avg Queue Time"
            jpTitle="平均待ち時間"
            value={`${data?.average_wait_time_minutes || 0} min`}
            icon={Clock}
            color="amber"
            subtitle={`Peak: ${data?.peak_visitor_hour}`}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Attendance Trend */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Daily Visitor Attendance Trend</h3>
                <p className="text-xs text-slate-400">14-Day rolling turnstile admissions</p>
              </div>
              <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                Live Data
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.daily_visitor_trend || []}>
                  <defs>
                    <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="visitors" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#visitorGradient)" name="Visitors" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Revenue Stream Composition</h3>
                <p className="text-xs text-slate-400">Tickets, Souvenirs & Yamanashi F&B</p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ¥ JPY
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(data?.revenue_trend || []).slice(-10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `¥${(val / 1000000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="ticket_rev" fill="#4f46e5" stackId="a" name="Tickets" />
                  <Bar dataKey="merch_rev" fill="#e11d48" stackId="a" name="Merch" />
                  <Bar dataKey="fnb_rev" fill="#10b981" stackId="a" name="F&B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Attractions Live Queue Matrix & Turnstile Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Attraction Queue Matrix */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Attractions Real-Time Queue & Capacity</h3>
                <p className="text-xs text-slate-400">Live Fuji-Q Highland ride operations matrix</p>
              </div>
              <span className="text-xs text-slate-400 font-mono">10 Key Attractions</span>
            </div>
            <div className="space-y-3">
              {data?.visitor_distribution_by_attraction.map((attr, idx) => {
                const waitColor =
                  attr.status !== 'operational'
                    ? 'text-slate-500 bg-slate-800'
                    : attr.wait_time >= 60
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                    : attr.wait_time >= 30
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 flex items-center justify-between hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                          {attr.name}
                          <span className="text-[10px] text-slate-400 font-normal truncate">{attr.japanese_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="capitalize">{attr.category.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{attr.riders_today?.toLocaleString() || 0} riders today</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-md font-mono font-bold border ${waitColor}`}>
                        {attr.status === 'operational' ? `${attr.wait_time} min` : attr.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Turnstile Verification Stream */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Live Turnstile Stream</h3>
                  <p className="text-xs text-slate-400">Gate ticket validation events</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-2.5">
                {data?.recent_verifications.map((v) => (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 flex items-start justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${v.status === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        <span className="font-semibold text-slate-200">Ticket #{v.ticket_id}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold ${
                          v.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {v.status === 'success' ? 'Admitted' : 'Rejected'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{v.gate}</p>
                      {v.reason && <p className="text-[10px] text-rose-300 mt-0.5 italic">{v.reason}</p>}
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{v.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 text-center">
              Turnstiles equipped with real-time duplicate pass detection
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
