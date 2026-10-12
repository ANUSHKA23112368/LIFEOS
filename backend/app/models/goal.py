from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
import uuid

class GoalMilestone(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    target_date: Optional[str] = None
    completed: bool = False
    completed_at: Optional[str] = None

class GoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = ""
    category: str = "Career"  # Education, Career, Skills, Fitness, Personal Projects, Finance, Relationships, General
    start_date: str           # YYYY-MM-DD
    target_date: str          # YYYY-MM-DD
    status: str = "active"    # active, completed, paused, archived
    success_criteria: Optional[str] = ""
    milestones: List[GoalMilestone] = Field(default_factory=list)
    self_assessment_progress: Optional[float] = None  # 0 to 100
    color: Optional[str] = "#3B82F6"
    review_notes: Optional[str] = ""

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    target_date: Optional[str] = None
    status: Optional[str] = None
    success_criteria: Optional[str] = None
    milestones: Optional[List[GoalMilestone]] = None
    self_assessment_progress: Optional[float] = None
    color: Optional[str] = None
    review_notes: Optional[str] = None

class GoalResponse(GoalBase):
    id: str
    user_id: str
    calculated_progress: float = 0.0  # percentage based on milestones or self_assessment
    linked_task_count: int = 0
    linked_activity_minutes: int = 0
    created_at: str
    updated_at: str
