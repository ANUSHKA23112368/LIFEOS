import React, { useState, useEffect } from 'react';
import { Habit } from '../types';
import { api } from '../services/api';
import { Flame, Plus, Check, Trash2 } from 'lucide-react';

export const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('exercise');

  const todayStr = new Date().toISOString().substring(0, 10);

  const loadHabits = async () => {
    try {
      const data = await api.getHabits();
      setHabits(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadHabits();
  }, []);

  const handleCheckin = async (habit: Habit) => {
    const isCompleted = habit.completions.some((c) => c.date === todayStr && c.completed);
    try {
      await api.checkinHabit(habit.id, {
        date: todayStr,
        completed: !isCompleted,
      });
      loadHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.createHabit({
        name: name.trim(),
        category,
        frequency: 'daily',
        start_date: todayStr,
      });
      setName('');
      setShowAdd(false);
      loadHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this habit?')) {
      await api.deleteHabit(id);
      loadHabits();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Six
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Flame size={22} className="text-rose-500" />
            <span>Habit Tracker</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build sustainable daily and weekly consistency without punitive guilt or shame.
          </p>
        </div>

        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
        >
          <Plus size={14} />
          <span>Add Habit</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreateHabit} className="p-4 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <input
            type="text"
            required
            placeholder="Habit name (e.g. Read 20 pages or Evening Meditation)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-xs text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white">
              Save Habit
            </button>
          </div>
        </form>
      )}

      {/* Habit List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map((h) => {
          const isDoneToday = h.completions.some((c) => c.date === todayStr && c.completed);
          return (
            <div key={h.id} className="p-5 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{h.name}</span>
                <button onClick={() => handleDelete(h.id)} className="text-slate-400 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-rose-500 font-semibold">
                  <Flame size={14} />
                  <span>{h.current_streak} Day Streak</span>
                </span>
                <span>{h.completion_rate_7d}% 7D Consistency</span>
              </div>

              <button
                onClick={() => handleCheckin(h)}
                className={`w-full py-2.5 rounded-xl font-semibold text-xs transition flex items-center justify-center gap-2 ${
                  isDoneToday
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Check size={14} />
                <span>{isDoneToday ? 'Checked in Today' : 'Mark as Done Today'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
