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
  UnloggedGap
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
  getHabits: () =>
    request<Habit[]>('/habits'),

  createHabit: (data: Partial<Habit>) =>
    request<Habit>('/habits', { method: 'POST', body: JSON.stringify(data) }),

  checkinHabit: (id: string, data: { date: string; value?: number; completed: boolean; notes?: string }) =>
    request<Habit>(`/habits/${id}/checkin`, { method: 'POST', body: JSON.stringify(data) }),

  deleteHabit: (id: string) =>
    request<{ status: string }>(`/habits/${id}`, { method: 'DELETE' }),

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
