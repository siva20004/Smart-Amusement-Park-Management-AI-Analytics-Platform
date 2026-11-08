import React, { useState, useEffect } from 'react';
import {
  Sparkles, AlertTriangle, ShieldAlert, CheckCircle2,
  TrendingUp, Users, Wrench, RefreshCw, ArrowRight
} from 'lucide-react';
import { Header } from '../components/Header';
import { recommendationsApi } from '../services/api';
import type { RecommendationItem } from '../types';

export const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await recommendationsApi.getRecommendations();
      setRecommendations(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const filteredRecs = categoryFilter
    ? recommendations.filter((r) => r.category === categoryFilter)
    : recommendations;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="AI Business & Operational Decision Engine"
        subtitle="Automated operational recommendations generated from live database values and machine learning forecasts"
        japaneseTitle="AI 意思決定支援・業務最適化レコメンド"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Active Strategic Recommendations</h2>
            <p className="text-xs text-slate-400">
              Real-time heuristic & predictive rules evaluating queue spikes, duty cycles, and attendance surges
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="">All Categories</option>
              <option value="Crowd Control">Crowd Control (混雑緩和)</option>
              <option value="Staffing">Staffing (人員配置)</option>
              <option value="Operations">Operations (運行最適化)</option>
              <option value="Maintenance">Maintenance (予知保全)</option>
              <option value="Revenue">Revenue (収益向上)</option>
            </select>

            <button
              onClick={fetchRecommendations}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Evaluate Rules</span>
            </button>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRecs.map((rec) => {
            const urgencyStyles = {
              critical: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
              high: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
              medium: 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300',
              low: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
            }[rec.urgency];

            const badgeStyles = {
              critical: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
              high: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
              medium: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
              low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
            }[rec.urgency];

            return (
              <div
                key={rec.id}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-xl space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                      {rec.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${badgeStyles}`}>
                      {rec.urgency} Urgency
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2.5 tracking-tight">
                    {rec.title}
                  </h3>

                  <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                    {rec.description}
                  </p>
                </div>

                {/* Impact & Action Box */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Operational Impact:
                    </span>
                    <p className="text-xs text-slate-200">{rec.impact}</p>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${urgencyStyles} space-y-1`}>
                    <div className="flex items-center space-x-1.5 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recommended Action:</span>
                    </div>
                    <p className="text-xs leading-relaxed font-medium">
                      {rec.recommended_action}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
