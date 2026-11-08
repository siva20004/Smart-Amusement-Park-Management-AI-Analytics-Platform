import React, { useState, useEffect } from 'react';
import {
  Layers, Clock, Users, Wrench, AlertOctagon, CheckCircle2,
  Sliders, Plus, Edit2, X, RefreshCw
} from 'lucide-react';
import { Header } from '../components/Header';
import { attractionsApi } from '../services/api';
import type { Attraction } from '../types';

export const Attractions: React.FC = () => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Edit Modal State
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [editFormData, setEditFormData] = useState({
    status: 'operational',
    current_wait_time: 15,
    hourly_capacity: 1000,
    operating_hours: '09:00 - 18:00',
  });
  const [saving, setSaving] = useState<boolean>(false);

  const fetchAttractions = async () => {
    try {
      setLoading(true);
      const res = await attractionsApi.list(categoryFilter || undefined, statusFilter || undefined);
      setAttractions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttractions();
  }, [categoryFilter, statusFilter]);

  const handleOpenEdit = (attr: Attraction) => {
    setSelectedAttraction(attr);
    setEditFormData({
      status: attr.status,
      current_wait_time: attr.current_wait_time,
      hourly_capacity: attr.hourly_capacity,
      operating_hours: attr.operating_hours,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttraction) return;

    try {
      setSaving(true);
      await attractionsApi.update(selectedAttraction.id, editFormData);
      setSelectedAttraction(null);
      fetchAttractions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update attraction');
    } finally {
      setSaving(false);
    }
  };

  const handleFastStatusToggle = async (attrId: number, newStatus: string) => {
    try {
      await attractionsApi.setStatus(attrId, newStatus);
      fetchAttractions();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to change status');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Attractions Fleet Management"
        subtitle="Manage Fuji-Q Highland roller coasters, queue intervals, and maintenance schedules"
        japaneseTitle="アトラクション運行・整備管理"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="">All Ride Categories</option>
              <option value="roller_coaster">Thrill Coaster (絶叫コースター)</option>
              <option value="horror">Horror Attraction (ホラー)</option>
              <option value="thrill">Thrill Tower & Swing (スリル)</option>
              <option value="water">Water Attraction (ウォーター)</option>
              <option value="family">Family Theme (ファミリー)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="">All Operating States</option>
              <option value="operational">Operational (運行中)</option>
              <option value="maintenance">Maintenance (整備中)</option>
              <option value="temporarily_closed">Closed (一時運休)</option>
            </select>
          </div>

          <button
            onClick={fetchAttractions}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition-colors self-end"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Fleet</span>
          </button>
        </div>

        {/* Attractions Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {attractions.map((attr) => {
            const isOp = attr.status === 'operational';
            const isMaint = attr.status === 'maintenance';

            return (
              <div
                key={attr.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isOp
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : isMaint
                    ? 'bg-amber-950/20 border-amber-900/40'
                    : 'bg-rose-950/20 border-rose-900/40'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {attr.category.replace('_', ' ')}
                      </span>
                      <h3 className="text-base font-bold text-white tracking-tight mt-0.5">{attr.name}</h3>
                      <p className="text-xs text-slate-400">{attr.japanese_name}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border ${
                        isOp
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isMaint
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {attr.status.replace('_', ' ')}
                    </span>
                  </div>

                  {attr.description && (
                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {attr.description}
                    </p>
                  )}

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-center">
                    <div className="p-2 rounded-lg bg-slate-800/40">
                      <div className="text-[10px] text-slate-400">Queue Time</div>
                      <div className="text-sm font-mono font-bold text-rose-400 mt-0.5">
                        {isOp ? `${attr.current_wait_time}m` : '0m'}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/40">
                      <div className="text-[10px] text-slate-400">Today Riders</div>
                      <div className="text-sm font-mono font-bold text-white mt-0.5">
                        {attr.visitor_count_today.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/40">
                      <div className="text-[10px] text-slate-400">Capacity/hr</div>
                      <div className="text-sm font-mono font-bold text-indigo-400 mt-0.5">
                        {attr.hourly_capacity}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleFastStatusToggle(attr.id, isOp ? 'maintenance' : 'operational')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center space-x-1 transition-colors ${
                        isOp
                          ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {isOp ? <Wrench className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      <span>{isOp ? 'Set Maintenance' : 'Reactivate'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenEdit(attr)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit Ride Parameters"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal: Edit Attraction */}
        {selectedAttraction && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedAttraction.name}</h3>
                  <p className="text-xs text-slate-400">{selectedAttraction.japanese_name}</p>
                </div>
                <button
                  onClick={() => setSelectedAttraction(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Operational Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="operational">Operational (運行中)</option>
                    <option value="maintenance">Scheduled Maintenance (定期整備)</option>
                    <option value="temporarily_closed">Temporarily Closed (一時休止)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-slate-300 font-semibold">Current Queue Wait Time (Minutes)</label>
                    <span className="font-mono font-bold text-rose-400">{editFormData.current_wait_time} min</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="5"
                    value={editFormData.current_wait_time}
                    onChange={(e) => setEditFormData({ ...editFormData, current_wait_time: parseInt(e.target.value) })}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Hourly Throughput Capacity (Guests/hr)</label>
                  <input
                    type="number"
                    value={editFormData.hourly_capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, hourly_capacity: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Operating Hours</label>
                  <input
                    type="text"
                    value={editFormData.operating_hours}
                    onChange={(e) => setEditFormData({ ...editFormData, operating_hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAttraction(null)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Update Telemetry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
