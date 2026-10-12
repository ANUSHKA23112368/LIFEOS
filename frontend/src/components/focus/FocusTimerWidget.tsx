import React, { useState, useEffect, useRef } from 'react';
import { FocusSession, Task, Goal } from '../../types';
import { Play, Pause, Square, AlertCircle, CheckCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface FocusTimerWidgetProps {
  onSessionFinished?: () => void;
}

export const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = ({ onSessionFinished }) => {
  const [activeSession, setActiveSession] = useState<FocusSession | null>(null);
  const [presetDuration, setPresetDuration] = useState<number>(25);
  const [category, setCategory] = useState<string>('deep_work');
  const [notes, setNotes] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  
  // Timer state
  const [secondsRemaining, setSecondsRemaining] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [interruptions, setInterruptions] = useState<number>(0);
  const [showReflectionModal, setShowReflectionModal] = useState<boolean>(false);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [convertToActivity, setConvertToActivity] = useState<boolean>(true);

  // Poll or check active session on mount
  useEffect(() => {
    api.getTasks({ status: 'todo' }).then(setTasks).catch(console.error);

    const checkActive = async () => {
      try {
        const session = await api.getActiveFocusSession();
        if (session) {
          setActiveSession(session);
          setInterruptions(session.interruptions || 0);
          
          // Calculate elapsed time based on start_time timestamp
          const startMs = new Date(session.start_time).getTime();
          const nowMs = Date.now();
          const elapsedSecs = Math.floor((nowMs - startMs) / 1000);
          const totalSecs = session.intended_duration_minutes * 60;
          const rem = Math.max(0, totalSecs - elapsedSecs);
          
          setSecondsRemaining(rem);
          setIsRunning(session.status === 'running' && rem > 0);
        } else {
          setSecondsRemaining(presetDuration * 60);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkActive();
  }, [presetDuration]);

  // Interval ticker
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setShowReflectionModal(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const handleStart = async () => {
    try {
      const session = await api.startFocusSession({
        intended_duration_minutes: presetDuration,
        category,
        linked_task_id: selectedTaskId || undefined,
        notes: notes || 'Deep focus sprint',
      });
      setActiveSession(session);
      setSecondsRemaining(presetDuration * 60);
      setIsRunning(true);
      setInterruptions(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePause = async () => {
    if (!activeSession) return;
    setIsRunning(false);
    await api.updateFocusSession(activeSession.id, { status: 'paused' });
  };

  const handleResume = async () => {
    if (!activeSession) return;
    setIsRunning(true);
    await api.updateFocusSession(activeSession.id, { status: 'running' });
  };

  const handleLogInterruption = async () => {
    if (!activeSession) return;
    const newCount = interruptions + 1;
    setInterruptions(newCount);
    await api.updateFocusSession(activeSession.id, { interruptions: newCount });
  };

  const handleCancel = async () => {
    if (!activeSession) return;
    if (confirm('Cancel this focus session? Cancelled sessions will not count toward completed focus.')) {
      await api.updateFocusSession(activeSession.id, { status: 'cancelled' });
      setActiveSession(null);
      setIsRunning(false);
      setSecondsRemaining(presetDuration * 60);
    }
  };

  const handleFinishEarly = () => {
    setShowReflectionModal(true);
  };

  const handleCompleteSession = async () => {
    if (!activeSession) return;
    const elapsedMinutes = Math.max(1, Math.round((activeSession.intended_duration_minutes * 60 - secondsRemaining) / 60));
    try {
      await api.updateFocusSession(activeSession.id, {
        status: 'completed',
        actual_duration_minutes: elapsedMinutes,
        interruptions,
        reflection: reflectionText,
        convert_to_activity: convertToActivity,
      });
      setShowReflectionModal(false);
      setActiveSession(null);
      setIsRunning(false);
      setSecondsRemaining(presetDuration * 60);
      setReflectionText('');
      onSessionFinished?.();
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalSeconds = (activeSession?.intended_duration_minutes || presetDuration) * 60;
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  return (
    <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="max-w-md mx-auto text-center space-y-6">
        {/* Preset Duration Buttons (only when not running session) */}
        {!activeSession && (
          <div className="flex justify-center gap-2">
            {[15, 25, 45, 60, 90].map((dur) => (
              <button
                key={dur}
                onClick={() => {
                  setPresetDuration(dur);
                  setSecondsRemaining(dur * 60);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  presetDuration === dur
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {dur}m
              </button>
            ))}
          </div>
        )}

        {/* Circular Display */}
        <div className="relative w-56 h-56 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="96"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100 dark:text-slate-800"
              fill="transparent"
            />
            <circle
              cx="112"
              cy="112"
              r="96"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 96}
              strokeDashoffset={2 * Math.PI * 96 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              className="text-indigo-600 dark:text-indigo-500 transition-all duration-500"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
              {formatTime(secondsRemaining)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {isRunning ? 'FOCUSING' : activeSession ? 'PAUSED' : 'READY'}
            </span>
          </div>
        </div>

        {/* Linked Task & Notes when setting up */}
        {!activeSession && (
          <div className="space-y-3 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Link to Task (Optional)
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                <option value="">No linked task</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.estimated_duration_minutes}m)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <input
                type="text"
                placeholder="What are you dedicating this session to?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Active Session Info */}
        {activeSession && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
              {activeSession.notes || 'Focus session in progress'}
            </span>
            <button
              onClick={handleLogInterruption}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 font-medium transition"
              title="Record an interruption"
            >
              <AlertCircle size={12} />
              <span>Log Interruption ({interruptions})</span>
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!activeSession ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition"
            >
              <Play size={16} />
              <span>Start Focus Session</span>
            </button>
          ) : (
            <>
              {isRunning ? (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                >
                  <Pause size={14} />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
                >
                  <Play size={14} />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={handleFinishEarly}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
              >
                <CheckCircle size={14} />
                <span>Complete</span>
              </button>

              <button
                onClick={handleCancel}
                className="p-2.5 text-slate-400 hover:text-red-500 rounded-lg transition"
                title="Cancel session"
              >
                <Square size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Reflection Modal */}
      {showReflectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" />
              <span>Focus Session Reflection</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Capturing a brief reflection helps the AI Life Analyst identify what empowers your deep work states.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                How did this session go? What helped or distracted you?
              </label>
              <textarea
                rows={3}
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="e.g. Cleared my desk and kept phone in another room; reached great flow state."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="convertAct"
                checked={convertToActivity}
                onChange={(e) => setConvertToActivity(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <label htmlFor="convertAct" className="text-xs text-slate-700 dark:text-slate-300">
                Automatically convert to recorded activity on My 24 Hours timeline
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReflectionModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteSession}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save & Finish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
