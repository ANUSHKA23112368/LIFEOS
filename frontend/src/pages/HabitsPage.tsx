import React, { useState, useEffect } from 'react';
import { Habit, HabitAnalytics } from '../types';
import { api } from '../services/api';
import {
  Flame,
  Plus,
  Check,
  Trash2,
  BarChart2,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Pause,
  Play,
  Archive,
  Edit2,
  X,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Hash
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line
} from 'recharts';

const ALL_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [statusFilter, setStatusFilter] = useState<'active' | 'paused' | 'archived'>('active');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  // Create Habit Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('exercise');
  const [habitType, setHabitType] = useState<'boolean' | 'quantity' | 'duration' | 'count' | 'scheduled'>('boolean');
  const [target, setTarget] = useState<number>(1);
  const [unit, setUnit] = useState('times');
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(ALL_WEEKDAYS);
  const [color, setColor] = useState('#10B981');

  // Active Detail & Analytics State
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [analytics, setAnalytics] = useState<HabitAnalytics | null>(null);
  const [analyticsRange, setAnalyticsRange] = useState<number>(30);
  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);

  // Quantitative Check-in Modal
  const [checkinModalHabit, setCheckinModalHabit] = useState<Habit | null>(null);
  const [checkinValue, setCheckinValue] = useState<number>(1);
  const [checkinNotes, setCheckinNotes] = useState<string>('');
  const [checkinStatus, setCheckinStatus] = useState<string>('completed');

  // Compare Modal
  const [showCompare, setShowCompare] = useState<boolean>(false);
  const [compareHabitId, setCompareHabitId] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<any>(null);

  const todayStr = new Date().toISOString().substring(0, 10);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await api.getHabits(statusFilter);
      setHabits(data);
      if (selectedHabit) {
        const refreshed = data.find((h) => h.id === selectedHabit.id);
        if (refreshed) setSelectedHabit(refreshed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (habitId: string, range = analyticsRange) => {
    try {
      setAnalyticsLoading(true);
      const data = await api.getHabitAnalytics(habitId, range);
      setAnalytics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadHabits();
  }, [statusFilter]);

  useEffect(() => {
    if (selectedHabit) {
      loadAnalytics(selectedHabit.id, analyticsRange);
    }
  }, [selectedHabit?.id, analyticsRange]);

  const handleSimpleCheckin = async (habit: Habit) => {
    if (habit.habit_type !== 'boolean') {
      // Open detailed input modal for measurable habits
      setCheckinModalHabit(habit);
      setCheckinValue(habit.target);
      setCheckinNotes('');
      setCheckinStatus('completed');
      return;
    }

    const isCompleted = habit.completions.some((c) => c.date === todayStr && c.completed);
    try {
      await api.checkinHabit(habit.id, {
        date: todayStr,
        value: !isCompleted ? habit.target : 0,
        completed: !isCompleted,
        status: !isCompleted ? 'completed' : 'confirmed_not_completed'
      });
      loadHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const submitModalCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinModalHabit) return;
    try {
      await api.checkinHabit(checkinModalHabit.id, {
        date: todayStr,
        value: Number(checkinValue),
        completed: checkinStatus !== 'confirmed_not_completed',
        status: checkinStatus,
        notes: checkinNotes
      });
      setCheckinModalHabit(null);
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
        description: description.trim(),
        category,
        habit_type: habitType,
        target: Number(target),
        unit,
        frequency: habitType === 'scheduled' ? 'scheduled' : 'daily',
        selected_weekdays: selectedWeekdays,
        color,
        start_date: todayStr
      });
      setName('');
      setDescription('');
      setShowAdd(false);
      loadHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleWeekday = (wd: string) => {
    if (selectedWeekdays.includes(wd)) {
      if (selectedWeekdays.length > 1) {
        setSelectedWeekdays(selectedWeekdays.filter((d) => d !== wd));
      }
    } else {
      setSelectedWeekdays([...selectedWeekdays, wd]);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'active' | 'paused' | 'archived') => {
    try {
      await api.updateHabit(id, { status: newStatus });
      loadHabits();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this habit permanently?')) {
      await api.deleteHabit(id);
      if (selectedHabit?.id === id) setSelectedHabit(null);
      loadHabits();
    }
  };

  const handleCompare = async () => {
    if (!selectedHabit || !compareHabitId) return;
    try {
      const data = await api.compareHabits(selectedHabit.id, compareHabitId, 30);
      setComparisonData(data);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Six • Habit Intelligence & Consistency
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Flame size={24} className="text-rose-500" />
            <span>Habits & Consistency Tracking</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Deterministic habit logging across Boolean, Quantity, Duration, and Scheduled frequencies with opportunity-based consistency math.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'active'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('paused')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'paused'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Paused
            </button>
            <button
              onClick={() => setStatusFilter('archived')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'archived'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Archived
            </button>
          </div>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Plus size={15} />
            <span>New Habit</span>
          </button>
        </div>
      </div>

      {/* CREATE HABIT FORM MODAL */}
      {showAdd && (
        <form onSubmit={handleCreateHabit} className="p-6 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              <span>Define New Habit</span>
            </h3>
            <button type="button" onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Habit Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Read Non-Fiction, Cold Shower, Practice Coding..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="exercise">Exercise & Health</option>
                <option value="study">Study & Skills</option>
                <option value="deep_work">Deep Work</option>
                <option value="sleep">Rest & Sleep</option>
                <option value="mindset">Mindset & Journaling</option>
                <option value="other">Life Operations</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Habit Type</label>
              <select
                value={habitType}
                onChange={(e) => {
                  const t = e.target.value as any;
                  setHabitType(t);
                  if (t === 'duration') setUnit('minutes');
                  else if (t === 'quantity') setUnit('pages');
                  else if (t === 'count') setUnit('items');
                  else setUnit('times');
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                <option value="boolean">Boolean (Yes / Done)</option>
                <option value="quantity">Quantity (Pages, Glasses, km)</option>
                <option value="duration">Duration (Minutes of practice)</option>
                <option value="count">Count (Problems solved, sets)</option>
                <option value="scheduled">Scheduled Weekdays (Specific days)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Target Value</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Scheduled Weekday Selector */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block">Scheduled Opportunity Days</label>
            <div className="flex flex-wrap gap-2">
              {ALL_WEEKDAYS.map((wd) => {
                const isSelected = selectedWeekdays.includes(wd);
                return (
                  <button
                    key={wd}
                    type="button"
                    onClick={() => handleToggleWeekday(wd)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition text-xs ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {wd}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              Create Habit
            </button>
          </div>
        </form>
      )}

      {/* MAIN TWO-PANE LAYOUT: HABIT LIST & DEDICATED ANALYTICS */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Habits List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
            <span>Tracked Habits ({habits.length})</span>
            <span>Click card to inspect graphs</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading habits...</div>
          ) : habits.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#111625] border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <p className="text-xs text-slate-500">No {statusFilter} habits found.</p>
              <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white">
                Create First Habit
              </button>
            </div>
          ) : (
            habits.map((habit) => {
              const todayEntry = habit.completions.find((c) => c.date === todayStr);
              const isCheckedToday = todayEntry ? todayEntry.completed : false;
              const isSelected = selectedHabit?.id === habit.id;

              return (
                <div
                  key={habit.id}
                  onClick={() => setSelectedHabit(habit)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: habit.color || '#10B981' }} />
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {habit.name}
                      </h3>
                      {habit.habit_type && habit.habit_type !== 'boolean' && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-semibold">
                          {habit.habit_type}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-rose-500">
                        <Flame size={12} /> {habit.current_streak}d streak
                      </span>
                      <span>•</span>
                      <span>{habit.target} {habit.unit}</span>
                      <span>•</span>
                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                        {habit.scheduled_consistency_rate ?? habit.completion_rate_30d}% adherence
                      </span>
                    </div>
                  </div>

                  {/* Checkin Action Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSimpleCheckin(habit);
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition shadow-xs ${
                        isCheckedToday
                          ? 'bg-emerald-500 text-white font-bold'
                          : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-400 hover:border-emerald-500 hover:text-emerald-500'
                      }`}
                      title={isCheckedToday ? `Completed: ${todayEntry?.value} ${habit.unit}` : 'Check-in for today'}
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Dedicated Habit Analytics & Visualization Pane (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedHabit ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
              {/* Habit Details Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedHabit.color || '#10B981' }} />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {selectedHabit.name}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Target: {selectedHabit.target} {selectedHabit.unit} • Frequency: {selectedHabit.frequency}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {/* Status switcher */}
                  {selectedHabit.status === 'active' ? (
                    <button
                      onClick={() => handleUpdateStatus(selectedHabit.id, 'paused')}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 transition flex items-center gap-1"
                      title="Pause habit"
                    >
                      <Pause size={12} /> Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpdateStatus(selectedHabit.id, 'active')}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-emerald-600 hover:bg-slate-100 transition flex items-center gap-1"
                    >
                      <Play size={12} /> Resume
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(selectedHabit.id)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-500 transition"
                    title="Delete habit"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Streak</span>
                  <div className="text-xl font-bold text-rose-500 flex items-center gap-1">
                    <Flame size={16} /> {selectedHabit.current_streak} days
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Longest Streak</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedHabit.longest_streak} days
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Opportunity Adherence</span>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {analytics?.consistency_percentage ?? selectedHabit.completion_rate_30d}%
                  </div>
                </div>
              </div>

              {/* 1. 90-Day Habit Calendar Heatmap */}
              {analytics?.heatmap && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-500" />
                      <span>90-Day Calendar Heatmap Grid</span>
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-emerald-500" /> Achieved</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-purple-500" /> Exceeded</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-xs bg-amber-500" /> Partial</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
                    {analytics.heatmap.map((cell, idx) => {
                      let bg = 'bg-slate-200 dark:bg-slate-800/80';
                      if (cell.state === 'achieved') bg = 'bg-emerald-500 text-white';
                      else if (cell.state === 'exceeded') bg = 'bg-purple-500 text-white';
                      else if (cell.state === 'partial') bg = 'bg-amber-500 text-white';
                      else if (cell.state === 'failed') bg = 'bg-rose-500 text-white';

                      return (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-xs transition cursor-pointer flex items-center justify-center text-[7px] font-bold ${bg}`}
                          title={`${cell.date} (${cell.weekday}): ${cell.value}/${cell.target} ${selectedHabit.unit} [${cell.state}]`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Timeseries Completion Chart */}
              {analytics?.timeseries && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-500" />
                      <span>Actual Recorded Output vs Target ({analyticsRange} Days)</span>
                    </h3>

                    {/* Range switchers */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        onClick={() => setAnalyticsRange(7)}
                        className={`px-2 py-0.5 rounded ${analyticsRange === 7 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400'}`}
                      >
                        7d
                      </button>
                      <button
                        onClick={() => setAnalyticsRange(30)}
                        className={`px-2 py-0.5 rounded ${analyticsRange === 30 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400'}`}
                      >
                        30d
                      </button>
                      <button
                        onClick={() => setAnalyticsRange(90)}
                        className={`px-2 py-0.5 rounded ${analyticsRange === 90 ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs' : 'text-slate-400'}`}
                      >
                        90d
                      </button>
                    </div>
                  </div>

                  <div className="h-56 w-full pt-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.timeseries}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="day_label" tick={{ fontSize: 9 }} interval={analyticsRange > 30 ? 6 : 2} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                        <Bar dataKey="value" name={`Actual (${selectedHabit.unit})`} fill={selectedHabit.color || '#10B981'} radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* 3. Supported Insights */}
              {analytics?.insights && analytics.insights.length > 0 && (
                <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                    <Sparkles size={14} />
                    <span>Deterministic Habit Observations</span>
                  </div>
                  {analytics.insights.map((ins, idx) => (
                    <p key={idx} className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      • {ins}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#111625] border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <BarChart2 size={32} className="mx-auto text-slate-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Select a Habit to View Analytics</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Click any habit on the left to inspect its 90-day calendar heatmap, target vs actual trajectory, and consistency math.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QUANTITATIVE CHECK-IN POPUP MODAL */}
      {checkinModalHabit && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <form onSubmit={submitModalCheckin} className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Log Progress: {checkinModalHabit.name}
                </h3>
                <span className="text-[11px] text-slate-500">Date: {todayStr}</span>
              </div>
              <button type="button" onClick={() => setCheckinModalHabit(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Recorded Output ({checkinModalHabit.unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={checkinValue}
                  onChange={(e) => setCheckinValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-base font-bold"
                />
                <span className="text-[10px] text-slate-400">Target is {checkinModalHabit.target} {checkinModalHabit.unit}</span>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={checkinStatus}
                  onChange={(e) => setCheckinStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="completed">Completed (Target Achieved)</option>
                  <option value="partially_completed">Partially Completed</option>
                  <option value="confirmed_not_completed">Confirmed Missed / Rest</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Optional Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Completed Chapter 5, high energy..."
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCheckinModalHabit(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                Save Progress
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
