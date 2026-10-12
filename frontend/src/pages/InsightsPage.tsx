import React, { useState, useEffect } from 'react';
import { AnalyticsSummary } from '../types';
import { api } from '../services/api';
import { BarChart3, TrendingUp, AlertCircle, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export const InsightsPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<string>('last_7_days');
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalyticsSummary(timeframe);
      setSummary(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timeframe]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Nine
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <BarChart3 size={22} className="text-indigo-600 dark:text-indigo-400" />
            <span>Life Insights & Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deterministic calculations operating on real database records. No invented metrics.
          </p>
        </div>

        {/* Timeframe Pill Selector */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs font-medium">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'last_7_days', label: 'Last 7 Days' },
            { id: 'last_30_days', label: 'Last 30 Days' },
          ].map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-3 py-1.5 rounded-md transition ${
                timeframe === tf.id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Bar Chart: Plan vs Reality */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Plan vs. Reality Duration Variance ({summary?.date_range_label})
        </h2>
        <div className="h-72 w-full">
          {summary?.plan_vs_reality && summary.plan_vs_reality.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.plan_vs_reality}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="category_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                <Bar dataKey="planned_minutes" name="Planned (mins)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual_minutes" name="Recorded (mins)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No recorded variance data available for this timeframe.
            </div>
          )}
        </div>
      </div>

      {/* Evidence-Backed Patterns Section */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Synthesized Pattern Observations</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {summary?.patterns && summary.patterns.length > 0 ? (
            summary.patterns.map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-900 dark:text-white">{p.title}</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {p.confidence} confidence
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">{p.observation}</p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Evidence: </span>
                  {p.evidence}
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-[11px] text-indigo-800 dark:text-indigo-300">
                  <span className="font-semibold">Suggested Action: </span>
                  {p.suggested_action}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-xs text-slate-400">
              Collecting more daily entries to extract reliable weekly patterns.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
