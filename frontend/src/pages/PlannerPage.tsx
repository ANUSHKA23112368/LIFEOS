import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task, Activity, CategoryItem } from '../types';
import { api } from '../services/api';
import { CalendarCheck, AlertTriangle, Clock, Plus, CheckCircle, ArrowRight } from 'lucide-react';
import { ActivityModal } from '../components/timeline/ActivityModal';

export const PlannerPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plannedActivities, setPlannedActivities] = useState<Activity[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const categories: CategoryItem[] = user?.preferences?.custom_categories || [];

  const loadData = async () => {
    try {
      const [allTasks, acts] = await Promise.all([
        api.getTasks(),
        api.getActivities({ date: selectedDate, record_type: 'planned' }),
      ]);
      setTasks(allTasks);
      setPlannedActivities(acts);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Compute workload vs available hours
  // Available waking hours = ~16 hours = 960 mins
  const totalPlannedMinutes = plannedActivities.reduce((acc, a) => acc + (a.duration_minutes || 0), 0);
  const availableMinutes = 16 * 60; // 960m
  const isOverloaded = totalPlannedMinutes > 14 * 60; // over 14h of scheduled blocks is unrealistic

  const handleScheduleTask = async (task: Task) => {
    // Open modal to schedule block
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Three
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck size={22} className="text-indigo-600 dark:text-indigo-400" />
            <span>Smart Daily Planner</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build realistic schedules. Catch overcommitments and scheduling conflicts before your day begins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Plus size={14} />
            <span>Add Planned Block</span>
          </button>
        </div>
      </div>

      {/* Capacity & Workload Balance Gauge */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>Schedule Capacity & Workload Meter</span>
          <span>
            {Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m planned of {availableMinutes / 60}h waking window
          </span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverloaded ? 'bg-amber-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, (totalPlannedMinutes / availableMinutes) * 100)}%` }}
          />
        </div>

        {isOverloaded && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>
              <strong>Potential Schedule Overcommitment:</strong> You have planned more than 14 hours of activities. Consider deferring non-urgent tasks to avoid cognitive exhaustion.
            </span>
          </div>
        )}
      </div>

      {/* Planned Schedule Blocks Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Planned Blocks for Date */}
        <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Scheduled Blocks ({plannedActivities.length})</span>
            <span className="text-xs text-indigo-500 font-normal">{selectedDate}</span>
          </h2>

          <div className="space-y-2.5">
            {plannedActivities.length > 0 ? (
              plannedActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-700/80 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white">{act.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Clock size={12} />
                      <span>{act.start_time.substring(11, 16)} - {act.end_time.substring(11, 16)} ({act.duration_minutes}m)</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    Planned
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-8">
                No planned blocks for this date yet. Click "Add Planned Block" to build your day.
              </div>
            )}
          </div>
        </div>

        {/* Unscheduled Task Queue */}
        <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Pending Tasks Queue</span>
            <span className="text-xs text-slate-500 font-normal">Ready to time-block</span>
          </h2>

          <div className="space-y-2.5">
            {tasks.filter((t) => t.status !== 'completed').length > 0 ? (
              tasks
                .filter((t) => t.status !== 'completed')
                .slice(0, 5)
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 dark:text-white">{task.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Est: {task.estimated_duration_minutes}m • Priority: {task.priority}
                      </div>
                    </div>
                    <button
                      onClick={() => handleScheduleTask(task)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition"
                    >
                      Time-block
                    </button>
                  </div>
                ))
            ) : (
              <div className="text-xs text-slate-400 text-center py-8">
                All tasks scheduled or completed!
              </div>
            )}
          </div>
        </div>
      </div>

      <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
        defaultDate={selectedDate}
        categories={categories}
      />
    </div>
  );
};
