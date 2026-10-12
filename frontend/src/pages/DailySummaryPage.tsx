import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DailySummary } from '../types';
import {
  Sparkles,
  Calendar,
  Save,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Flame,
  CheckSquare,
  BookOpen,
  Award,
  ListTodo,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  Edit3
} from 'lucide-react';

export const DailySummaryPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isSavedInDb, setIsSavedInDb] = useState<boolean>(false);

  // Editable fields
  const [overview, setOverview] = useState<string>('');
  const [reflection, setReflection] = useState<string>('');
  const [priorities, setPriorities] = useState<string[]>([]);
  const [newPriority, setNewPriority] = useState<string>('');

  const loadSummaryForDate = async (date: string) => {
    try {
      setLoading(true);
      setSaveStatus('');
      // Check if already saved
      const savedRes = await api.getSavedDailySummary(date);
      if (savedRes.saved && savedRes.summary) {
        setSummary(savedRes.summary);
        setOverview(savedRes.summary.overview);
        setReflection(savedRes.summary.user_reflection || '');
        setPriorities(savedRes.summary.priorities_for_tomorrow || []);
        setIsSavedInDb(true);
      } else {
        // Auto-generate preview from database records
        await handleGenerate(date);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (date = selectedDate) => {
    try {
      setGenerating(true);
      const generated = await api.generateDailySummary(date);
      setSummary(generated);
      setOverview(generated.overview);
      setReflection(generated.user_reflection || '');
      setPriorities(generated.priorities_for_tomorrow || []);
      setIsSavedInDb(false);
      setSaveStatus('Generated from database records (unsaved draft)');
    } catch (e) {
      console.error(e);
      setSaveStatus('Error generating summary');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadSummaryForDate(selectedDate);
  }, [selectedDate]);

  const handleSave = async () => {
    if (!summary) return;
    try {
      setSaving(true);
      const payload: Partial<DailySummary> = {
        ...summary,
        overview,
        user_reflection: reflection,
        priorities_for_tomorrow: priorities
      };
      const saved = await api.saveDailySummary(payload);
      setSummary(saved);
      setIsSavedInDb(true);
      setSaveStatus(`Saved successfully (Version ${saved.version})`);
    } catch (e) {
      console.error(e);
      setSaveStatus('Failed to save summary');
    } finally {
      setSaving(false);
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const md = await api.exportDailySummaryMarkdown(selectedDate);
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LIFEOS_Daily_Summary_${selectedDate}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Please save the summary first before exporting.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Automated Synthesis & Review
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Sparkles size={24} className="text-indigo-600 dark:text-indigo-400" />
            <span>Daily Life Summary</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Intelligent daily debrief synthesized directly from your verified diary entries, timeline activities, completed tasks, focus sessions, and habits.
          </p>
        </div>

        {/* Date Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - 1);
                setSelectedDate(prev.toISOString().split('T')[0]);
              }}
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <ChevronLeft size={14} />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold font-mono px-2 text-slate-900 dark:text-white border-none focus:outline-hidden"
            />
            <button
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + 1);
                setSelectedDate(next.toISOString().split('T')[0]);
              }}
              className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <RotateCcw size={13} className={generating ? 'animate-spin' : ''} />
            <span>{generating ? 'Regenerating...' : 'Regenerate'}</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <Download size={13} />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Save size={14} />
            <span>{saving ? 'Saving...' : 'Save Summary'}</span>
          </button>
        </div>
      </div>

      {/* Save Status Banner */}
      {saveStatus && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
          isSavedInDb
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
        }`}>
          <div className="flex items-center gap-2">
            {isSavedInDb ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span className="font-semibold">{saveStatus}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {isSavedInDb ? 'Permanently stored in database' : 'Click Save Summary to persist'}
          </span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 bg-white dark:bg-[#111625] rounded-2xl border border-slate-200 dark:border-slate-800">
          Synthesizing daily life records from database...
        </div>
      ) : summary?.is_sparse_data ? (
        <div className="p-8 text-center bg-white dark:bg-[#111625] rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <AlertCircle size={28} className="mx-auto text-amber-500" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Limited Recorded Information for {selectedDate}</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No diary entries, timeline activities, completed tasks, or focus sessions were logged on this date.
            LIFEOS does not invent fictional events. Log activities or write a journal entry to generate an executive summary.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Section 1: Overview of the Day (Editable) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>1. Overview of the Day</span>
              </h2>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Deterministic Synthesis (Editable)</span>
            </div>
            <textarea
              rows={3}
              value={overview}
              onChange={(e) => setOverview(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Section 2: Plan vs Reality Variance & Focus Time */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                <span>Plan vs. Reality Variance</span>
              </h3>
              <p className="text-xs font-mono p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                {summary?.variance_analysis || 'No planned activities logged for comparison'}
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                <span>Deep Focus Time</span>
              </h3>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {summary?.focus_time_minutes || 0} minutes
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Across {summary?.focus_sessions_count || 0} dedicated sprint session{summary?.focus_sessions_count === 1 ? '' : 's'}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  Flow State
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Important Events & Timeline Records */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" />
              <span>Important Events & Timeline Records ({summary?.important_events.length || 0})</span>
            </h3>
            {summary?.important_events && summary.important_events.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {summary.important_events.map((e, idx) => (
                  <li key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400 italic">No events or timeline logs recorded.</p>
            )}
          </div>

          {/* Section 4: Main Accomplishments & Tasks */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award size={16} className="text-amber-500" />
                <span>Main Accomplishments</span>
              </h3>
              {summary?.main_accomplishments && summary.main_accomplishments.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {summary.main_accomplishments.map((a, idx) => (
                    <li key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific accomplishments logged.</p>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare size={16} className="text-blue-500" />
                <span>Tasks Execution</span>
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Completed ({summary?.tasks_completed.length || 0})
                  </span>
                  {summary?.tasks_completed && summary.tasks_completed.length > 0 ? (
                    <ul className="space-y-1">
                      {summary.tasks_completed.map((t, idx) => (
                        <li key={idx} className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic">No tasks marked complete today.</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Remaining Incomplete ({summary?.tasks_incomplete.length || 0})
                  </span>
                  <ul className="space-y-1 text-slate-500">
                    {summary?.tasks_incomplete.map((t, idx) => (
                      <li key={idx}>• {t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Habits & Lessons Learned */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame size={16} className="text-rose-500" />
                <span>Habits Recorded</span>
              </h3>
              {summary?.habits_recorded && summary.habits_recorded.length > 0 ? (
                <div className="space-y-1.5 text-xs">
                  {summary.habits_recorded.map((h, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-white">{h.name}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[11px] font-bold">
                        {h.value} {h.unit} ({h.status})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No habit check-ins logged for this date.</p>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-500" />
                <span>Lessons & Ideas Learned</span>
              </h3>
              {summary?.lessons_and_ideas && summary.lessons_and_ideas.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  {summary.lessons_and_ideas.map((l, idx) => (
                    <li key={idx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/30 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific lessons logged in journal.</p>
              )}
            </div>
          </div>

          {/* Section 6: User's Own Personal Reflection (Editable) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 size={16} className="text-indigo-600 dark:text-indigo-400" />
                <span>User's Personal Reflection</span>
              </h3>
              <span className="text-[10px] text-slate-400">User Written</span>
            </div>
            <textarea
              rows={3}
              placeholder="Write your final thoughts, honest reflections, or feelings about today..."
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Section 7: Priorities for Tomorrow (Editable) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ListTodo size={16} className="text-emerald-500" />
              <span>Priorities for Tomorrow</span>
            </h3>
            <div className="space-y-1.5">
              {priorities.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">#{idx + 1}: {p}</span>
                  <button
                    onClick={() => setPriorities(priorities.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-500 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Add priority for tomorrow..."
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPriority.trim()) {
                    setPriorities([...priorities, newPriority.trim()]);
                    setNewPriority('');
                  }
                }}
                className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              />
              <button
                onClick={() => {
                  if (newPriority.trim()) {
                    setPriorities([...priorities, newPriority.trim()]);
                    setNewPriority('');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold"
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
