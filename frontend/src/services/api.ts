import {
  AuthResponse,
  User,
  UserPreferences,
  Activity,
  Task,
  FocusSession,
  Habit,
  Goal,
  DailyReview,
  AnalyticsSummary,
  AiQueryResponse,
  AiChatMessage,
  OverlapItem,
  UnloggedGap,
  JournalEntry,
  JournalCalendarDay,
  DailySummary
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('lifeos_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.detail || errorMsg;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { name: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  demoLogin: () =>
    request<AuthResponse>('/auth/demo-login', { method: 'POST' }),

  getMe: () =>
    request<User>('/auth/me'),

  updateMe: (data: { name?: string; preferences?: UserPreferences }) =>
    request<User>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),

  completeOnboarding: (prefs: UserPreferences) =>
    request<User>('/auth/onboarding', { method: 'POST', body: JSON.stringify(prefs) }),

  // Activities & 24h Timeline
  getActivities: (params?: { date?: string; start_date?: string; end_date?: string; record_type?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<Activity[]>(`/activities${query ? `?${query}` : ''}`);
  },

  createActivity: (data: Partial<Activity>) =>
    request<Activity>('/activities', { method: 'POST', body: JSON.stringify(data) }),

  updateActivity: (id: string, data: Partial<Activity>) =>
    request<Activity>(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteActivity: (id: string) =>
    request<{ status: string }>(`/activities/${id}`, { method: 'DELETE' }),

  convertActivityToActual: (id: string) =>
    request<Activity>(`/activities/${id}/convert`, { method: 'POST' }),

  getUnloggedGaps: (date: string) =>
    request<{ date: string; gaps: UnloggedGap[] }>(`/activities/gaps?date=${date}`),

  getOverlaps: (date: string) =>
    request<{ date: string; overlaps: OverlapItem[] }>(`/activities/overlaps?date=${date}`),

  // Tasks
  getTasks: (params?: { status?: string; priority?: string; category?: string; search?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<Task[]>(`/tasks${query ? `?${query}` : ''}`);
  },

  createTask: (data: Partial<Task>) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),

  updateTask: (id: string, data: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteTask: (id: string) =>
    request<{ status: string }>(`/tasks/${id}`, { method: 'DELETE' }),

  // Focus Sessions
  getFocusSessions: () =>
    request<FocusSession[]>('/focus'),

  getActiveFocusSession: () =>
    request<FocusSession | null>('/focus/active'),

  startFocusSession: (data: { intended_duration_minutes: number; category?: string; linked_task_id?: string; notes?: string }) =>
    request<FocusSession>('/focus/start', { method: 'POST', body: JSON.stringify(data) }),

  updateFocusSession: (id: string, data: { status?: string; actual_duration_minutes?: number; interruptions?: number; notes?: string; reflection?: string; convert_to_activity?: boolean }) =>
    request<FocusSession>(`/focus/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Habits
  getHabits: (statusFilter?: string) =>
    request<Habit[]>(`/habits${statusFilter ? `?status_filter=${statusFilter}` : ''}`),

  getHabit: (id: string) =>
    request<Habit>(`/habits/${id}`),

  createHabit: (data: Partial<Habit>) =>
    request<Habit>('/habits', { method: 'POST', body: JSON.stringify(data) }),

  updateHabit: (id: string, data: Partial<Habit>) =>
    request<Habit>(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  checkinHabit: (id: string, data: { date: string; value?: number; completed: boolean; status?: string; duration_minutes?: number; notes?: string }) =>
    request<Habit>(`/habits/${id}/checkin`, { method: 'POST', body: JSON.stringify(data) }),

  correctHabitHistory: (id: string, date: string, data: { value?: number; completed: boolean; status?: string; duration_minutes?: number; notes?: string }) =>
    request<Habit>(`/habits/${id}/history/${date}`, { method: 'PUT', body: JSON.stringify(data) }),

  getHabitAnalytics: (id: string, rangeDays = 30) =>
    request<any>(`/habits/${id}/analytics?range_days=${rangeDays}`),

  compareHabits: (id1: string, id2: string, days = 30) =>
    request<any>(`/habits/compare?habit_id_1=${id1}&habit_id_2=${id2}&range_days=${days}`),

  deleteHabit: (id: string) =>
    request<{ message: string; id: string }>(`/habits/${id}`, { method: 'DELETE' }),

  // My Life Journal
  getJournalEntries: (params?: { date?: string; start_date?: string; end_date?: string; category?: string; tag?: string; mood?: string; q?: string; archived?: boolean }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return request<JournalEntry[]>(`/journal${query ? `?${query}` : ''}`);
  },

  getEntriesByDate: (date: string) =>
    request<JournalEntry[]>(`/journal/dates/${date}`),

  getJournalCalendar: (year?: number, month?: number) => {
    let url = '/journal/calendar';
    const params: string[] = [];
    if (year) params.push(`year=${year}`);
    if (month) params.push(`month=${month}`);
    if (params.length) url += `?${params.join('&')}`;
    return request<{ calendar_days: JournalCalendarDay[]; total_active_days: number }>(url);
  },

  searchJournal: (q: string, category?: string, tag?: string) => {
    let url = `/journal/search?q=${encodeURIComponent(q)}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (tag) url += `&tag=${encodeURIComponent(tag)}`;
    return request<{ query: string; total_results: number; results: Array<{ entry: JournalEntry; snippet: string; matched_in: string }> }>(url);
  },

  createJournalEntry: (data: Partial<JournalEntry>) =>
    request<JournalEntry>('/journal', { method: 'POST', body: JSON.stringify(data) }),

  getJournalEntry: (id: string) =>
    request<JournalEntry>(`/journal/${id}`),

  updateJournalEntry: (id: string, data: Partial<JournalEntry>) =>
    request<JournalEntry>(`/journal/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteJournalEntry: (id: string) =>
    request<{ message: string; id: string }>(`/journal/${id}`, { method: 'DELETE' }),

  toggleArchiveJournalEntry: (id: string) =>
    request<{ id: string; archived: boolean }>(`/journal/${id}/archive`, { method: 'POST' }),

  exportJournalMarkdown: async (startDate?: string, endDate?: string): Promise<string> => {
    let url = `${API_BASE}/journal/export?format=markdown`;
    if (startDate && endDate) url += `&start_date=${startDate}&end_date=${endDate}`;
    const token = localStorage.getItem('lifeos_token');
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.text();
  },

  // Daily Life Summary
  generateDailySummary: (date: string) =>
    request<DailySummary>(`/daily-summary/generate?date=${date}`, { method: 'POST' }),

  saveDailySummary: (data: Partial<DailySummary>) =>
    request<DailySummary>('/daily-summary/save', { method: 'POST', body: JSON.stringify(data) }),

  getSavedDailySummary: (date: string) =>
    request<{ saved: boolean; summary: DailySummary | null }>(`/daily-summary/${date}`),

  exportDailySummaryMarkdown: async (date: string): Promise<string> => {
    const url = `${API_BASE}/daily-summary/export/${date}`;
    const token = localStorage.getItem('lifeos_token');
    const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    return res.text();
  },

  // Goals
  getGoals: () =>
    request<Goal[]>('/goals'),

  createGoal: (data: Partial<Goal>) =>
    request<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) }),

  updateGoal: (id: string, data: Partial<Goal>) =>
    request<Goal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteGoal: (id: string) =>
    request<{ status: string }>(`/goals/${id}`, { method: 'DELETE' }),

  // Daily Reviews
  getDailyReviews: () =>
    request<DailyReview[]>('/daily-reviews'),

  getDailyReviewByDate: (date: string) =>
    request<DailyReview>(`/daily-reviews/${date}`),

  submitDailyReview: (data: Partial<DailyReview>) =>
    request<DailyReview>('/daily-reviews', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics
  getAnalyticsSummary: (timeframe = 'last_7_days', startDate?: string, endDate?: string) => {
    let url = `/analytics/summary?timeframe=${timeframe}`;
    if (startDate && endDate) {
      url += `&start_date=${startDate}&end_date=${endDate}`;
    }
    return request<AnalyticsSummary>(url);
  },

  // AI Life Analyst
  queryAi: (question: string, timeframe = 'last_7_days') =>
    request<AiQueryResponse>('/ai/query', { method: 'POST', body: JSON.stringify({ question, timeframe }) }),

  getAiHistory: () =>
    request<AiChatMessage[]>('/ai/history'),

  clearAiHistory: () =>
    request<{ status: string }>('/ai/history', { method: 'DELETE' }),

  // Reports
  getDailyReport: (date?: string) =>
    request<any>(`/reports/daily${date ? `?date=${date}` : ''}`),

  getWeeklyReport: (endDate?: string) =>
    request<any>(`/reports/weekly${endDate ? `?end_date=${endDate}` : ''}`),

  getMonthlyReport: (month?: string) =>
    request<any>(`/reports/monthly${month ? `?month=${month}` : ''}`),

  // Settings
  updatePreferences: (prefs: UserPreferences) =>
    request<User>('/settings/preferences', { method: 'PUT', body: JSON.stringify(prefs) }),

  exportUserData: () =>
    request<Record<string, unknown>>('/settings/export'),

  deleteAccount: () =>
    request<{ status: string }>('/settings/account', { method: 'DELETE' }),

  // Demo
  seedDemoData: () =>
    request<{ status: string }>('/demo/seed', { method: 'POST' }),

  clearUserData: () =>
    request<{ status: string }>('/demo/clear', { method: 'POST' }),
};
