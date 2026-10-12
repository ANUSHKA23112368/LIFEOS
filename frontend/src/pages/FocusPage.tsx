import React, { useState, useEffect } from 'react';
import { FocusTimerWidget } from '../components/focus/FocusTimerWidget';
import { FocusSession } from '../types';
import { api } from '../services/api';
import { Timer, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const FocusPage: React.FC = () => {
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  const loadSessions = async () => {
    try {
      const data = await api.getFocusSessions();
      setSessions(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Module Five
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
          <Timer size={22} className="text-indigo-600 dark:text-indigo-400" />
          <span>Focus Tracker</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Timestamp-resilient focus timer with interruption tracking and automatic timeline conversion.
        </p>
      </div>

      {/* Focus Timer Widget */}
      <FocusTimerWidget onSessionFinished={loadSessions} />

      {/* Recent Sessions History */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Recent Completed Sessions</h2>
        <div className="space-y-2.5">
          {sessions.length > 0 ? (
            sessions.slice(0, 5).map((s) => (
              <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">{s.notes || 'Focus sprint'}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {s.actual_duration_minutes} minutes • {s.interruptions} interruptions
                    {s.reflection && ` • "${s.reflection}"`}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  {s.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No completed sessions logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
