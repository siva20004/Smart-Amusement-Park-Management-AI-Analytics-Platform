import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, Download, FileSpreadsheet, FileText,
  ShoppingBag, Coffee, Ticket, RefreshCw
} from 'lucide-react';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { analyticsApi, reportsApi } from '../services/api';
import type { RevenueAnalytics as RevenueAnalyticsType } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

export const RevenueAnalytics: React.FC = () => {
  const [data, setData] = useState<RevenueAnalyticsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getRevenueAnalytics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  const handleQuickExport = async (format: 'xlsx' | 'pdf') => {
    try {
      setExporting(true);
      const report = await reportsApi.generate('monthly_revenue', format);
      // Trigger download
      window.open(reportsApi.getDownloadUrl(report.id), '_blank');
    } catch (err) {
      console.error(err);
      alert('Failed to generate revenue report');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Revenue & Commercial Analytics"
        subtitle="Gross park receipts, ticketing yield, Yamanashi souvenir retail, and restaurant telemetry"
        japaneseTitle="売上・収益アナリティクス"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Financial Performance Overview</h2>
            <p className="text-xs text-slate-400">Total revenue across all Fuji-Q Highland commercial terminals</p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleQuickExport('xlsx')}
              disabled={exporting}
              className="px-3.5 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleQuickExport('pdf')}
              disabled={exporting}
              className="px-3.5 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            jpTitle="総売上高"
            value={`¥${Math.round(data?.total_revenue || 0).toLocaleString()}`}
            change={`+${data?.growth_rate_pct || 14.8}% MoM`}
            isPositive={true}
            icon={DollarSign}
            color="emerald"
            subtitle="Past 90 Days Aggregate"
          />
          <StatCard
            title="Ticketing Yield"
            jpTitle="入園チケット売上"
            value={`¥${Math.round(data?.ticket_revenue || 0).toLocaleString()}`}
            icon={Ticket}
            color="rose"
            subtitle="Direct admissions"
          />
          <StatCard
            title="Merchandise Retail"
            jpTitle="物販・土産売上"
            value={`¥${Math.round(data?.merchandise_revenue || 0).toLocaleString()}`}
            icon={ShoppingBag}
            color="indigo"
            subtitle="Coaster & Anime souvenirs"
          />
          <StatCard
            title="Food & Beverage"
            jpTitle="飲食・レストラン"
            value={`¥${Math.round(data?.fnb_revenue || 0).toLocaleString()}`}
            icon={Coffee}
            color="amber"
            subtitle="Local Fuji dining"
          />
        </div>

        {/* 30-Day Revenue Trend Stacked Bar Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">30-Day Multi-Stream Financial Run-Rate</h3>
              <p className="text-xs text-slate-400">Tickets, Souvenirs & F&B Daily Breakdown</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              ¥ JPY
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.daily_revenue_breakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="display_date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(val) => `¥${(val / 1000000).toFixed(1)}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`¥${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="tickets" fill="#4f46e5" stackId="a" name="Admissions Ticket Revenue" />
                <Bar dataKey="merchandise" fill="#e11d48" stackId="a" name="Souvenirs & Merchandise" />
                <Bar dataKey="fnb" fill="#10b981" stackId="a" name="Food & Beverage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Attraction Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Attraction Revenue Attribution & Patronage
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Attraction Name</th>
                  <th className="py-3 px-4">Japanese Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Today's Riders</th>
                  <th className="py-3 px-4 text-right">Attributed Revenue Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {(data?.attraction_popularity_revenue || []).map((attr, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{attr.name}</td>
                    <td className="py-3 px-4 text-slate-400">{attr.japanese_name}</td>
                    <td className="py-3 px-4 capitalize">{attr.category.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-rose-400">
                      {attr.riders_today.toLocaleString()} riders
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-right">
                      ¥{Math.round(attr.attributed_revenue).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
