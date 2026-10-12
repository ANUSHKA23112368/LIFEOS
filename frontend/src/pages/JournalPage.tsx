import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { JournalEntry, JournalCalendarDay } from '../types';
import {
  BookOpen,
  Calendar,
  Clock,
  Plus,
  Search,
  Download,
  Trash2,
  Archive,
  Save,
  Check,
  AlertCircle,
  Tag,
  Smile,
  Zap,
  Users,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  List,
  CheckSquare,
  FileText,
  Filter,
  X,
  History
} from 'lucide-react';

const MOODS = [
  { value: 'great', label: 'Great', emoji: '😊', color: 'text-emerald-500 bg-emerald-500/10' },
  { value: 'good', label: 'Good', emoji: '🙂', color: 'text-blue-500 bg-blue-500/10' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'text-slate-400 bg-slate-500/10' },
  { value: 'low', label: 'Down', emoji: '😔', color: 'text-amber-500 bg-amber-500/10' },
  { value: 'stressed', label: 'Stressed', emoji: '😤', color: 'text-rose-500 bg-rose-500/10' }
];

const CATEGORIES = ['Personal', 'Study', 'Work', 'Ideas', 'Reflection', 'Health', 'Relationships'];

export const JournalPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'calendar' | 'search'>('timeline');

  // Editor states
  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [entryTime, setEntryTime] = useState<string>('');
  const [category, setCategory] = useState<string>('Personal');
  const [mood, setMood] = useState<string>('good');
  const [energyRating, setEnergyRating] = useState<number>(4);
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [lessons, setLessons] = useState<string[]>([]);
  const [gratitude, setGratitude] = useState<string[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Temp item inputs for lists
  const [newAchievement, setNewAchievement] = useState('');
  const [newChallenge, setNewChallenge] = useState('');
  const [newLesson, setNewLesson] = useState('');
  const [newGratitude, setNewGratitude] = useState('');
  const [newPerson, setNewPerson] = useState('');

  // Calendar states
  const [calYear, setCalYear] = useState<number>(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState<number>(new Date().getMonth() + 1);
  const [calendarDays, setCalendarDays] = useState<Record<string, JournalCalendarDay>>({});

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ entry: JournalEntry; snippet: string }>>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Auto-save debounce timer
  const autosaveTimer = useRef<any>(null);

  // Load entries for selected date
  const loadEntriesForDate = async (date: string) => {
    try {
      setLoading(true);
      const data = await api.getEntriesByDate(date);
      setEntries(data);
      if (data.length > 0) {
        selectEntryForEdit(data[0]);
      } else {
        startNewEntry(date);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load calendar index
  const loadCalendar = async () => {
    try {
      const res = await api.getJournalCalendar(calYear, calMonth);
      const map: Record<string, JournalCalendarDay> = {};
      res.calendar_days.forEach((cd) => {
        map[cd.date] = cd;
      });
      setCalendarDays(map);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadEntriesForDate(selectedDate);
    loadCalendar();
  }, [selectedDate, calYear, calMonth]);

  const selectEntryForEdit = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setEntryTime(entry.time || '');
    setCategory(entry.category || 'Personal');
    setMood(entry.mood || 'good');
    setEnergyRating(entry.energy_rating || 4);
    setTags(entry.tags || []);
    setAchievements(entry.achievements || []);
    setChallenges(entry.challenges || []);
    setLessons(entry.lessons_learned || []);
    setGratitude(entry.gratitude_notes || []);
    setPeople(entry.people_mentioned || []);
    setSaveStatus('saved');
  };

  const startNewEntry = (date = selectedDate) => {
    setSelectedEntry(null);
    const nowTime = new Date().toTimeString().slice(0, 5);
    setTitle('New Journal Note');
    setContent('');
    setEntryTime(nowTime);
    setCategory('Personal');
    setMood('good');
    setEnergyRating(4);
    setTags([]);
    setAchievements([]);
    setChallenges([]);
    setLessons([]);
    setGratitude([]);
    setPeople([]);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaveStatus('saving');
    try {
      const payload: Partial<JournalEntry> = {
        title: title.trim() || 'Untitled Journal Note',
        date: selectedDate,
        time: entryTime || undefined,
        content: content,
        category,
        tags,
        mood,
        energy_rating: energyRating,
        achievements,
        challenges,
        lessons_learned: lessons,
        gratitude_notes: gratitude,
        people_mentioned: people
      };

      if (selectedEntry?.id) {
        const updated = await api.updateJournalEntry(selectedEntry.id, payload);
        setSelectedEntry(updated);
        setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      } else {
        const created = await api.createJournalEntry(payload);
        setSelectedEntry(created);
        setEntries((prev) => [created, ...prev]);
      }
      setSaveStatus('saved');
      loadCalendar();
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  // Debounced auto-save on content or title change
  const handleContentChange = (val: string) => {
    setContent(val);
    setSaveStatus('idle');
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      handleSave();
    }, 1500);
  };

  const handleDeleteEntry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this journal entry permanently?')) return;
    try {
      await api.deleteJournalEntry(id);
      const remaining = entries.filter((e) => e.id !== id);
      setEntries(remaining);
      if (remaining.length > 0) {
        selectEntryForEdit(remaining[0]);
      } else {
        startNewEntry();
      }
      loadCalendar();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const md = await api.exportJournalMarkdown();
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LIFEOS_Journal_Archive_${selectedDate}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.searchJournal(searchQuery);
      setSearchResults(res.results);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  // Add item helpers
  const addItem = (list: string[], setList: (l: string[]) => void, item: string, setItem: (s: string) => void) => {
    if (!item.trim()) return;
    setList([...list, item.trim()]);
    setItem('');
    setTimeout(handleSave, 100);
  };

  const removeItem = (list: string[], setList: (l: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
    setTimeout(handleSave, 100);
  };

  // Word count helper
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Calendar matrix calculation
  const renderCalendarDays = () => {
    const firstDayOfMonth = new Date(calYear, calMonth - 1, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(calYear, calMonth, 0).getDate();
    const cells = [];

    // Empty lead cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="h-14 p-1 rounded-xl bg-transparent" />);
    }

    // Actual day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarDays[dateStr];
      const isSelected = selectedDate === dateStr;
      const isToday = dateStr === new Date().toISOString().split('T')[0];

      cells.push(
        <button
          key={dateStr}
          onClick={() => {
            setSelectedDate(dateStr);
            setActiveTab('timeline');
          }}
          className={`h-14 p-2 rounded-xl text-left border flex flex-col justify-between transition ${
            isSelected
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40'
              : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111625] hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`text-xs font-bold ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
              {day}
            </span>
            {dayData && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title={`${dayData.entry_count} entries`} />
            )}
          </div>
          {dayData ? (
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <span>{dayData.entry_count} log{dayData.entry_count > 1 ? 's' : ''}</span>
              <span className="text-slate-400">• {dayData.total_words}w</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 dark:text-slate-600">No logs</span>
          )}
        </button>
      );
    }
    return cells;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Digital Life Logbook & Daily Archive
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <BookOpen size={24} className="text-indigo-600 dark:text-indigo-400" />
            <span>My Life Journal</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Freeform daily reflections, important incidents, conversations, breakthroughs, and personal life archive.
          </p>
        </div>

        {/* View Switcher and Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'timeline'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText size={14} />
              <span>Day Editor</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Calendar size={14} />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'search'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Search size={14} />
              <span>Search History</span>
            </button>
          </div>

          <button
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            title="Export journal archive as Markdown"
          >
            <Download size={14} />
            <span>Export Archive</span>
          </button>

          <button
            onClick={() => startNewEntry()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition"
          >
            <Plus size={15} />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TIMELINE & DAY EDITOR VIEW */}
      {activeTab === 'timeline' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Date Navigator & Multi-Entry Timeline (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Date Selector Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Selected Date</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              {/* Quick Date Steppers */}
              <div className="flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    const prev = new Date(selectedDate);
                    prev.setDate(prev.getDate() - 1);
                    setSelectedDate(prev.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition flex items-center gap-1"
                >
                  <ChevronLeft size={13} />
                  <span>Previous Day</span>
                </button>
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const next = new Date(selectedDate);
                    next.setDate(next.getDate() + 1);
                    setSelectedDate(next.toISOString().split('T')[0]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition flex items-center gap-1"
                >
                  <span>Next Day</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Daily Timeline Entry List */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Logs for this Day ({entries.length})
                </h3>
                <button
                  onClick={() => startNewEntry()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <Plus size={13} /> Add Log
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading day entries...</div>
              ) : entries.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-xs text-slate-500">No logs recorded for {selectedDate} yet.</p>
                  <button
                    onClick={() => startNewEntry()}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white"
                  >
                    Write First Entry
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => {
                    const isSelected = selectedEntry?.id === entry.id;
                    return (
                      <div
                        key={entry.id}
                        onClick={() => selectEntryForEdit(entry)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#111625] hover:bg-slate-50 dark:hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {entry.title}
                            </span>
                            {entry.mood && (
                              <span>{MOODS.find((m) => m.value === entry.mood)?.emoji}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">
                            {entry.content || 'Empty entry'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {entry.time && <span>{entry.time}</span>}
                            <span>•</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                              {entry.category}
                            </span>
                            <span>•</span>
                            <span>{entry.word_count} words</span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 transition"
                          title="Delete entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Rich Journal Writing Canvas (8 cols) */}
          <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
            {/* Header / Save State & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">Date:</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                  {selectedDate}
                </span>
                <input
                  type="time"
                  value={entryTime}
                  onChange={(e) => {
                    setEntryTime(e.target.value);
                    setSaveStatus('idle');
                  }}
                  className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300"
                />
              </div>

              {/* Save Status Indicators */}
              <div className="flex items-center gap-3">
                {saveStatus === 'saving' && (
                  <span className="text-xs text-amber-500 flex items-center gap-1 font-medium animate-pulse">
                    <Save size={13} /> Saving...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-xs text-emerald-500 flex items-center gap-1 font-medium">
                    <Check size={13} /> Confirmed Saved
                  </span>
                )}
                {saveStatus === 'error' && (
                  <span className="text-xs text-rose-500 flex items-center gap-1 font-medium">
                    <AlertCircle size={13} /> Save Failed
                  </span>
                )}
                <span className="text-xs text-slate-400">Word Count: <strong>{wordCount}</strong></span>
                <button
                  onClick={handleSave}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
                >
                  Save Now
                </button>
              </div>
            </div>

            {/* Entry Title Input */}
            <div>
              <input
                type="text"
                placeholder="Give your log a meaningful title..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setSaveStatus('idle');
                }}
                className="w-full text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-600 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden pb-1"
              />
            </div>

            {/* Metadata Pills: Category, Mood, Energy */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Category selector */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400">Category:</span>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setTimeout(handleSave, 100);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-none focus:ring-1 focus:ring-indigo-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mood pills */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400">Mood:</span>
                <div className="flex items-center gap-1">
                  {MOODS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => {
                        setMood(m.value);
                        setTimeout(handleSave, 100);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-xs transition ${
                        mood === m.value
                          ? `${m.color} font-bold ring-1 ring-current`
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={m.label}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Rating */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400">Energy:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setEnergyRating(lvl);
                        setTimeout(handleSave, 100);
                      }}
                      className={`p-1 rounded text-xs transition ${
                        lvl <= energyRating
                          ? 'text-amber-500'
                          : 'text-slate-300 dark:text-slate-700'
                      }`}
                    >
                      <Zap size={14} className={lvl <= energyRating ? 'fill-amber-500' : ''} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Toggle */}
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className={`ml-auto px-2.5 py-1 text-xs rounded-lg border transition flex items-center gap-1 ${
                  isPreview
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                {isPreview ? <Edit3 size={13} /> : <Eye size={13} />}
                <span>{isPreview ? 'Edit Text' : 'Markdown Preview'}</span>
              </button>
            </div>

            {/* Main Text Writing Area */}
            <div className="min-h-[220px]">
              {isPreview ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 min-h-[220px] prose dark:prose-invert text-xs leading-relaxed whitespace-pre-wrap">
                  {content || <span className="text-slate-400 italic">No entry text written yet.</span>}
                </div>
              ) : (
                <textarea
                  rows={10}
                  placeholder="Record whatever happened today — incidents, conversations, learning breakthroughs, thoughts, lessons, and experiences..."
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 resize-y"
                />
              )}
            </div>

            {/* Structured Life Reflection Accordions */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Structured Life Event Attributes
              </span>

              <div className="grid md:grid-cols-2 gap-4">
                {/* 1. Achievements & Wins */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Award size={14} className="text-amber-500" />
                    <span>Achievements & Wins</span>
                  </div>
                  <div className="space-y-1">
                    {achievements.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-md">
                        <span className="text-slate-700 dark:text-slate-300">• {item}</span>
                        <button onClick={() => removeItem(achievements, setAchievements, idx)} className="text-slate-400 hover:text-rose-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add an achievement..."
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addItem(achievements, setAchievements, newAchievement, setNewAchievement)}
                      className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={() => addItem(achievements, setAchievements, newAchievement, setNewAchievement)}
                      className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 2. Lessons Learned */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Sparkles size={14} className="text-indigo-500" />
                    <span>Lessons Learned</span>
                  </div>
                  <div className="space-y-1">
                    {lessons.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-md">
                        <span className="text-slate-700 dark:text-slate-300">• {item}</span>
                        <button onClick={() => removeItem(lessons, setLessons, idx)} className="text-slate-400 hover:text-rose-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add a key lesson..."
                      value={newLesson}
                      onChange={(e) => setNewLesson(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addItem(lessons, setLessons, newLesson, setNewLesson)}
                      className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={() => addItem(lessons, setLessons, newLesson, setNewLesson)}
                      className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 3. Gratitude & Joy */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Smile size={14} className="text-emerald-500" />
                    <span>Gratitude Notes</span>
                  </div>
                  <div className="space-y-1">
                    {gratitude.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 px-2 py-1 rounded-md">
                        <span className="text-slate-700 dark:text-slate-300">• {item}</span>
                        <button onClick={() => removeItem(gratitude, setGratitude, idx)} className="text-slate-400 hover:text-rose-500">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="What are you grateful for?"
                      value={newGratitude}
                      onChange={(e) => setNewGratitude(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addItem(gratitude, setGratitude, newGratitude, setNewGratitude)}
                      className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={() => addItem(gratitude, setGratitude, newGratitude, setNewGratitude)}
                      className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 4. People Mentioned & Tags */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <Users size={14} className="text-blue-500" />
                    <span>People Mentioned & Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {people.map((p, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                        @{p}
                        <button onClick={() => removeItem(people, setPeople, idx)}><X size={10} /></button>
                      </span>
                    ))}
                    {tags.map((t, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold">
                        #{t}
                        <button onClick={() => removeItem(tags, setTags, idx)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. coding) or person..."
                      value={newPerson}
                      onChange={(e) => setNewPerson(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newPerson.trim()) {
                          if (newPerson.startsWith('@')) {
                            addItem(people, setPeople, newPerson.slice(1), setNewPerson);
                          } else {
                            addItem(tags, setTags, newPerson.replace(/^#/, ''), setNewPerson);
                          }
                        }
                      }}
                      className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    />
                    <button
                      onClick={() => {
                        if (newPerson.trim()) {
                          if (newPerson.startsWith('@')) {
                            addItem(people, setPeople, newPerson.slice(1), setNewPerson);
                          } else {
                            addItem(tags, setTags, newPerson.replace(/^#/, ''), setNewPerson);
                          }
                        }
                      }}
                      className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MONTHLY CALENDAR VIEW */}
      {activeTab === 'calendar' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
                <span>Monthly Journal Calendar Matrix</span>
              </h2>
              <p className="text-xs text-slate-500">
                Days with green indicators contain verified log entries. Click any date to open its entries.
              </p>
            </div>

            {/* Month Nav */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (calMonth === 1) {
                    setCalMonth(12);
                    setCalYear(calYear - 1);
                  } else {
                    setCalMonth(calMonth - 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-slate-900 dark:text-white px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono">
                {new Date(calYear, calMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => {
                  if (calMonth === 12) {
                    setCalMonth(1);
                    setCalYear(calYear + 1);
                  } else {
                    setCalMonth(calMonth + 1);
                  }
                }}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {renderCalendarDays()}
          </div>
        </div>
      )}

      {/* VIEW 3: FULL-TEXT SEARCH HISTORY VIEW */}
      {activeTab === 'search' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search size={18} className="text-indigo-600 dark:text-indigo-400" />
              <span>Full-Text Life History Search</span>
            </h2>
            <p className="text-xs text-slate-500">
              Search across your entire saved diary archive: exact phrases, people mentioned, tags, or lessons learned.
            </p>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search for a conversation, breakthrough, obstacle, or person..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              {searching ? 'Searching...' : 'Search Archive'}
            </button>
          </div>

          {/* Results list */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Search Results ({searchResults.length})
            </span>

            {searchResults.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Type a keyword or phrase above and press Search.
              </div>
            ) : (
              searchResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(item.entry.date);
                    selectEntryForEdit(item.entry);
                    setActiveTab('timeline');
                  }}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] hover:border-indigo-500 cursor-pointer transition space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {item.entry.title}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">{item.entry.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.snippet}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                      {item.entry.category}
                    </span>
                    {item.entry.tags.map((t) => (
                      <span key={t} className="text-indigo-500">#{t}</span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
