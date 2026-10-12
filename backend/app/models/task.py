from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import uuid

class Subtask(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    completed: bool = False

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = ""
    status: str = "todo"  # todo, in_progress, completed, cancelled
    priority: str = "medium"  # low, medium, high, urgent
    category: str = "deep_work"
    estimated_duration_minutes: int = 30
    actual_duration_minutes: int = 0
    deadline: Optional[str] = None  # ISO string or YYYY-MM-DD
    scheduled_start: Optional[str] = None  # ISO string if scheduled on planner
    scheduled_end: Optional[str] = None
    linked_goal_id: Optional[str] = None
    subtasks: List[Subtask] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    actual_duration_minutes: Optional[int] = None
    deadline: Optional[str] = None
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    linked_goal_id: Optional[str] = None
    subtasks: Optional[List[Subtask]] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    completed_at: Optional[str] = None

class TaskResponse(TaskBase):
    id: str
    user_id: str
    created_at: str
    completed_at: Optional[str] = None
