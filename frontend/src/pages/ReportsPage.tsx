import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Printer, Calendar } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'daily' | 'weekly'>('daily');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'daily') {
        const data = await api.getDailyReport();
        setReportData(data);
      } else {
        const data = await api.getWeeklyReport();
        setReportData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Eleven
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <FileText size={22} className="text-indigo-600 dark:text-indigo-400" />
            <span>Reports & Documentation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive printable summaries of your time allocation, execution consistency, and daily reflections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setReportType('daily')}
              className={`px-3 py-1.5 rounded-md ${reportType === 'daily' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'}`}
            >
              Daily Report
            </button>
            <button
              onClick={() => setReportType('weekly')}
              className={`px-3 py-1.5 rounded-md ${reportType === 'weekly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold' : 'text-slate-500'}`}
            >
              Weekly Report
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex justify-between items-start">
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white capitalize">
              {reportType} Personal Life Summary
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Prepared for: <strong>{reportData?.user_name}</strong> • Generated on {new Date().toLocaleDateString()}
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {reportData?.date || `${reportData?.start_date} to ${reportData?.end_date}`}
          </span>
        </div>

        {/* Factual Summary Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <div className="text-slate-500">Recorded Activity</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {Math.floor((reportData?.analytics?.total_recorded_minutes || 0) / 60)}h {(reportData?.analytics?.total_recorded_minutes || 0) % 60}m
            </div>
          </div>
          <div>
            <div className="text-slate-500">Tasks Completed</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {reportData?.analytics?.tasks_completed || 0} / {reportData?.analytics?.tasks_total || 0}
            </div>
          </div>
          <div>
            <div className="text-slate-500">Deep Focus Duration</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {reportData?.analytics?.total_focus_minutes || 0}m
            </div>
          </div>
          <div>
            <div className="text-slate-500">Duration Variance</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              {reportData?.analytics?.time_variance_minutes || 0}m
            </div>
          </div>
        </div>

        {/* Categories Breakdown Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Category Allocation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-lg">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold">
                <tr>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Duration (mins)</th>
                  <th className="p-2.5">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportData?.analytics?.categories?.map((cat: any) => (
                  <tr key={cat.category_id}>
                    <td className="p-2.5 font-medium">{cat.category_name}</td>
                    <td className="p-2.5 font-mono">{cat.minutes}m</td>
                    <td className="p-2.5 font-mono">{cat.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Review Quotes if present */}
        {reportData?.review && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Evening Reflection Log</h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-xs space-y-2">
              {reportData.review.accomplishments && (
                <div>
                  <strong>Accomplishments: </strong>
                  <span>{reportData.review.accomplishments}</span>
                </div>
              )}
              {reportData.review.tomorrow_intentions && (
                <div>
                  <strong>Tomorrow Intentions: </strong>
                  <span>{reportData.review.tomorrow_intentions}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
