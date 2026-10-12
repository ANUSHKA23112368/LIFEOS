import React, { useState, useEffect } from 'react';
import { Goal } from '../types';
import { api } from '../services/api';
import { Target, Plus, CheckCircle, Trash2, ArrowRight } from 'lucide-react';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Career');

  const todayStr = new Date().toISOString().substring(0, 10);

  const loadGoals = async () => {
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.createGoal({
        title: title.trim(),
        category,
        start_date: todayStr,
        target_date: todayStr,
        status: 'active',
        milestones: [
          { id: '1', title: 'Phase 1: Foundation', completed: false },
          { id: '2', title: 'Phase 2: Execution', completed: false },
        ],
      });
      setTitle('');
      setShowAdd(false);
      loadGoals();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this goal?')) {
      await api.deleteGoal(id);
      loadGoals();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Seven
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Target size={22} className="text-indigo-600 dark:text-indigo-400" />
            <span>Goals & Personal Growth</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Connect long-term intentions with measurable daily milestones and verified activity hours.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
        >
          <Plus size={14} />
          <span>Add Goal</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="p-4 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <input
            type="text"
            required
            placeholder="Goal title (e.g. Master Full-Stack Architecture)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 text-xs text-slate-500">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white">
              Save Goal
            </button>
          </div>
        </form>
      )}

      {/* Goals List */}
      <div className="grid md:grid-cols-2 gap-4">
        {goals.map((g) => (
          <div key={g.id} className="p-5 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500">{g.category}</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">{g.title}</h3>
              </div>
              <button onClick={() => handleDelete(g.id)} className="text-slate-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Progress</span>
                <span className="font-semibold text-slate-900 dark:text-white">{g.calculated_progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${g.calculated_progress}%` }}
                />
              </div>
            </div>

            {/* Milestones list */}
            {g.milestones.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Milestones</div>
                {g.milestones.map((m) => (
                  <div key={m.id} className="text-xs flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <CheckCircle size={14} className={m.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'} />
                    <span className={m.completed ? 'line-through opacity-70' : ''}>{m.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
