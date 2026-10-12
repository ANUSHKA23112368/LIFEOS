import React, { useState, useEffect } from 'react';
import { Activity, CategoryItem, Task, Goal } from '../../types';
import { X, Clock, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  activityToEdit?: Activity | null;
  defaultDate?: string;
  defaultStartTime?: string;
  defaultEndTime?: string;
  defaultRecordType?: 'actual' | 'planned';
  initialTitle?: string;
  initialCategory?: string;
  initialTaskId?: string;
  initialGoalId?: string;
  initialDurationMinutes?: number;
  categories: CategoryItem[];
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  activityToEdit,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  defaultRecordType,
  initialTitle,
  initialCategory,
  initialTaskId,
  initialGoalId,
  initialDurationMinutes,
  categories,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('deep_work');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [recordType, setRecordType] = useState<'actual' | 'planned'>('actual');
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [linkedTaskId, setLinkedTaskId] = useState<string>('');
  const [linkedGoalId, setLinkedGoalId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load user's tasks & goals for linking
      api.getTasks().then(setTasks).catch(console.error);
      api.getGoals().then(setGoals).catch(console.error);

      if (activityToEdit) {
        setTitle(activityToEdit.title);
        setDescription(activityToEdit.description || '');
        setCategory(activityToEdit.category);
        setDate(activityToEdit.date);
        setStartTime(activityToEdit.start_time.substring(11, 16));
        setEndTime(activityToEdit.end_time.substring(11, 16));
        setRecordType(activityToEdit.record_type);
        setNotes(activityToEdit.notes || '');
        setLinkedTaskId(activityToEdit.linked_task_id || '');
        setLinkedGoalId(activityToEdit.linked_goal_id || '');
      } else {
        const todayStr = defaultDate || new Date().toISOString().substring(0, 10);
        setTitle(initialTitle || '');
        setDescription('');
        setCategory(initialCategory || categories[0]?.id || 'deep_work');
        setDate(todayStr);
        const sTime = defaultStartTime || '09:00';
        setStartTime(sTime);
        if (initialDurationMinutes && initialDurationMinutes > 0) {
          const [h, m] = sTime.split(':').map(Number);
          const totalM = (h || 9) * 60 + (m || 0) + initialDurationMinutes;
          const endH = Math.floor((totalM / 60) % 24).toString().padStart(2, '0');
          const endM = (totalM % 60).toString().padStart(2, '0');
          setEndTime(`${endH}:${endM}`);
        } else {
          setEndTime(defaultEndTime || '10:00');
        }
        setRecordType(defaultRecordType || 'actual');
        setNotes('');
        setLinkedTaskId(initialTaskId || '');
        setLinkedGoalId(initialGoalId || '');
      }
      setError(null);
    }
  }, [
    isOpen,
    activityToEdit,
    defaultDate,
    defaultStartTime,
    defaultEndTime,
    defaultRecordType,
    initialTitle,
    initialCategory,
    initialTaskId,
    initialGoalId,
    initialDurationMinutes,
    categories,
  ]);

  if (!isOpen) return null;

  // Calculate live duration in minutes
  const calculateDuration = () => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // Crossing midnight
      return diff;
    } catch {
      return 0;
    }
  };
  const durationMinutes = calculateDuration();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (durationMinutes <= 0) {
      setError('End time must be after start time.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const startIso = `${date}T${startTime}:00Z`;
      const endIso = `${date}T${endTime}:00Z`;

      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        start_time: startIso,
        end_time: endIso,
        date,
        timezone: 'UTC',
        record_type: recordType,
        source: 'manual',
        linked_task_id: linkedTaskId || undefined,
        linked_goal_id: linkedGoalId || undefined,
        notes: notes.trim() || undefined,
      };

      if (activityToEdit) {
        await api.updateActivity(activityToEdit.id, payload);
      } else {
        await api.createActivity(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!activityToEdit) return;
    if (confirm('Delete this activity record?')) {
      try {
        await api.deleteActivity(activityToEdit.id);
        onSaved();
        onClose();
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleConvert = async () => {
    if (!activityToEdit) return;
    try {
      await api.convertActivityToActual(activityToEdit.id);
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
            <span>{activityToEdit ? 'Edit Activity' : 'Log New Activity'}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Record Type Selection (Planned vs Actual) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
              Record Classification
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRecordType('actual')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition flex items-center justify-center gap-2 ${
                  recordType === 'actual'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Recorded (Actual)</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordType('planned')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border transition flex items-center justify-center gap-2 ${
                  recordType === 'planned'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>Scheduled (Planned)</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Linear Algebra Problem Set or Morning Run"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time Range */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Live Duration Indicator */}
          <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
            <span>Calculated Duration:</span>
            <span className="font-bold">{durationMinutes} minutes ({Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m)</span>
          </div>

          {/* Linking (Task & Goal) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Linked Task (Optional)
              </label>
              <select
                value={linkedTaskId}
                onChange={(e) => setLinkedTaskId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
              >
                <option value="">None</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Linked Goal (Optional)
              </label>
              <select
                value={linkedGoalId}
                onChange={(e) => setLinkedGoalId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
              >
                <option value="">None</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {activityToEdit ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                  title="Delete activity"
                >
                  <Trash2 size={16} />
                </button>
                {activityToEdit.record_type === 'planned' && (
                  <button
                    type="button"
                    onClick={handleConvert}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    <CheckCircle2 size={14} />
                    <span>Mark as Done (Record)</span>
                  </button>
                )}
              </div>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : activityToEdit ? 'Save Changes' : 'Create Activity'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
