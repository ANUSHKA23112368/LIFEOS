import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Task, Activity, CategoryItem } from '../types';
import { api } from '../services/api';
import {
  CalendarCheck,
  AlertTriangle,
  Clock,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { ActivityModal } from '../components/timeline/ActivityModal';

export const PlannerPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plannedActivities, setPlannedActivities] = useState<Activity[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedActivityForEdit, setSelectedActivityForEdit] = useState<Activity | null>(null);
  const [activeTaskForBlock, setActiveTaskForBlock] = useState<Task | null>(null);

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
  const totalPlannedMinutes = plannedActivities.reduce(
    (acc, a) => acc + (a.duration_minutes || 0),
    0
  );
  const availableMinutes = 16 * 60; // 960m
  const isOverloaded = totalPlannedMinutes > 14 * 60; // over 14h of scheduled blocks is unrealistic

  // Detect overlapping planned blocks
  const conflicts: {
    id1: string;
    title1: string;
    id2: string;
    title2: string;
    duration: number;
  }[] = [];
  const sortedPlanned = [...plannedActivities].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  for (let i = 0; i < sortedPlanned.length; i++) {
    for (let j = i + 1; j < sortedPlanned.length; j++) {
      const start1 = new Date(sortedPlanned[i].start_time).getTime();
      const end1 = new Date(sortedPlanned[i].end_time).getTime();
      const start2 = new Date(sortedPlanned[j].start_time).getTime();
      const end2 = new Date(sortedPlanned[j].end_time).getTime();
      if (start2 < end1) {
        const overlapMs = Math.min(end1, end2) - Math.max(start1, start2);
        const overlapMins = Math.floor(overlapMs / 60000);
        if (overlapMins > 0) {
          conflicts.push({
            id1: sortedPlanned[i].id,
            title1: sortedPlanned[i].title,
            id2: sortedPlanned[j].id,
            title2: sortedPlanned[j].title,
            duration: overlapMins,
          });
        }
      }
    }
  }

  // Next recommended start time based on existing blocks
  const getNextSuggestedStartTime = () => {
    if (sortedPlanned.length === 0) return '09:00';
    const lastBlock = sortedPlanned[sortedPlanned.length - 1];
    return lastBlock.end_time.substring(11, 16);
  };

  const handleOpenAddModal = () => {
    setSelectedActivityForEdit(null);
    setActiveTaskForBlock(null);
    setModalOpen(true);
  };

  const handleScheduleTask = (task: Task) => {
    setSelectedActivityForEdit(null);
    setActiveTaskForBlock(task);
    setModalOpen(true);
  };

  const handleEditActivity = (act: Activity) => {
    setSelectedActivityForEdit(act);
    setActiveTaskForBlock(null);
    setModalOpen(true);
  };

  const handleConvertToActual = async (act: Activity) => {
    try {
      await api.convertActivityToActual(act.id);
      await loadData();
    } catch (e) {
      console.error('Failed to convert activity to actual:', e);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (confirm('Delete this scheduled block?')) {
      try {
        await api.deleteActivity(id);
        await loadData();
      } catch (e) {
        console.error('Failed to delete activity:', e);
      }
    }
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
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Plus size={14} />
            <span>Add Planned Block</span>
          </button>
        </div>
      </div>

      {/* Schedule Conflicts Alert Banner */}
      {conflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert size={16} className="text-amber-500" />
            <span>Schedule Collision Detected ({conflicts.length} Overlap{conflicts.length > 1 ? 's' : ''})</span>
          </div>
          <div className="space-y-1 text-xs">
            {conflicts.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>
                  <strong>"{c.title1}"</strong> overlaps with <strong>"{c.title2}"</strong> by{' '}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{c.duration} minutes</span>.
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            {sortedPlanned.length > 0 ? (
              sortedPlanned.map((act) => {
                const isConflicted = conflicts.some((c) => c.id1 === act.id || c.id2 === act.id);
                return (
                  <div
                    key={act.id}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-3 ${
                      isConflicted
                        ? 'border-amber-400/80 bg-amber-50/50 dark:bg-amber-950/20'
                        : 'border-dashed border-indigo-300 dark:border-indigo-700/80 bg-indigo-50/40 dark:bg-indigo-950/20'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                          {act.title}
                        </span>
                        {isConflicted && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                            Conflict
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                        <Clock size={12} />
                        <span>
                          {act.start_time.substring(11, 16)} - {act.end_time.substring(11, 16)} ({act.duration_minutes}m)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleConvertToActual(act)}
                        title="Mark as completed actual activity"
                        className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                      <button
                        onClick={() => handleEditActivity(act)}
                        title="Edit planned block"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(act.id)}
                        title="Delete block"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-slate-400 text-center py-8">
                No planned blocks for this date yet. Click "Add Planned Block" or time-block a task from the queue.
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
                .slice(0, 7)
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
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition"
                    >
                      <Sparkles size={12} />
                      <span>Time-block</span>
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
        onClose={() => {
          setModalOpen(false);
          setSelectedActivityForEdit(null);
          setActiveTaskForBlock(null);
        }}
        onSaved={loadData}
        activityToEdit={selectedActivityForEdit}
        defaultDate={selectedDate}
        defaultStartTime={getNextSuggestedStartTime()}
        defaultRecordType="planned"
        initialTitle={activeTaskForBlock?.title}
        initialCategory={activeTaskForBlock?.category || 'deep_work'}
        initialTaskId={activeTaskForBlock?.id}
        initialDurationMinutes={activeTaskForBlock?.estimated_duration_minutes || 60}
        categories={categories}
      />
    </div>
  );
};

