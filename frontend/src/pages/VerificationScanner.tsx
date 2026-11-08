import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode, CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
  RefreshCw, Scan, History, ArrowRight, Volume2
} from 'lucide-react';
import { Header } from '../components/Header';
import { ticketsApi } from '../services/api';
import type { TicketVerification } from '../types';

export const VerificationScanner: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [inputCode, setInputCode] = useState<string>('');
  const [selectedGate, setSelectedGate] = useState<string>('Main Entrance - Gate 1');
  const [scanning, setScanning] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<TicketVerification | null>(null);
  const [scanHistory, setScanHistory] = useState<TicketVerification[]>([]);

  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setInputCode(refParam);
    }
  }, [searchParams]);

  const handleVerify = async (codeToVerify?: string) => {
    const code = (codeToVerify || inputCode).trim();
    if (!code) {
      alert('Please enter a booking reference or QR code payload.');
      return;
    }

    try {
      setScanning(true);
      const res = await ticketsApi.verify(code, selectedGate);
      setVerificationResult(res);
      setScanHistory((prev) => [res, ...prev.slice(0, 19)]);
    } catch (err: any) {
      console.error(err);
      alert('Network or server error during ticket verification.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Turnstile QR Admission Scanner"
        subtitle="High-speed gate admission terminal with instant duplicate presentation prevention"
        japaneseTitle="入園ゲート QRコード認証ターミナル"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Verification Scanner Console */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Scan className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-wide">Live Turnstile Verification Console</h2>
                    <p className="text-xs text-slate-400">Optical sensor / Optical QR Code Terminal</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-xs text-slate-400 font-semibold">Active Gate:</label>
                  <select
                    value={selectedGate}
                    onChange={(e) => setSelectedGate(e.target.value)}
                    className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="Main Entrance - Gate 1">Main Entrance - Gate 1</option>
                    <option value="Main Entrance - Gate 2">Main Entrance - Gate 2</option>
                    <option value="Highland Resort VIP Gate">Highland Resort VIP Gate</option>
                    <option value="Fujikawaguchiko Gate 3">Fujikawaguchiko Gate 3</option>
                  </select>
                </div>
              </div>

              {/* Input Form */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Scan QR Code or Enter Booking Reference (Booking Ref / QR Payload):
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="e.g. FQ-2026-10023 or paste scanned QR string..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-rose-500 transition-colors"
                  />
                  <button
                    onClick={() => handleVerify()}
                    disabled={scanning}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-rose-900/30 transition-all disabled:opacity-50"
                  >
                    {scanning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>Verify Pass</span>
                  </button>
                </div>
              </div>

              {/* Quick Simulation Shortcuts */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Quick Testing Scenarios:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setInputCode('FQ-2026-10001');
                      handleVerify('FQ-2026-10001');
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-left border border-slate-700 text-xs transition-colors"
                  >
                    <div className="font-semibold text-emerald-400">Scenario 1: Fresh Pass</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">FQ-2026-10001</div>
                  </button>

                  <button
                    onClick={() => {
                      // Repeatedly verifies same code to trigger duplicate guard
                      handleVerify(inputCode || 'FQ-2026-10001');
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-left border border-slate-700 text-xs transition-colors"
                  >
                    <div className="font-semibold text-rose-400">Scenario 2: Duplicate Attempt</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Test Duplicate Guard</div>
                  </button>

                  <button
                    onClick={() => {
                      setInputCode('FQ-INVALID-9999');
                      handleVerify('FQ-INVALID-9999');
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-left border border-slate-700 text-xs transition-colors"
                  >
                    <div className="font-semibold text-amber-400">Scenario 3: Fake QR</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">FQ-INVALID-9999</div>
                  </button>
                </div>
              </div>

              {/* Verification Result Banner */}
              {verificationResult && (
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    verificationResult.status === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : verificationResult.status === 'rejected_duplicate'
                      ? 'bg-rose-500/15 border-rose-500/50 text-rose-200 shadow-xl shadow-rose-950/40'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    {verificationResult.status === 'success' ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    ) : verificationResult.status === 'rejected_duplicate' ? (
                      <XCircle className="w-8 h-8 text-rose-500 shrink-0 animate-pulse" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
                    )}

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black tracking-wide uppercase">
                          {verificationResult.status === 'success'
                            ? '✓ Gate Open: Admission Granted'
                            : verificationResult.status === 'rejected_duplicate'
                            ? '✕ SECURITY ALERT: Duplicate Ticket Usage Blocked'
                            : '✕ Verification Failed'}
                        </span>
                        <span className="font-mono text-xs opacity-75">
                          {new Date(verificationResult.verification_time).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-xs leading-relaxed font-medium">
                        {verificationResult.message}
                      </p>

                      {/* Duplicate Specific Warning */}
                      {verificationResult.status === 'rejected_duplicate' && (
                        <div className="mt-3 p-3 rounded-xl bg-black/40 border border-rose-500/30 space-y-1 text-xs">
                          <div className="text-rose-400 font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Anti-Passback Duplicate Rule Triggered</span>
                          </div>
                          <p className="text-slate-300 text-[11px]">
                            This QR code was previously admitted at{' '}
                            <span className="font-mono text-amber-300 font-bold">
                              {verificationResult.previous_verification_time
                                ? new Date(verificationResult.previous_verification_time).toLocaleTimeString()
                                : 'earlier today'}
                            </span>
                            . Duplicate admissions are logged in the security audit trail.
                          </p>
                        </div>
                      )}

                      {/* Ticket Details */}
                      {verificationResult.ticket && (
                        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Pass Type</span>
                            <span className="font-bold text-white">{verificationResult.ticket.ticket_type}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Guest Name</span>
                            <span className="font-semibold text-white">{verificationResult.ticket.visitor_name || 'Guest'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Gate ID</span>
                            <span className="font-semibold text-white">{verificationResult.gate_id}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Booking Ref</span>
                            <span className="font-mono font-bold text-rose-300">{verificationResult.ticket.booking_ref}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Turnstile Architecture & Scan History */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <History className="w-4 h-4 text-slate-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Recent Scan Telemetry Log
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Live Feed
                </span>
              </div>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {scanHistory.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-start justify-between text-xs hover:bg-slate-800/80 transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.status === 'success'
                              ? 'bg-emerald-400'
                              : item.status === 'rejected_duplicate'
                              ? 'bg-rose-500'
                              : 'bg-amber-400'
                          }`}
                        ></span>
                        <span className="font-mono font-bold text-white">
                          {item.ticket?.booking_ref || 'UNKNOWN'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            item.status === 'success'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : item.status === 'rejected_duplicate'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.gate_id}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(item.verification_time).toLocaleTimeString()}
                    </span>
                  </div>
                ))}

                {scanHistory.length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-xs">
                    No scans performed yet in this session.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
