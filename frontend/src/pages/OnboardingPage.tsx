import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Check, ArrowRight, Sparkles } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [occupation, setOccupation] = useState(user?.preferences?.occupation || 'professional');
  const [wakeTime, setWakeTime] = useState(user?.preferences?.wake_time || '07:00');
  const [sleepTime, setSleepTime] = useState(user?.preferences?.sleep_time || '23:00');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>(['Focus', 'Health', 'Learning']);
  const [saving, setSaving] = useState(false);

  const priorityOptions = ['Focus & Deep Work', 'Health & Fitness', 'Learning & Study', 'Career Growth', 'Creative Projects', 'Mindfulness & Sleep'];

  const togglePriority = (p: string) => {
    setSelectedPriorities(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const currentPrefs = user?.preferences || {
        timezone: 'UTC',
        occupation: 'professional',
        wake_time: '07:00',
        sleep_time: '23:00',
        work_start_time: '09:00',
        work_end_time: '17:00',
        theme: 'dark',
        priorities: [],
        custom_categories: [],
        onboarding_completed: true,
        ai_suggestions_enabled: true,
        notifications_enabled: true,
      };

      const updatedPrefs = {
        ...currentPrefs,
        occupation,
        wake_time: wakeTime,
        sleep_time: sleepTime,
        priorities: selectedPriorities,
        onboarding_completed: true,
      };

      await api.completeOnboarding(updatedPrefs);
      await refreshUser();
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-8 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles size={13} />
            <span>Personalization Wizard</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Tailor Your LIFEOS Experience</h1>
          <p className="text-xs text-slate-400">
            Tell us about your routine so we can adjust timeline windows and intelligence filters.
          </p>
        </div>

        <div className="space-y-6">
          {/* Occupation */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">What best describes you?</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'student', label: 'Student' },
                { id: 'professional', label: 'Professional' },
                { id: 'freelancer', label: 'Freelancer' },
                { id: 'job_seeker', label: 'Job Seeker' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOccupation(opt.id)}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition ${
                    occupation === opt.id
                      ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold'
                      : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Windows */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Usual Wake Time</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Usual Sleep Time</label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Priorities */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select your primary focus areas:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {priorityOptions.map((p) => {
                const selected = selectedPriorities.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePriority(p)}
                    className={`py-2 px-3 text-xs font-medium rounded-lg border text-left flex items-center justify-between transition ${
                      selected
                        ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 font-semibold'
                        : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{p}</span>
                    {selected && <Check size={14} className="text-indigo-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Skip for now
          </button>
          <button
            onClick={handleFinish}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
          >
            <span>{saving ? 'Configuring...' : 'Launch Dashboard'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
