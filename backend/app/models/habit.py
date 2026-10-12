from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class HabitEntry(BaseModel):
    date: str  # YYYY-MM-DD
    value: float = 1.0
    target_value: Optional[float] = 1.0
    unit: Optional[str] = "times"
    status: str = "completed"  # completed, partially_completed, confirmed_not_completed
    completed: bool = True
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

class HabitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = ""
    category: str = "exercise"
    habit_type: str = "boolean"  # boolean, quantity, duration, count, scheduled
    frequency: str = "daily"    # daily, weekly, scheduled
    selected_weekdays: List[str] = Field(default_factory=lambda: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
    target: float = 1.0
    unit: str = "times"         # times, pages, minutes, count, etc.
    start_date: str             # YYYY-MM-DD
    end_date: Optional[str] = None
    status: str = "active"      # active, paused, archived
    color: Optional[str] = "#10B981"
    icon: Optional[str] = "Flame"
    reminder_time: Optional[str] = None
    linked_goal_id: Optional[str] = None
    notes: Optional[str] = None

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    habit_type: Optional[str] = None
    frequency: Optional[str] = None
    selected_weekdays: Optional[List[str]] = None
    target: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    reminder_time: Optional[str] = None
    linked_goal_id: Optional[str] = None
    notes: Optional[str] = None

class HabitCheckInRequest(BaseModel):
    date: str  # YYYY-MM-DD
    value: float = 1.0
    status: str = "completed"  # completed, partially_completed, confirmed_not_completed
    completed: bool = True
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

class HabitResponse(HabitBase):
    id: str
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    completions: List[HabitEntry] = Field(default_factory=list)
    completion_rate_7d: float = 0.0
    completion_rate_30d: float = 0.0
    scheduled_consistency_rate: float = 0.0
    created_at: str
