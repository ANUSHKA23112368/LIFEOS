from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class DailyReviewCreate(BaseModel):
    date: str  # YYYY-MM-DD
    accomplishments: Optional[str] = ""
    challenges_faced: Optional[str] = ""
    what_went_well: Optional[str] = ""
    distractions_encountered: Optional[str] = ""
    focus_helpers: Optional[str] = ""
    tomorrow_intentions: Optional[str] = ""
    mood_rating: Optional[int] = Field(None, ge=1, le=5)  # 1-5 scale (Optional personal reflection)
    energy_rating: Optional[int] = Field(None, ge=1, le=5) # 1-5 scale

class DailyReviewResponse(BaseModel):
    id: str
    user_id: str
    date: str
    accomplishments: Optional[str] = ""
    challenges_faced: Optional[str] = ""
    what_went_well: Optional[str] = ""
    distractions_encountered: Optional[str] = ""
    focus_helpers: Optional[str] = ""
    tomorrow_intentions: Optional[str] = ""
    mood_rating: Optional[int] = None
    energy_rating: Optional[int] = None
    # Verified automatic stats computed by backend
    verified_planned_minutes: int = 0
    verified_actual_minutes: int = 0
    verified_tasks_completed: int = 0
    verified_tasks_remaining: int = 0
    verified_focus_minutes: int = 0
    verified_habits_completed: int = 0
    created_at: str
    updated_at: str
