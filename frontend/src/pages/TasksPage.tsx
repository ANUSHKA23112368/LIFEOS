import React, { useState, useEffect } from 'react';
import { Task, CategoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CheckSquare, Plus, Search, Check, Clock, AlertCircle, Trash2 } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New task form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newEstMinutes, setNewEstMinutes] = useState(30);

  const categories: CategoryItem[] = user?.preferences?.custom_categories || [];

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await api.getTasks({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
      });
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, search]);

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task.id, { status: newStatus });
      loadTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await api.createTask({
        title: newTitle.trim(),
        priority: newPriority,
        estimated_duration_minutes: newEstMinutes,
        status: 'todo',
        category: categories[0]?.id || 'deep_work',
      });
      setNewTitle('');
      setShowAddForm(false);
      loadTasks();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('Delete this task?')) {
      await api.deleteTask(id);
      loadTasks();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Four
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare size={22} className="text-indigo-600 dark:text-indigo-400" />
            <span>Task Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track commitments, duration estimates, and execution rates with subtask breakdown.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
        >
          <Plus size={14} />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="p-4 bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Create Task</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="Task title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="sm:col-span-2 px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            <div className="flex gap-2">
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex-1"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <input
                type="number"
                min="5"
                step="5"
                value={newEstMinutes}
                onChange={(e) => setNewEstMinutes(Number(e.target.value))}
                placeholder="Mins"
                className="w-20 px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs text-slate-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-[#111625] rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none outline-none text-slate-900 dark:text-slate-100"
          />
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs font-medium">
          {['all', 'todo', 'in_progress', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-md capitalize transition ${
                statusFilter === status
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/60">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="py-3 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => handleToggleTask(task)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition flex-shrink-0 ${
                    task.status === 'completed'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                  }`}
                >
                  {task.status === 'completed' && <Check size={13} />}
                </button>
                <div className="min-w-0">
                  <div className={`text-xs font-semibold truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {task.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Est: {task.estimated_duration_minutes}m</span>
                    {task.actual_duration_minutes > 0 && <span>• Actual: {task.actual_duration_minutes}m</span>}
                    <span className="capitalize">• {task.priority} Priority</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 rounded transition"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-10 text-xs text-slate-400">
            No tasks found. Click "Add New Task" to create one.
          </div>
        )}
      </div>
    </div>
  );
};
