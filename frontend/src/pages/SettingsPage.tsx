import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { Settings, Download, Trash2, ShieldCheck, Sun, Moon, RotateCcw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [wakeTime, setWakeTime] = useState(user?.preferences?.wake_time || '07:00');
  const [sleepTime, setSleepTime] = useState(user?.preferences?.sleep_time || '23:00');
  const [timezone, setTimezone] = useState(user?.preferences?.timezone || 'UTC');
  const [saved, setSaved] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const updated = {
        ...user.preferences,
        wake_time: wakeTime,
        sleep_time: sleepTime,
        timezone,
      };
      await api.updatePreferences(updated);
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      const data = await api.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifeos-export-${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const handleClearData = async () => {
    if (confirm('Clear all your activity and task records to return to a fresh slate?')) {
      await api.clearUserData();
      await refreshUser();
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Permanently delete your account and all data? This action cannot be undone.')) {
      await api.deleteAccount();
      logout();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          Module Thirteen
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
          <Settings size={22} className="text-indigo-600 dark:text-indigo-400" />
          <span>Settings & Privacy Controls</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Control your preferences, appearance, data exports, and privacy boundaries.
        </p>
      </div>

      {/* Routine & Preferences Form */}
      <form onSubmit={handleSavePreferences} className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Daily Routine & Windows</h2>

        {saved && (
          <div className="p-3 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold">
            ✓ Preferences saved successfully!
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Target Wake Time</label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Target Sleep Time</label>
            <input
              type="time"
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button type="submit" className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white">
            Save Preferences
          </button>
        </div>
      </form>

      {/* Theme Toggle Panel */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Interface Theme</h2>
          <p className="text-xs text-slate-500">Switch between dark mode and clean light mode</p>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
        </button>
      </div>

      {/* Data Export & Privacy Section */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Data Portability & Sovereignty</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          You own your records. Download your entire history in structured JSON format including all tasks, activities, focus sessions, and daily reviews.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Download size={15} />
            <span>{exporting ? 'Preparing Export...' : 'Download Complete Data (JSON)'}</span>
          </button>

          <button
            onClick={handleClearData}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-medium transition"
          >
            <RotateCcw size={14} />
            <span>Reset Records to Empty State</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-red-600 dark:text-red-400">Delete Account</h2>
          <p className="text-xs text-slate-500">Permanently delete your account, credentials, and all recorded data.</p>
        </div>
        <button
          onClick={handleDeleteAccount}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition"
        >
          <Trash2 size={14} />
          <span>Delete Account</span>
        </button>
      </div>
    </div>
  );
};
