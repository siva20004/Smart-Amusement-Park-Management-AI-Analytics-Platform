import React, { useState, useEffect } from 'react';
import {
  Ticket as TicketIcon, Search, Plus, Filter, QrCode,
  CheckCircle, AlertCircle, RefreshCw, X, Eye, Printer, ArrowRight
} from 'lucide-react';
import { Header } from '../components/Header';
import { ticketsApi } from '../services/api';
import type { Ticket } from '../types';
import { useNavigate } from 'react-router-dom';

export const Ticketing: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_email: '',
    visitor_phone: '',
    ticket_type: 'Adult',
    visit_date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await ticketsApi.list({
        search: search || undefined,
        status_filter: statusFilter || undefined,
        ticket_type: typeFilter || undefined,
        limit: 50,
      });
      setTickets(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const newTicket = await ticketsApi.create(formData);
      setShowCreateModal(false);
      setFormData({
        visitor_name: '',
        visitor_email: '',
        visitor_phone: '',
        ticket_type: 'Adult',
        visit_date: new Date().toISOString().split('T')[0],
      });
      setSelectedTicket(newTicket); // Show the newly created ticket QR code immediately
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (ticketId: number, status: string) => {
    if (!window.confirm(`Are you sure you want to mark this ticket as ${status.toUpperCase()}?`)) return;
    try {
      await ticketsApi.updateStatus(ticketId, status);
      fetchTickets();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update ticket status');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Digital Ticket Management"
        subtitle="Issue high-security digital passes with encrypted QR payloads and live admission tracking"
        japaneseTitle="デジタルチケット発券・管理"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        {/* Actions & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search booking ref (FQ-...), visitor name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </form>

          <div className="flex items-center space-x-3 overflow-x-auto pb-1 md:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="">All Statuses</option>
              <option value="valid">Valid (未入園)</option>
              <option value="used">Used (入園済)</option>
              <option value="cancelled">Cancelled (取消)</option>
              <option value="refunded">Refunded (返金)</option>
            </select>

            {/* Ticket Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
            >
              <option value="">All Pass Types</option>
              <option value="Adult">Adult (大人)</option>
              <option value="Child">Child (小人)</option>
              <option value="Family">Family (ファミリー)</option>
              <option value="Group">Group (団体)</option>
              <option value="VIP">VIP Priority (VIPパス)</option>
            </select>

            {/* Create Ticket Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white flex items-center space-x-2 shadow-sm transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Issue New Ticket</span>
            </button>
          </div>
        </div>

        {/* Tickets Grid / Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Issued Passes ({tickets.length} records shown)
            </span>
            <button
              onClick={fetchTickets}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Pass Type</th>
                  <th className="py-3 px-4">Fare (JPY)</th>
                  <th className="py-3 px-4">Visit Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {tickets.map((t) => {
                  const statusColors = {
                    valid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                    used: 'bg-slate-800 text-slate-400 border-slate-700',
                    cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                    refunded: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  }[t.status] || 'bg-slate-800 text-slate-400 border-slate-700';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white flex items-center space-x-2">
                        <QrCode className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.booking_ref}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{t.visitor_name || 'Guest'}</div>
                        <div className="text-[11px] text-slate-500">{t.visitor_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-200">{t.ticket_type}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                        ¥{t.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {t.visit_date}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${statusColors}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center space-x-1 border border-slate-700 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-rose-400" />
                            <span>QR Pass</span>
                          </button>
                          {t.status === 'valid' && (
                            <button
                              onClick={() => handleStatusChange(t.id, 'cancelled')}
                              className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-semibold transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {tickets.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      No matching tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create Ticket */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  <TicketIcon className="w-5 h-5 text-rose-500" />
                  <h3 className="text-base font-bold text-white">Issue Digital Admission Ticket</h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Visitor Full Name (氏名)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kenji Tanaka (田中 健司)"
                    value={formData.visitor_name}
                    onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="visitor@example.com"
                      value={formData.visitor_email}
                      onChange={(e) => setFormData({ ...formData, visitor_email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      placeholder="+81-90-1234-5678"
                      value={formData.visitor_phone}
                      onChange={(e) => setFormData({ ...formData, visitor_phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Ticket Category</label>
                    <select
                      value={formData.ticket_type}
                      onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="Adult">Adult (大人 ¥7,500)</option>
                      <option value="Child">Child (小人 ¥4,500)</option>
                      <option value="Family">Family Pass (ファミリー ¥18,000)</option>
                      <option value="Group">Group Pass (団体 ¥24,000)</option>
                      <option value="VIP">VIP FastPass (VIP優先 ¥14,000)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Visit Date (来園予定日)</label>
                    <input
                      type="date"
                      required
                      value={formData.visit_date}
                      onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700 text-[11px] text-slate-400">
                  Tickets generate an encrypted 2D QR payload readable by the turnstile verification scanner.
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {submitting ? 'Generating Pass...' : 'Confirm & Issue Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Digital QR Pass */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
              {/* Ticket Top Ribbon */}
              <div className="bg-gradient-to-r from-rose-600 to-indigo-600 p-5 text-white flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-rose-200">FUJI-Q HIGHLAND</div>
                  <div className="text-lg font-black tracking-tight mt-0.5">{selectedTicket.ticket_type} PASS</div>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* QR Code Graphic */}
              <div className="p-6 flex flex-col items-center bg-white text-slate-900">
                <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-inner">
                  <img
                    src={selectedTicket.qr_code_data}
                    alt="Ticket QR Code"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <p className="mt-3 font-mono font-bold text-sm tracking-widest text-slate-800">
                  {selectedTicket.booking_ref}
                </p>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">Scan at Gate Turnstile</span>
              </div>

              {/* Ticket Details */}
              <div className="p-5 bg-slate-900 border-t border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Guest Name</span>
                  <span className="font-semibold text-white">{selectedTicket.visitor_name || 'Guest'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Valid Visit Date</span>
                  <span className="font-mono font-semibold text-rose-400">{selectedTicket.visit_date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Admission Fee</span>
                  <span className="font-mono font-bold text-emerald-400">¥{selectedTicket.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Ticket Status</span>
                  <span className="font-mono font-bold uppercase text-white">{selectedTicket.status}</span>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      navigate(`/scanner?ref=${encodeURIComponent(selectedTicket.booking_ref)}`);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center space-x-2 transition-colors shadow-sm"
                  >
                    <span>Test Scan at Turnstile</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
