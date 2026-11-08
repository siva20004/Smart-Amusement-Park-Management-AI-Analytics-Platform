import React, { useState, useEffect } from 'react';
import {
  FileText, Download, FileSpreadsheet, Plus, RefreshCw, CheckCircle2
} from 'lucide-react';
import { Header } from '../components/Header';
import { reportsApi } from '../services/api';
import type { ReportItem } from '../types';

export const Reports: React.FC = () => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [reportType, setReportType] = useState<string>('daily_ops');
  const [fileFormat, setFileFormat] = useState<string>('pdf');
  const [generating, setGenerating] = useState<boolean>(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.list();
      setReports(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const newReport = await reportsApi.generate(reportType, fileFormat);
      fetchReports();
      // Auto open download
      window.open(reportsApi.getDownloadUrl(newReport.id), '_blank');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Automated Operations & Financial Reports"
        subtitle="Generate executive audit reports in PDF, XLSX spreadsheet, and CSV formats"
        japaneseTitle="業務・財務レポート自動生成"
      />

      <main className="p-6 space-y-6 flex-1 max-w-[1600px] w-full mx-auto">
        {/* Generator Form Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
            <FileSpreadsheet className="w-5 h-5 text-rose-500" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Generate New Operational Document
            </h2>
          </div>

          <form onSubmit={handleGenerate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Report Category</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="daily_ops">Daily Operations Summary (日次運行報告)</option>
                <option value="weekly_visitors">Weekly Visitor Admissions Log (週次入園分析)</option>
                <option value="monthly_revenue">Monthly Revenue & Financial Audit (月次売上監査)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Output Format</label>
              <select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
              >
                <option value="pdf">Adobe PDF Document (.pdf)</option>
                <option value="xlsx">Microsoft Excel Spreadsheet (.xlsx)</option>
                <option value="csv">Standard CSV Telemetry (.csv)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={generating}
                className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-sm transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{generating ? 'Compiling Document...' : 'Generate & Download'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Existing Reports Archive Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Generated Reports Archive ({reports.length} files)
            </h3>
            <button
              onClick={fetchReports}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090d16] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Document Title</th>
                  <th className="py-3 px-4">Report Type</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Created Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-rose-400" />
                      <span>{rep.title}</span>
                    </td>
                    <td className="py-3 px-4 capitalize font-mono text-slate-400">
                      {rep.report_type.replace('_', ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold uppercase text-indigo-400">
                      {rep.file_format}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(rep.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <a
                        href={reportsApi.getDownloadUrl(rep.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold inline-flex items-center space-x-1 border border-slate-700 transition-colors"
                      >
                        <Download className="w-3 h-3 text-emerald-400" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No reports generated yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
