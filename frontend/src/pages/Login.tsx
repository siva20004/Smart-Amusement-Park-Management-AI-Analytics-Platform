import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('admin@fujiq.jp');
  const [password, setPassword] = useState<string>('Admin@FujiQ2026!');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.login(email, password);
      login(data.access_token, data.user);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'staff') => {
    if (role === 'admin') {
      setEmail('admin@fujiq.jp');
      setPassword('Admin@FujiQ2026!');
    } else {
      setEmail('staff@fujiq.jp');
      setPassword('Staff@FujiQ2026!');
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Decorative Mount Fuji Radial Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-rose-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Emblem */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-rose-900/40 border border-white/20">
            <span className="text-white font-black text-2xl tracking-tighter">富士</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              SmartPark AI
              <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                DX
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Fuji-Q Highland – Intelligent Operations & AI Analytics
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-5 backdrop-blur-xl">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Operator Sign-In (認証ログイン)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your corporate credentials to access telemetry consoles.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fujiq.jp"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-rose-900/40 transition-all disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>{loading ? 'Authenticating...' : 'Sign In to Operations Console'}</span>
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-3 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block text-center">
              Demonstration Role Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-center transition-colors"
              >
                <div className="text-xs font-bold text-amber-400">Admin Account</div>
                <div className="text-[10px] text-slate-400 font-mono">admin@fujiq.jp</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-center transition-colors"
              >
                <div className="text-xs font-bold text-indigo-400">Staff Account</div>
                <div className="text-[10px] text-slate-400 font-mono">staff@fujiq.jp</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Fuji Kyuko Co., Ltd. • Amusement Park Digital Transformation Platform
        </p>
      </div>
    </div>
  );
};
