from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timezone
import uuid

class UserPreferences(BaseModel):
    timezone: str = "UTC"
    occupation: str = "professional"  # student, professional, freelancer, job_seeker, other
    wake_time: str = "07:00"
    sleep_time: str = "23:00"
    work_start_time: str = "09:00"
    work_end_time: str = "17:00"
    theme: str = "dark"  # dark, light, system
    priorities: List[str] = Field(default_factory=lambda: ["Focus", "Health", "Learning"])
    custom_categories: List[Dict[str, str]] = Field(default_factory=lambda: [
        {"id": "deep_work", "name": "Deep Work", "color": "#3B82F6"},
        {"id": "study", "name": "Study & Learning", "color": "#8B5CF6"},
        {"id": "exercise", "name": "Exercise & Health", "color": "#10B981"},
        {"id": "sleep", "name": "Sleep & Rest", "color": "#6366F1"},
        {"id": "meals", "name": "Meals & Nutrition", "color": "#F59E0B"},
        {"id": "social", "name": "Social & Family", "color": "#EC4899"},
        {"id": "leisure", "name": "Leisure & Recharging", "color": "#14B8A6"},
        {"id": "chores", "name": "Admin & Chores", "color": "#64748B"}
    ])
    onboarding_completed: bool = False
    ai_suggestions_enabled: bool = True
    notifications_enabled: bool = True

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    preferences: UserPreferences
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    preferences: Optional[UserPreferences] = None
