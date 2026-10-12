from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class ActivityBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = ""
    category: str = "deep_work"  # matches category id
    start_time: str  # ISO 8601 string, e.g. 2026-10-13T09:00:00Z
    end_time: str    # ISO 8601 string, e.g. 2026-10-13T10:30:00Z
    date: str        # YYYY-MM-DD
    timezone: str = "UTC"
    record_type: str = "actual"  # "planned" or "actual"
    source: str = "manual"       # "manual", "timer", "schedule"
    linked_task_id: Optional[str] = None
    linked_goal_id: Optional[str] = None
    linked_focus_session_id: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    date: Optional[str] = None
    record_type: Optional[str] = None
    linked_task_id: Optional[str] = None
    linked_goal_id: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None

class ActivityResponse(ActivityBase):
    id: str
    user_id: str
    duration_minutes: int
    created_at: str
    updated_at: str
