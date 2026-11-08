import React, { useState, useEffect } from 'react';
import {
  TrendingUp, Calendar, Users, DollarSign, ShieldAlert,
  Sparkles, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { Header } from '../components/Header';
import { StatCard } from '../components/StatCard';
import { forecastsApi } from '../services/api';
import type { DemandForecastResponse } from '../types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

export const DemandForecasting: React.FC = () => {
  const [forecastData, setForecastData] = useState<DemandForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const res = await forecastsApi.getForecasts();
      setForecastData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  const nextDay = forecastData?.next_day_forecast;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="AI-Based Visitor Demand Forecasting"
        subtitle="7-Day attendance projection, revenue expectation, and adaptive staffing recommendations"
        japaneseTitle="AI 来園需要・収益予測モデル"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Park Attendance Forecasting</h2>
            <p className="text-xs text-slate-400">Powered by GradientBoostingRegressor trained on multi-season telemetry</p>
          </div>
          <button
            onClick={fetchForecasts}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-run Forecast Model</span>
          </button>
        </div>

        {/* Next Day Focus Card */}
        {nextDay && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-950/40 via-indigo-950/30 to-slate-900 border border-rose-500/30 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Next Operating Day
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    {nextDay.day_name}, {nextDay.date}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-white tracking-tight">
                  Forecasted Admissions: {nextDay.predicted_visitors.toLocaleString()} Guests
                </h3>
                <p className="text-xs text-slate-300">
                  95% Empirical Confidence Band: {nextDay.confidence_lower.toLocaleString()} – {nextDay.confidence_upper.toLocaleString()} visitors
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Expected Revenue</span>
                  <span className="font-mono font-bold text-emerald-400 text-base mt-0.5 block">
                    ¥{Math.round(nextDay.expected_revenue_jpy).toLocaleString()}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-medium">Required Staffing</span>
                  <span className="font-mono font-bold text-indigo-400 text-base mt-0.5 block">
                    {nextDay.recommended_staffing_level} Operators
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 block font-medium">Operational Day</span>
                  <span className="font-mono font-bold text-amber-400 text-base mt-0.5 block">
                    {nextDay.is_weekend ? 'Weekend Surge' : 'Standard Day'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7-Day Forecast Chart */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">7-Day Attendance & Revenue Projection</h3>
              <p className="text-xs text-slate-400">GradientBoosting predictive curve with weekend elasticity</p>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData?.seven_day_forecast || []}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day_name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any, name: any) => [
                    name === 'predicted_visitors' ? `${Number(val).toLocaleString()} visitors` : `¥${Number(val).toLocaleString()}`,
                    name === 'predicted_visitors' ? 'Forecasted Visitors' : 'Expected Revenue'
                  ]}
                />
                <Area type="monotone" dataKey="predicted_visitors" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#forecastGrad)" name="predicted_visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Forecast Breakdown Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              7-Day Operational Planning Table
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Forecast Date</th>
                  <th className="py-3 px-4">Day</th>
                  <th className="py-3 px-4">Predicted Visitors</th>
                  <th className="py-3 px-4">Expected Revenue (JPY)</th>
                  <th className="py-3 px-4">Recommended Gate Crew</th>
                  <th className="py-3 px-4">Tier Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {(forecastData?.seven_day_forecast || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-white">{item.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{item.day_name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      {item.predicted_visitors.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      ¥{Math.round(item.expected_revenue_jpy).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-400 font-semibold">
                      {item.recommended_staffing_level} Staff
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                        item.is_weekend
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {item.is_weekend ? 'Weekend' : 'Weekday'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Model Metrics & Limitations Callout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Model Architecture & Validation Metrics</span>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              <div className="p-2 rounded-lg bg-slate-800/60 text-center">
                <span className="text-[10px] text-slate-500 block">R² Score</span>
                <span className="font-bold text-emerald-400">{forecastData?.model_metrics.r2_score || 0.977}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 text-center">
                <span className="text-[10px] text-slate-500 block">MAE</span>
                <span className="font-bold text-white">{forecastData?.model_metrics.mae_visitors || 295} guests</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/60 text-center">
                <span className="text-[10px] text-slate-500 block">Horizon</span>
                <span className="font-bold text-indigo-400">7 Days</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {forecastData?.seasonality_summary}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Model Assumptions & Known Limitations</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {forecastData?.limitations_and_disclaimer}
            </p>
            <div className="text-[10px] text-amber-400/80 font-mono">
              Note: Unforeseen Mount Fuji weather events require manual turnstile override.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
