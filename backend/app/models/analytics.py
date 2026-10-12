from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class CategoryDuration(BaseModel):
    category_id: str
    category_name: str
    color: str
    minutes: int
    percentage: float

class PlanVsRealityItem(BaseModel):
    category_id: str
    category_name: str
    planned_minutes: int
    actual_minutes: int
    difference_minutes: int

class PatternInsight(BaseModel):
    id: str
    title: str
    observation: str
    evidence: str
    why_it_matters: str
    suggested_action: str
    how_to_evaluate: str
    category: str  # "time", "focus", "habits", "planning"
    confidence: str  # "high", "moderate", "hypothesis"

class AnalyticsSummaryResponse(BaseModel):
    date_range_label: str
    start_date: str
    end_date: str
    # Time
    total_recorded_minutes: int
    total_planned_minutes: int
    time_variance_minutes: int
    unlogged_minutes: int
    categories: List[CategoryDuration]
    plan_vs_reality: List[PlanVsRealityItem]
    # Tasks
    tasks_total: int
    tasks_completed: int
    tasks_in_progress: int
    tasks_pending: int
    task_completion_rate: float
    avg_task_estimation_accuracy: float  # ratio of estimated vs actual
    # Focus
    total_focus_minutes: int
    completed_focus_sessions: int
    total_interruptions: int
    avg_focus_session_duration: float
    # Habits
    habits_tracked: int
    avg_habit_completion_rate: float
    # Goals
    active_goals_count: int
    avg_goal_progress: float
    # Patterns
    patterns: List[PatternInsight]
