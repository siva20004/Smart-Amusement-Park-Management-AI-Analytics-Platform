import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, PieChart as PieIcon, RefreshCw, Calendar, Award
} from 'lucide-react';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { analyticsApi } from '../services/api';
import type { VisitorAnalytics as VisitorAnalyticsType } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

export const VisitorAnalytics: React.FC = () => {
  const [data, setData] = useState<VisitorAnalyticsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getVisitorAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#e11d48', '#4f46e5', '#10b981', '#f59e0b', '#06b6d4'];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Visitor Behavior & Demographics Analytics"
        subtitle="Turnstile telemetry, demographic patterns, and attendance dynamics at Fuji-Q"
        japaneseTitle="来園者動態・属性アナリティクス"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Visitor Dynamics Intelligence</h2>
            <p className="text-xs text-slate-400">Data synthesized from 5,000 visitor profiles and ticket admissions</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Analytics</span>
          </button>
        </div>

        {/* 3 Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Repeat Visitor Loyalty"
            jpTitle="リピーター率"
            value={`${data?.repeat_visitor_rate || 28.4}%`}
            change="+4.2% YoY"
            isPositive={true}
            icon={Users}
            color="indigo"
            subtitle="Returning guests within 12 months"
          />
          <StatCard
            title="Core Guest Segment"
            jpTitle="中心年齢層"
            value="Adult (18-35)"
            icon={Award}
            color="rose"
            subtitle="50% of total park admissions"
          />
          <StatCard
            title="Peak Diurnal Surge"
            jpTitle="ピーク混雑帯"
            value="11:30 - 14:00"
            icon={Calendar}
            color="amber"
            subtitle="Maximum turnstile influx"
          />
        </div>

        {/* Charts Row 1: 30-Day Trend & Hourly Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 30-Day Attendance */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">30-Day Rolling Park Admissions</h3>
                <p className="text-xs text-slate-400">Admissions telemetry reflecting weekend surge</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.daily_trends || []}>
                  <defs>
                    <linearGradient id="visitorFlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="display_date" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="visitors" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#visitorFlow)" name="Visitors" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Influx Flow */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Hourly Turnstile Influx Distribution</h3>
                <p className="text-xs text-slate-400">Hourly density curve (09:00 - 18:00)</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.hourly_distribution || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="visitors" fill="#e11d48" radius={[4, 4, 0, 0]} name="Admissions/hr" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2: Ticket Categories & Age Demographics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket Category Distribution */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Ticket Category Distribution</h3>
                <p className="text-xs text-slate-400">Breakdown of issued pass tiers</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.ticket_category_breakdown || []}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    label={(entry) => `${entry.category}`}
                  >
                    {(data?.ticket_category_breakdown || []).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Demographics by Age Group */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Demographics Distribution by Age Segment</h3>
                <p className="text-xs text-slate-400">Registered guest cohort analysis</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.demographics_by_age || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="age_group" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="Guest Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
