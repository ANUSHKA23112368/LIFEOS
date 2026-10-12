import React, { useState, useEffect } from 'react';
import { DailyReview } from '../types';
import { api } from '../services/api';
import { BookOpen, CheckCircle2, Clock, Sparkles, Send } from 'lucide-react';

export const DailyReviewPage: React.FC = () => {
  const todayStr = new Date().toISOString().substring(0, 10);
  const [review, setReview] = useState<DailyReview | null>(null);
  const [accomplishments, setAccomplishments] = useState('');
  const [challenges, setChallenges] = useState('');
  const [focusHelpers, setFocusHelpers] = useState('');
  const [distractions, setDistractions] = useState('');
  const [tomorrowIntentions, setTomorrowIntentions] = useState('');
  const [mood, setMood] = useState<number | undefined>(undefined);
  const [energy, setEnergy] = useState<number | undefined>(undefined);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReview = async () => {
    try {
      setLoading(true);
      const data = await api.getDailyReviewByDate(todayStr);
      if (data) {
        setReview(data);
        setAccomplishments(data.accomplishments || '');
        setChallenges(data.challenges_faced || '');
        setFocusHelpers(data.focus_helpers || '');
        setDistractions(data.distractions_encountered || '');
        setTomorrowIntentions(data.tomorrow_intentions || '');
        setMood(data.mood_rating);
        setEnergy(data.energy_rating);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReview();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.submitDailyReview({
        date: todayStr,
        accomplishments,
        challenges_faced: challenges,
        focus_helpers: focusHelpers,
        distractions_encountered: distractions,
        tomorrow_intentions: tomorrowIntentions,
        mood_rating: mood,
        energy_rating: energy,
      });
      setReview(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Module Eight
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
          <BookOpen size={22} className="text-emerald-500" />
          <span>Daily Review & Evening Reflection</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Synthesize what you completed with personal reflection to prepare for a balanced tomorrow.
        </p>
      </div>

      {/* Verified Factual Records Panel */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Recorded Activity</div>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {review?.verified_actual_minutes || 0}m
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Planned Blocks</div>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {review?.verified_planned_minutes || 0}m
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Tasks Completed</div>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {review?.verified_tasks_completed || 0}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Focus Duration</div>
          <div className="text-base font-bold text-slate-900 dark:text-white">
            {review?.verified_focus_minutes || 0}m
          </div>
        </div>
      </div>

      {/* Reflection Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        {saved && (
          <div className="p-3 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold">
            ✓ Daily reflection saved and verified!
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            1. What were your most meaningful accomplishments today?
          </label>
          <textarea
            rows={2}
            value={accomplishments}
            onChange={(e) => setAccomplishments(e.target.value)}
            placeholder="e.g. Shipped database models and held an uninterrupted 45m focus sprint..."
            className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            2. What challenges or unexpected friction did you encounter?
          </label>
          <textarea
            rows={2}
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            placeholder="e.g. Underestimated task duration; felt mid-afternoon slump..."
            className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            3. What helped you focus, and what distracted you?
          </label>
          <textarea
            rows={2}
            value={focusHelpers}
            onChange={(e) => setFocusHelpers(e.target.value)}
            placeholder="e.g. Headphones helped; social media notifications distracted me..."
            className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            4. What is your primary intention or adjustment for tomorrow?
          </label>
          <textarea
            rows={2}
            value={tomorrowIntentions}
            onChange={(e) => setTomorrowIntentions(e.target.value)}
            placeholder="e.g. Add 15m buffer between tasks and start morning with Deep Work..."
            className="w-full p-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Optional Mood & Energy ratings */}
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Subjective Energy (1 - 5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEnergy(lvl)}
                  className={`w-9 h-9 rounded-lg font-bold text-xs border ${energy === lvl ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Subjective Mood (1 - 5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setMood(lvl)}
                  className={`w-9 h-9 rounded-lg font-bold text-xs border ${mood === lvl ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition"
          >
            <Send size={14} />
            <span>Submit Evening Reflection</span>
          </button>
        </div>
      </form>
    </div>
  );
};
