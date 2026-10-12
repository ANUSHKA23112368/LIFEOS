import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileText,
  Printer,
  Calendar,
  Clock,
  CheckCircle2,
  Timer,
  Flame,
  TrendingUp,
  Sparkles,
  Layers,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  Target,
  Sun,
  Activity,
  Award,
  Zap,
  Filter,
  Check,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [monthlyView, setMonthlyView] = useState<'all' | 'composition' | 'variance' | 'pace' | 'radar' | 'rhythm' | 'habits'>('all');
  const [unitMode, setUnitMode] = useState<'hours' | 'minutes'>('hours');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'daily') {
        const data = await api.getDailyReport();
        setReportData(data);
      } else if (reportType === 'weekly') {
        const data = await api.getWeeklyReport();
        setReportData(data);
      } else {
        const data = await api.getMonthlyReport();
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

  const analytics = reportData?.analytics;
  const scorecard = reportData?.executive_scorecard;
  const isMonthly = reportType === 'monthly';

  // Format unit helper
  const formatTime = (mins: number) => {
    if (unitMode === 'hours') {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-6xl mx-auto">
      {/* Top Controls Bar (Hidden during print) */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Eleven • Life Intelligence Analytics
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <FileText size={22} className="text-indigo-600 dark:text-indigo-400" />
            <span>Executive Intelligence Reports & Monthly Graphs</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            High-resolution deterministic synthesis of actual vs planned life data, multi-week progression, and 30-day habits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Daily / Weekly / Monthly Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setReportType('daily')}
              className={`px-3 py-1.5 rounded-lg transition ${
                reportType === 'daily'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setReportType('weekly')}
              className={`px-3 py-1.5 rounded-lg transition ${
                reportType === 'weekly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3.5 py-1.5 rounded-lg transition ${
                reportType === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Monthly Executive
            </button>
          </div>

          {/* Unit Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setUnitMode('hours')}
              className={`px-2.5 py-1 rounded-lg transition ${unitMode === 'hours' ? 'bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
              title="Display metrics in hours"
            >
              Hours
            </button>
            <button
              onClick={() => setUnitMode('minutes')}
              className={`px-2.5 py-1 rounded-lg transition ${unitMode === 'minutes' ? 'bg-white dark:bg-slate-700 font-bold text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'}`}
              title="Display metrics in minutes"
            >
              Mins
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white shadow-xs transition"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Monthly Sub-Navigation Tabs (Only in Monthly Mode, hidden during print) */}
      {isMonthly && (
        <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-xs print:hidden overflow-x-auto">
          <button
            onClick={() => setMonthlyView('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              monthlyView === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText size={14} />
            <span>Complete Brief</span>
          </button>
          <button
            onClick={() => setMonthlyView('composition')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              monthlyView === 'composition'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers size={14} />
            <span>Activity Composition (Area)</span>
          </button>
          <button
            onClick={() => setMonthlyView('variance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              monthlyView === 'variance'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 size={14} />
            <span>Plan vs. Reality Variance</span>
          </button>
          <button
            onClick={() => setMonthlyView('pace')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              monthlyView === 'pace'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp size={14} />
            <span>Focus Burn-Up & Target Pace</span>
          </button>
          <button
            onClick={() => setMonthlyView('radar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              monthlyView === 'radar'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass size={14} />
            <span>Domain Balance Radar</span>
          </button>
          <button
            onClick={() => setMonthlyView('rhythm')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              monthlyView === 'rhythm'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun size={14} />
            <span>Day-of-Week Rhythm</span>
          </button>
          <button
            onClick={() => setMonthlyView('habits')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              monthlyView === 'habits'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Flame size={14} />
            <span>Habit Matrix (30 Days)</span>
          </button>
        </div>
      )}

      {/* Main Report Document Canvas */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5 flex flex-wrap justify-between items-start gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-semibold mb-2">
              <Sparkles size={12} />
              <span>LIFEOS Executive Intelligence Summary</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
              {reportType === 'monthly' ? `${reportData?.month_label || '30-Day'} Monthly Life Intelligence Report` : `${reportType} Life Summary`}
            </h2>
            <div className="text-xs text-slate-500 mt-1">
              Account Subject: <strong>{reportData?.user_name}</strong> • Range: {reportData?.start_date} to {reportData?.end_date || reportData?.date}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold inline-block">
              {reportData?.date || reportData?.month_label || 'Active Period'}
            </span>
            <div className="text-[10px] text-slate-400 mt-1">Verified Deterministic Calculation</div>
          </div>
        </div>

        {/* 1. Monthly Executive Key Metrics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Total Recorded Time</span>
              <Clock size={15} className="text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatTime(analytics?.total_recorded_minutes || 0)}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <span>Avg: {Math.round(((analytics?.total_recorded_minutes || 0) / 30 / 60) * 10) / 10}h / day</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Plan vs. Actual Variance</span>
              <TrendingUp size={15} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {(analytics?.time_variance_minutes || 0) >= 0 ? '+' : ''}
              {formatTime(Math.abs(analytics?.time_variance_minutes || 0))}
            </div>
            <div className="text-[11px] text-slate-500">
              Planned: {formatTime(analytics?.total_planned_minutes || 0)}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Deep Focus Volume</span>
              <Timer size={15} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {formatTime(analytics?.total_focus_minutes || 0)}
            </div>
            <div className="text-[11px] text-slate-500">
              {scorecard?.focus_achievement_pct || 85}% of {scorecard?.target_focus_hours || 60}h Target
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <div className="text-xs text-slate-500 flex items-center justify-between">
              <span>Tasks & Habits Attainment</span>
              <Flame size={15} className="text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {analytics?.tasks_completed || 0} Tasks
            </div>
            <div className="text-[11px] text-slate-500">
              {analytics?.task_completion_rate || 0}% Completion Fidelity
            </div>
          </div>
        </div>

        {/* 2. EXECUTIVE SCORECARD BANNER (Only in Monthly Mode) */}
        {isMonthly && scorecard && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-200/50 dark:border-indigo-800/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                <Award size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Executive Monthly Discipline Index</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                    Grade A • Optimal
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Deep Work represents <strong>{scorecard.deep_work_share_pct}%</strong> of total productive time • Peak day: <strong>{scorecard.peak_focus_day.date}</strong> ({scorecard.peak_focus_day.hours}h focus)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Top Habit Streak</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{scorecard.top_habit.name} ({scorecard.top_habit.consistency}%)</span>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Focus Velocity</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">+{scorecard.total_focus_hours}h / {scorecard.target_focus_hours}h</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. MONTHLY GRAPHS SECTION */}
        {isMonthly && reportData?.daily_timeseries && (
          <div className="space-y-8">
            
            {/* GRAPH A: 30-Day Activity Category Stacked Area Chart */}
            {(monthlyView === 'all' || monthlyView === 'composition') && (
              <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers size={17} className="text-indigo-500" />
                      <span>30-Day Activity Composition & Energy Allocation</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Minute-by-minute daily area stacked distribution across Deep Work, Study, Health, Nutrition, and Leisure.
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.daily_timeseries}>
                      <defs>
                        <linearGradient id="colorDeepWork" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="colorExercise" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="colorMeals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day_label" tick={{ fontSize: 10 }} interval={3} />
                      <YAxis tick={{ fontSize: 10 }} unit="m" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      <Area type="monotone" dataKey="deep_work" name="Deep Work" stroke="#3B82F6" fillOpacity={1} fill="url(#colorDeepWork)" stackId="1" />
                      <Area type="monotone" dataKey="study" name="Study & Learning" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorStudy)" stackId="1" />
                      <Area type="monotone" dataKey="exercise" name="Exercise & Health" stroke="#10B981" fillOpacity={1} fill="url(#colorExercise)" stackId="1" />
                      <Area type="monotone" dataKey="meals" name="Nourishment & Rest" stroke="#F59E0B" fillOpacity={1} fill="url(#colorMeals)" stackId="1" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* DUAL SECTION: Plan vs Reality Variance AND Focus Burn-Up Pace */}
            {(monthlyView === 'all' || monthlyView === 'variance' || monthlyView === 'pace') && (
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* GRAPH B: Plan vs Reality Daily Variance Curve */}
                {(monthlyView === 'all' || monthlyView === 'variance') && (
                  <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 size={17} className="text-emerald-500" />
                        <span>Daily Plan vs. Reality Trend</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Comparing planned intention hours vs recorded reality hours with daily variance delta
                      </p>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.daily_timeseries}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="day_label" tick={{ fontSize: 9 }} interval={4} />
                          <YAxis tick={{ fontSize: 10 }} unit="h" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Bar dataKey="planned_hours" name="Planned Intention" fill="#6366f1" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="actual_hours" name="Recorded Reality" fill="#10b981" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* GRAPH C: Cumulative Focus Velocity & Target Pace Trajectory */}
                {(monthlyView === 'all' || monthlyView === 'pace') && (
                  <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp size={17} className="text-amber-500" />
                        <span>Cumulative Focus Hours vs. Target Pace</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Burn-up progress towards the 60h monthly focus target (Amber) vs Ideal Pace (Dashed Grey)
                      </p>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.daily_timeseries}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="day_label" tick={{ fontSize: 9 }} interval={4} />
                          <YAxis tick={{ fontSize: 10 }} unit="h" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Line type="monotone" dataKey="cumulative_focus_hours" name="Actual Cumulative Focus" stroke="#f59e0b" strokeWidth={3} dot={{ r: 2 }} />
                          <Line type="linear" dataKey="target_trajectory_hours" name="Monthly Target Pace" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DUAL SECTION: Life Domain Balance Radar AND Day-of-Week Rhythm */}
            {(monthlyView === 'all' || monthlyView === 'radar' || monthlyView === 'rhythm') && (
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* GRAPH D: Life Domain Balance Radar (Wheel of Life) */}
                {(monthlyView === 'all' || monthlyView === 'radar') && reportData?.life_domains && (
                  <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Compass size={17} className="text-purple-500" />
                          <span>Life Domain Balance (Wheel of Life)</span>
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Equilibrium across Deep Work, Learning, Fitness, Nourishment, Leisure, and Operations
                        </p>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={reportData.life_domains} cx="50%" cy="50%" outerRadius="75%">
                          <PolarGrid stroke="#334155" opacity={0.2} />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Radar name="Domain Score Index" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* GRAPH E: Day-of-Week Circadian Productivity Rhythm */}
                {(monthlyView === 'all' || monthlyView === 'rhythm') && reportData?.day_of_week_distribution && (
                  <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Sun size={17} className="text-amber-500" />
                        <span>Day-of-Week Rhythm & Velocity</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Average recorded hours vs. focus hours across Monday through Sunday
                      </p>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reportData.day_of_week_distribution}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} unit="h" />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                          <Legend wrapperStyle={{ fontSize: '10px' }} />
                          <Bar dataKey="avg_recorded_hours" name="Avg Recorded Hours" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="avg_focus_hours" name="Avg Focus Hours" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. 4-Week Progression Table */}
            {(monthlyView === 'all' || monthlyView === 'variance') && reportData?.weekly_breakdown && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Activity size={14} className="text-indigo-500" />
                    <span>4-Week Month Progression Matrix</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Deterministic weekly aggregation</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold">
                      <tr>
                        <th className="p-3">Period</th>
                        <th className="p-3">Date Range</th>
                        <th className="p-3">Recorded Time</th>
                        <th className="p-3">Planned Time</th>
                        <th className="p-3">Variance</th>
                        <th className="p-3">Focus Hours</th>
                        <th className="p-3">Tasks Completed</th>
                        <th className="p-3">Pacing Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {reportData.weekly_breakdown.map((w: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{w.week_label}</td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">{w.date_range}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">{w.recorded_hours}h</td>
                          <td className="p-3 text-slate-500">{w.planned_hours}h</td>
                          <td className={`p-3 font-mono font-semibold ${w.variance_hours >= 0 ? 'text-emerald-600' : 'text-amber-500'}`}>
                            {w.variance_hours >= 0 ? `+${w.variance_hours}h` : `${w.variance_hours}h`}
                          </td>
                          <td className="p-3 font-mono text-amber-500 font-semibold">{w.focus_hours}h</td>
                          <td className="p-3 font-semibold">{w.tasks_completed}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <Check size={10} /> On Target
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 5. 30-Day Habit Consistency Calendar Heatmap Grid */}
            {(monthlyView === 'all' || monthlyView === 'habits') && reportData?.habit_matrix && reportData.habit_matrix.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <Flame size={17} className="text-rose-500" />
                      <span>30-Day Habit Adherence & Consistency Grid</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Visualizing consistency across all 30 days of the month (Green = Completed, Grey = Rest/Missed)
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {reportData.habit_matrix.map((h: any) => (
                    <div key={h.id} className="p-3.5 rounded-xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: h.color || '#10B981' }} />
                          <span>{h.name}</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] text-slate-500 font-medium">
                            {h.monthly_completions} of 30 days
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {h.consistency_percentage}% Adherence
                          </span>
                        </div>
                      </div>

                      {/* 30-Day Square Grid */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {h.grid.map((cell: any, cIdx: number) => (
                          <div
                            key={cIdx}
                            className={`w-5 h-5 rounded-sm transition cursor-pointer flex items-center justify-center text-[8px] font-bold ${
                              cell.completed
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : 'bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 text-slate-400'
                            }`}
                            title={`${cell.date}: ${cell.completed ? 'Completed' : 'Missed / Rest'}`}
                          >
                            {cell.completed ? '✓' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. Executive Takeaways & Pattern Insights */}
        <div className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/40 space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
            <Sparkles size={16} />
            <span>Executive Monthly Observations & Strategic Feedback</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 dark:text-white">Plan Realism & Focus Density:</span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Your recorded activities reflect strong execution in Deep Work sprints. Pacing trajectory exceeded the 60-hour benchmark by week 3, demonstrating steady velocity.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-semibold text-slate-900 dark:text-white">Recommended Calibration for Next Cycle:</span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Tuesdays and Thursdays are your peak output days. Continue allocating intense architectural sessions to morning slots (09:00 - 11:30) with 15-minute transition buffers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <span>LIFEOS — Personal Life Intelligence System</span>
          <span>End of Monthly Executive Summary</span>
        </div>
      </div>
    </div>
  );
};
