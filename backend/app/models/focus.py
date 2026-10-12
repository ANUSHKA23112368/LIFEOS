from typing import Optional, List
from pydantic import BaseModel, Field

class FocusSessionBase(BaseModel):
    intended_duration_minutes: int = 25
    linked_task_id: Optional[str] = None
    linked_goal_id: Optional[str] = None
    category: str = "deep_work"
    notes: Optional[str] = ""

class FocusSessionStart(FocusSessionBase):
    pass

class FocusSessionUpdate(BaseModel):
    status: Optional[str] = None  # running, paused, completed, cancelled
    actual_duration_minutes: Optional[int] = None
    interruptions: Optional[int] = None
    notes: Optional[str] = None
    reflection: Optional[str] = None
    convert_to_activity: Optional[bool] = False

class FocusSessionResponse(BaseModel):
    id: str
    user_id: str
    start_time: str
    end_time: Optional[str] = None
    intended_duration_minutes: int
    actual_duration_minutes: int
    status: str  # running, paused, completed, cancelled
    category: str
    linked_task_id: Optional[str] = None
    linked_goal_id: Optional[str] = None
    interruptions: int = 0
    notes: Optional[str] = None
    reflection: Optional[str] = None
    created_at: str
