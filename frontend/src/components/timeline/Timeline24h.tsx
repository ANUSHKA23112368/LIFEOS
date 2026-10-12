import React, { useState } from 'react';
import { Activity, CategoryItem, OverlapItem, UnloggedGap } from '../../types';
import { Clock, Plus, AlertTriangle, HelpCircle, Check, ArrowRight } from 'lucide-react';

interface Timeline24hProps {
  activities: Activity[];
  categories: CategoryItem[];
  overlaps: OverlapItem[];
  gaps: UnloggedGap[];
  onSelectActivity: (activity: Activity) => void;
  onAddActivitySlot: (startTime: string, endTime: string) => void;
  onConvertActivity?: (id: string) => void;
}

export const Timeline24h: React.FC<Timeline24hProps> = ({
  activities,
  categories,
  overlaps,
  gaps,
  onSelectActivity,
  onAddActivitySlot,
  onConvertActivity,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'actual' | 'planned'>('all');

  const catMap = new Map(categories.map(c => [c.id, c]));

  // Helper to calculate top position and height in pixels for 24 hours
  // 1 hour = 60 pixels. Entire day = 24 * 60 = 1440px
  const getMinutesFromTime = (timeStr: string) => {
    try {
      const timePart = timeStr.includes('T') ? timeStr.split('T')[1].substring(0, 5) : timeStr;
      const [h, m] = timePart.split(':').map(Number);
      return h * 60 + m;
    } catch {
      return 0;
    }
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const plannedActivities = activities.filter(a => a.record_type === 'planned');
  const actualActivities = activities.filter(a => a.record_type === 'actual');

  return (
    <div className="space-y-4">
      {/* Overlap Warning Bar if any */}
      {overlaps.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-start gap-2.5 text-xs">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Overlapping Activity Detected: </span>
            {overlaps.map((o, idx) => (
              <span key={idx}>
                "{o.activity_1_title}" overlaps with "{o.activity_2_title}" by {o.overlap_duration_minutes}m.{' '}
              </span>
            ))}
            <span className="text-slate-500 dark:text-slate-400 block mt-0.5">
              Overlaps are flagged so they do not artificially double-count in daily aggregate totals.
            </span>
          </div>
        </div>
      )}

      {/* Unlogged Gaps Prompts */}
      {gaps.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <HelpCircle size={16} className="text-indigo-500 flex-shrink-0" />
            <span>
              {gaps[0].suggestion}{' '}
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">(Unlogged time is not judged as wasted time)</span>
            </span>
          </div>
          <button
            onClick={() => {
              const startT = gaps[0].start.includes('T') ? gaps[0].start.split('T')[1].substring(0, 5) : '12:00';
              const endT = gaps[0].end.includes('T') ? gaps[0].end.split('T')[1].substring(0, 5) : '13:00';
              onAddActivitySlot(startT, endT);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex-shrink-0"
          >
            <Plus size={13} />
            <span>Log Gap</span>
          </button>
        </div>
      )}

      {/* Controls & Track Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-[#111625] rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-md transition ${filterMode === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Dual Track (Plan vs Reality)
          </button>
          <button
            onClick={() => setFilterMode('actual')}
            className={`px-3 py-1 rounded-md transition ${filterMode === 'actual' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Recorded Activities
          </button>
          <button
            onClick={() => setFilterMode('planned')}
            className={`px-3 py-1 rounded-md transition ${filterMode === 'planned' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold' : 'text-slate-500 dark:text-slate-400'}`}
          >
            Planned Schedule
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border-2 border-dashed border-indigo-400"></span>
            <span>Planned Blocks</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-indigo-600"></span>
            <span>Recorded Activities</span>
          </div>
        </div>
      </div>

      {/* 24-Hour Timeline Visual Container */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="grid grid-cols-12 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider py-2.5 px-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="col-span-2 sm:col-span-1">Time</div>
          {filterMode === 'all' ? (
            <>
              <div className="col-span-5 sm:col-span-5 text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                <span>Planned Intentions</span>
              </div>
              <div className="col-span-5 sm:col-span-6 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span>Recorded Reality</span>
              </div>
            </>
          ) : (
            <div className="col-span-10 sm:col-span-11">
              {filterMode === 'actual' ? 'Recorded Activities' : 'Planned Intentions'}
            </div>
          )}
        </div>

        {/* 24-Hour Canvas */}
        <div className="relative min-h-[1440px] select-none">
          {/* Hour grid lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 h-[60px] border-b border-slate-100 dark:border-slate-800/40 flex items-start group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition"
              style={{ top: `${hour * 60}px` }}
            >
              <div className="w-16 sm:w-20 pl-4 pt-1 text-xs font-mono text-slate-400 dark:text-slate-500 font-medium">
                {String(hour).padStart(2, '0')}:00
              </div>
              <div className="flex-1 h-full flex items-center opacity-0 group-hover:opacity-100 transition pl-4">
                <button
                  onClick={() => onAddActivitySlot(`${String(hour).padStart(2, '0')}:00`, `${String((hour + 1) % 24).padStart(2, '0')}:00`)}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition"
                >
                  <Plus size={11} />
                  <span>Log Activity at {String(hour).padStart(2, '0')}:00</span>
                </button>
              </div>
            </div>
          ))}

          {/* Planned Track Blocks */}
          {(filterMode === 'all' || filterMode === 'planned') && (
            <div
              className={`absolute top-0 bottom-0 ${
                filterMode === 'all' ? 'left-16 sm:left-20 right-1/2 pr-2' : 'left-16 sm:left-20 right-4'
              }`}
            >
              {plannedActivities.map((act) => {
                const startMins = getMinutesFromTime(act.start_time);
                const endMins = getMinutesFromTime(act.end_time);
                const height = Math.max(26, endMins - startMins);
                const cat = catMap.get(act.category);

                return (
                  <div
                    key={act.id}
                    onClick={() => onSelectActivity(act)}
                    className="absolute left-1 right-2 rounded-lg border-2 border-dashed border-indigo-400 dark:border-indigo-500/80 bg-indigo-50/60 dark:bg-indigo-950/40 p-2 cursor-pointer hover:shadow-md transition overflow-hidden z-10"
                    style={{
                      top: `${startMins}px`,
                      height: `${height}px`,
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-900 dark:text-indigo-200 truncate">
                      <span className="truncate">{act.title}</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono ml-1">
                        {act.duration_minutes}m
                      </span>
                    </div>
                    {height >= 40 && (
                      <div className="text-[11px] text-indigo-600/80 dark:text-indigo-300/80 truncate mt-0.5">
                        {cat?.name || act.category} • Planned
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actual Track Blocks */}
          {(filterMode === 'all' || filterMode === 'actual') && (
            <div
              className={`absolute top-0 bottom-0 ${
                filterMode === 'all' ? 'left-1/2 right-4 pl-2' : 'left-16 sm:left-20 right-4'
              }`}
            >
              {actualActivities.map((act) => {
                const startMins = getMinutesFromTime(act.start_time);
                const endMins = getMinutesFromTime(act.end_time);
                const height = Math.max(26, endMins - startMins);
                const cat = catMap.get(act.category);
                const bgColor = cat?.color || '#3B82F6';

                return (
                  <div
                    key={act.id}
                    onClick={() => onSelectActivity(act)}
                    className="absolute left-2 right-1 rounded-lg shadow-xs text-white p-2 cursor-pointer hover:brightness-110 hover:shadow-md transition overflow-hidden z-10"
                    style={{
                      top: `${startMins}px`,
                      height: `${height}px`,
                      backgroundColor: bgColor,
                    }}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold truncate">
                      <span className="truncate">{act.title}</span>
                      <span className="text-[10px] font-mono opacity-90 ml-1">
                        {act.duration_minutes}m
                      </span>
                    </div>
                    {height >= 40 && (
                      <div className="text-[11px] opacity-80 truncate mt-0.5">
                        {cat?.name || act.category} {act.source === 'timer' ? '• Focus Timer' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
