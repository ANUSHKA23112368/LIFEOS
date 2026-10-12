export interface CategoryItem {
  id: string;
  name: string;
  color: string;
}

export interface UserPreferences {
  timezone: string;
  occupation: string;
  wake_time: string;
  sleep_time: string;
  work_start_time: string;
  work_end_time: string;
  theme: string;
  priorities: string[];
  custom_categories: CategoryItem[];
  onboarding_completed: boolean;
  ai_suggestions_enabled: boolean;
  notifications_enabled: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  start_time: string;
  end_time: string;
  date: string;
  timezone: string;
  record_type: 'planned' | 'actual';
  source: string;
  linked_task_id?: string;
  linked_goal_id?: string;
  linked_focus_session_id?: string;
  notes?: string;
  tags?: string[];
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface OverlapItem {
  activity_1_id: string;
  activity_1_title: string;
  activity_2_id: string;
  activity_2_title: string;
  overlap_duration_minutes: number;
  overlap_start: string;
  overlap_end: string;
}

export interface UnloggedGap {
  start: string;
  end: string;
  duration_minutes: number;
  suggestion: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  estimated_duration_minutes: number;
  actual_duration_minutes: number;
  deadline?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  linked_goal_id?: string;
  subtasks: Subtask[];
  tags: string[];
  notes?: string;
  created_at: string;
  completed_at?: string;
}

export interface FocusSession {
  id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  intended_duration_minutes: number;
  actual_duration_minutes: number;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  category: string;
  linked_task_id?: string;
  linked_goal_id?: string;
  interruptions: number;
  notes?: string;
  reflection?: string;
  created_at: string;
}

export interface HabitEntry {
  date: string;
  value: number;
  target_value?: number;
  unit?: string;
  status?: string;
  completed: boolean;
  duration_minutes?: number;
  notes?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  category: string;
  habit_type?: 'boolean' | 'quantity' | 'duration' | 'count' | 'scheduled';
  frequency: string;
  selected_weekdays?: string[];
  target: number;
  unit: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'paused' | 'archived';
  color?: string;
  icon?: string;
  reminder_time?: string;
  linked_goal_id?: string;
  notes?: string;
  current_streak: number;
  longest_streak: number;
  completions: HabitEntry[];
  completion_rate_7d: number;
  completion_rate_30d: number;
  scheduled_consistency_rate?: number;
  created_at: string;
}

export interface HabitHeatmapCell {
  date: string;
  weekday: string;
  is_scheduled: boolean;
  state: 'no_record' | 'partial' | 'achieved' | 'exceeded' | 'failed' | 'unscheduled';
  value: number;
  target: number;
  notes?: string;
}

export interface HabitTimeseriesPoint {
  date: string;
  day_label: string;
  weekday: string;
  value: number;
  target: number;
  completed: boolean;
  is_scheduled: boolean;
}

export interface HabitAnalytics {
  habit_id: string;
  name: string;
  unit: string;
  target: number;
  habit_type: string;
  range_days: number;
  scheduled_opportunities: number;
  scheduled_completed: number;
  consistency_percentage: number;
  timeseries: HabitTimeseriesPoint[];
  heatmap: HabitHeatmapCell[];
  insights: string[];
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  date: string;
  time?: string;
  content: string;
  category: string;
  tags: string[];
  mood?: string;
  energy_rating?: number;
  people_mentioned: string[];
  events_mentioned: string[];
  achievements: string[];
  challenges: string[];
  lessons_learned: string[];
  gratitude_notes: string[];
  word_count: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalCalendarDay {
  date: string;
  entry_count: number;
  total_words: number;
  moods: string[];
  categories: string[];
  has_entries: boolean;
}

export interface DailySummary {
  id: string;
  user_id: string;
  date: string;
  overview: string;
  important_events: string[];
  main_accomplishments: string[];
  tasks_completed: string[];
  tasks_incomplete: string[];
  habits_recorded: Array<{
    name: string;
    value: number;
    unit?: string;
    status: string;
  }>;
  focus_time_minutes: number;
  focus_sessions_count: number;
  lessons_and_ideas: string[];
  variance_analysis: string;
  user_reflection?: string;
  priorities_for_tomorrow: string[];
  is_sparse_data: boolean;
  source_record_ids: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  target_date?: string;
  completed: boolean;
  completed_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  start_date: string;
  target_date: string;
  status: string;
  success_criteria?: string;
  milestones: GoalMilestone[];
  self_assessment_progress?: number;
  color?: string;
  review_notes?: string;
  calculated_progress: number;
  linked_task_count: number;
  linked_activity_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface DailyReview {
  id: string;
  user_id: string;
  date: string;
  accomplishments?: string;
  challenges_faced?: string;
  what_went_well?: string;
  distractions_encountered?: string;
  focus_helpers?: string;
  tomorrow_intentions?: string;
  mood_rating?: number;
  energy_rating?: number;
  verified_planned_minutes: number;
  verified_actual_minutes: number;
  verified_tasks_completed: number;
  verified_tasks_remaining: number;
  verified_focus_minutes: number;
  verified_habits_completed: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryDuration {
  category_id: string;
  category_name: string;
  color: string;
  minutes: number;
  percentage: number;
}

export interface PlanVsRealityItem {
  category_id: string;
  category_name: string;
  planned_minutes: number;
  actual_minutes: number;
  difference_minutes: number;
}

export interface PatternInsight {
  id: string;
  title: string;
  observation: string;
  evidence: string;
  why_it_matters: string;
  suggested_action: string;
  how_to_evaluate: string;
  category: string;
  confidence: 'high' | 'moderate' | 'hypothesis';
}

export interface AnalyticsSummary {
  date_range_label: string;
  start_date: string;
  end_date: string;
  total_recorded_minutes: number;
  total_planned_minutes: number;
  time_variance_minutes: number;
  unlogged_minutes: number;
  categories: CategoryDuration[];
  plan_vs_reality: PlanVsRealityItem[];
  tasks_total: number;
  tasks_completed: number;
  tasks_in_progress: number;
  tasks_pending: number;
  task_completion_rate: number;
  avg_task_estimation_accuracy: number;
  total_focus_minutes: number;
  completed_focus_sessions: number;
  total_interruptions: number;
  avg_focus_session_duration: number;
  habits_tracked: number;
  avg_habit_completion_rate: number;
  active_goals_count: number;
  avg_goal_progress: number;
  patterns: PatternInsight[];
}

export interface AiStructuredInsight {
  title: string;
  what_i_observed: string;
  evidence: string;
  possible_explanation: string;
  suggested_experiment: string;
  how_to_evaluate: string;
}

export interface AiQueryResponse {
  answer: string;
  insights: AiStructuredInsight[];
  suggested_followups: string[];
  calculated_context: Record<string, unknown>;
  provider_used: string;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  insights?: AiStructuredInsight[];
  created_at: string;
}
