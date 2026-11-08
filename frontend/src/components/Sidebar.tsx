import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, QrCode, Sparkles, TrendingUp,
  BarChart3, DollarSign, FileText, Users, Shield,
  Layers, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { name: 'Dashboard', jp: '運航ダッシュボード', path: '/', icon: LayoutDashboard },
    { name: 'Digital Ticketing', jp: 'デジタルチケット管理', path: '/ticketing', icon: Ticket },
    { name: 'QR Turnstile Scanner', jp: 'QR入園スキャナー', path: '/scanner', icon: QrCode },
    { name: 'Attractions Control', jp: 'アトラクション運行管理', path: '/attractions', icon: Layers },
    { name: 'AI Wait Predictor', jp: 'AI待ち時間予測', path: '/predictions', icon: Sparkles },
    { name: 'Visitor Analytics', jp: '来園者動態分析', path: '/analytics', icon: BarChart3 },
    { name: 'AI Demand Forecast', jp: '7日間来園者予測', path: '/forecasting', icon: TrendingUp },
    { name: 'Revenue Analytics', jp: '売上収益インサイト', path: '/revenue', icon: DollarSign },
    { name: 'AI Decision Engine', jp: 'AI業務最適化レコメンド', path: '/recommendations', icon: Sparkles },
    { name: 'Automated Reports', jp: '帳票・レポート出力', path: '/reports', icon: FileText },
    ...(isAdmin ? [{ name: 'Staff & Security', jp: '権限・監査ログ', path: '/users', icon: Shield }] : []),
  ];

  return (
    <aside className="w-64 bg-[#0d1322] border-r border-slate-800 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-900/30">
              <span className="text-white font-black text-xl tracking-tighter">富士</span>
            </div>
            <div>
              <div className="font-bold text-white text-base tracking-wide flex items-center gap-1.5">
                SmartPark AI
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">DX</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Fuji-Q Highland Ops</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-190px)]">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-500">
            Operations & Analytics
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-gradient-to-r from-rose-600/20 to-indigo-600/10 text-white border border-rose-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-rose-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <div className="flex flex-col">
                      <span className="leading-tight">{item.name}</span>
                      <span className="text-[10px] text-slate-500 group-hover:text-slate-400 leading-tight">{item.jp}</span>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Status Bar & Logout */}
      <div className="p-4 border-t border-slate-800/80 bg-[#090d16]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center font-bold text-xs text-slate-200">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Operator'}</p>
              <span className={`inline-block text-[10px] uppercase px-1.5 py-0.2 rounded font-mono ${user?.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'}`}>
                {user?.role || 'staff'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
