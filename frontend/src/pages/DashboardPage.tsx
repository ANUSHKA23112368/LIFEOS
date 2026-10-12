import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AnalyticsSummary,
  Activity,
  Task,
  Habit,
  Goal,
  CategoryItem
} from '../types';
import { api } from '../services/api';
import {
  Clock,
  CheckCircle2,
  Timer,
  Flame,
  Target,
  Sparkles,
  Plus,
  Play,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ActivityModal } from '../components/timeline/ActivityModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const todayStr = new Date().toISOString().substring(0, 10);
  const categories: CategoryItem[] = user?.preferences?.custom_categories || [];

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumData, taskData, habitData, goalData] = await Promise.all([
        api.getAnalyticsSummary('today'),
        api.getTasks(),
        api.getHabits(),
        api.getGoals(),
      ]);
      setSummary(sumData);
      setTasks(taskData);
      setHabits(habitData);
      setGoals(goalData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const primaryGoal = goals.find((g) => g.status === 'active');
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* A. Welcome Panel */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Life Overview Dashboard
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            {greeting()}, {user?.name || 'Explorer'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {primaryGoal
              ? `Primary Goal Focus: "${primaryGoal.title}" (${primaryGoal.calculated_progress}% progress)`
              : 'Review your day, compare your plans against reality, and capture deep insights.'}
          </p>
        </div>

        {/* Quick Actions Cluster */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/journal')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <BookOpen size={14} />
            <span>Write Journal</span>
          </button>
          <button
            onClick={() => navigate('/daily-summary')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition"
          >
            <Sparkles size={14} />
            <span>Daily Summary</span>
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <Plus size={14} />
            <span>Log Activity</span>
          </button>
          <button
            onClick={() => navigate('/focus')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <Play size={14} />
            <span>Start Focus</span>
          </button>
        </div>
      </div>

      {/* B. Today's Factual Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Recorded Time</span>
            <Clock size={16} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {Math.floor((summary?.total_recorded_minutes || 0) / 60)}h {(summary?.total_recorded_minutes || 0) % 60}m
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Planned: {Math.floor((summary?.total_planned_minutes || 0) / 60)}h {(summary?.total_planned_minutes || 0) % 60}m
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Tasks Execution</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary?.tasks_completed || 0} / {summary?.tasks_total || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {summary?.task_completion_rate || 0}% Completion Rate
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Focus Duration</span>
            <Timer size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary?.total_focus_minutes || 0}m
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {summary?.completed_focus_sessions || 0} Completed Sessions
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Habits Checked</span>
            <Flame size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {habits.filter((h) => h.completions.some((c) => c.date === todayStr && c.completed)).length} / {habits.length}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Active streak maintained
          </div>
        </div>
      </div>

      {/* C & D. Plan vs Reality & Time Allocation Visuals */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Plan vs Reality Comparison Chart */}
        <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Plan vs. Reality (Duration Variance)</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Minutes planned vs actual minutes recorded</p>
            </div>
            <button onClick={() => navigate('/timeline')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              View Timeline →
            </button>
          </div>

          <div className="h-60 w-full">
            {summary?.plan_vs_reality && summary.plan_vs_reality.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.plan_vs_reality.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="category_name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                  <Bar dataKey="planned_minutes" name="Planned (mins)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual_minutes" name="Recorded (mins)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 text-center p-4">
                <Clock size={28} className="text-slate-300 dark:text-slate-700 mb-2" />
                <span>No planned vs recorded variance data for today yet.</span>
                <span className="text-[11px] text-slate-500 mt-1">Log an activity or load sample data to explore!</span>
              </div>
            )}
          </div>
        </div>

        {/* Time Allocation Category Donut */}
        <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Time Allocation by Category</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Distribution of today's recorded activities</p>
            </div>
            <button onClick={() => navigate('/insights')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Deep Analytics →
            </button>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {summary?.categories && summary.categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.categories}
                    dataKey="minutes"
                    nameKey="category_name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {summary.categories.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 text-center p-4">
                <Target size={28} className="text-slate-300 dark:text-slate-700 mb-2" />
                <span>No activities recorded today yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* F. Evidence-Backed Insights Preview */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Continuous Improvement Observations</h2>
          </div>
          <button onClick={() => navigate('/ai-analyst')} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
            <span>Ask AI Analyst</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {summary?.patterns && summary.patterns.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {summary.patterns.slice(0, 2).map((p) => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">{p.title}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    {p.confidence}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{p.observation}</p>
                <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 text-[11px] text-indigo-800 dark:text-indigo-300">
                  <span className="font-semibold">Suggested Experiment: </span>
                  {p.suggested_action}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-3 text-center">
            Log your daily activities to reveal personalized pattern insights.
          </div>
        )}
      </div>

      {/* Activity Modal */}
      <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        categories={categories}
      />
    </div>
  );
};
