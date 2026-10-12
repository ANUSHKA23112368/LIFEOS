from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class HabitEntry(BaseModel):
    date: str  # YYYY-MM-DD
    value: float = 1.0
    completed: bool = True
    notes: Optional[str] = None

class HabitBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = ""
    category: str = "exercise"
    frequency: str = "daily"  # daily, weekly, custom
    target: float = 1.0
    unit: str = "times"  # times, minutes, pages, ml
    start_date: str       # YYYY-MM-DD
    end_date: Optional[str] = None
    status: str = "active"  # active, paused, archived
    color: Optional[str] = "#10B981"

class HabitCreate(HabitBase):
    pass

class HabitUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    frequency: Optional[str] = None
    target: Optional[float] = None
    unit: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None

class HabitCheckInRequest(BaseModel):
    date: str  # YYYY-MM-DD
    value: float = 1.0
    completed: bool = True
    notes: Optional[str] = None

class HabitResponse(HabitBase):
    id: str
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    completions: List[HabitEntry] = Field(default_factory=list)
    completion_rate_7d: float = 0.0
    completion_rate_30d: float = 0.0
    created_at: str
