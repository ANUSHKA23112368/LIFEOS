import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, CategoryItem, OverlapItem, UnloggedGap } from '../types';
import { api } from '../services/api';
import { Timeline24h } from '../components/timeline/Timeline24h';
import { ActivityModal } from '../components/timeline/ActivityModal';
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';

export const TimelinePage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [overlaps, setOverlaps] = useState<OverlapItem[]>([]);
  const [gaps, setGaps] = useState<UnloggedGap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null);
  const [defaultSlotStart, setDefaultSlotStart] = useState<string>('09:00');
  const [defaultSlotEnd, setDefaultSlotEnd] = useState<string>('10:00');

  const categories: CategoryItem[] = user?.preferences?.custom_categories || [];

  const loadTimelineData = async () => {
    try {
      setLoading(true);
      const [acts, ovs, gps] = await Promise.all([
        api.getActivities({ date: selectedDate }),
        api.getOverlaps(selectedDate),
        api.getUnloggedGaps(selectedDate),
      ]);
      setActivities(acts);
      setOverlaps(ovs.overlaps || []);
      setGaps(gps.gaps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimelineData();
  }, [selectedDate]);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().substring(0, 10));
  };

  const handleSelectActivity = (act: Activity) => {
    setActivityToEdit(act);
    setModalOpen(true);
  };

  const handleAddSlot = (start: string, end: string) => {
    setActivityToEdit(null);
    setDefaultSlotStart(start);
    setDefaultSlotEnd(end);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Date Header & Quick Navigation */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Module Two
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock size={22} className="text-indigo-600 dark:text-indigo-400" />
            <span>My 24 Hours Timeline</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full 00:00 – 23:59 interactive timeline distinguishing planned intentions from recorded reality.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />

          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => setSelectedDate(new Date().toISOString().substring(0, 10))}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
          >
            Today
          </button>

          <button
            onClick={() => {
              setActivityToEdit(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Plus size={14} />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* 24-Hour Visual Canvas */}
      <Timeline24h
        activities={activities}
        categories={categories}
        overlaps={overlaps}
        gaps={gaps}
        onSelectActivity={handleSelectActivity}
        onAddActivitySlot={handleAddSlot}
      />

      {/* Activity Modal */}
      <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={loadTimelineData}
        activityToEdit={activityToEdit}
        defaultDate={selectedDate}
        defaultStartTime={defaultSlotStart}
        defaultEndTime={defaultSlotEnd}
        categories={categories}
      />
    </div>
  );
};
