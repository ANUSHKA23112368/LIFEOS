from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class JournalEntryCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    date: str = Field(..., description="Date YYYY-MM-DD")
    time: Optional[str] = Field(None, description="Time HH:MM or ISO timestamp")
    content: str = Field(..., description="Main Markdown journal text")
    category: Optional[str] = Field("Personal", description="Category e.g. Personal, Study, Work, Ideas, Reflection")
    tags: List[str] = Field(default_factory=list)
    mood: Optional[str] = Field(None, description="great, good, neutral, low, stressed")
    energy_rating: Optional[int] = Field(None, ge=1, le=5)
    people_mentioned: List[str] = Field(default_factory=list)
    events_mentioned: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    challenges: List[str] = Field(default_factory=list)
    lessons_learned: List[str] = Field(default_factory=list)
    gratitude_notes: List[str] = Field(default_factory=list)

class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    mood: Optional[str] = None
    energy_rating: Optional[int] = Field(None, ge=1, le=5)
    people_mentioned: Optional[List[str]] = None
    events_mentioned: Optional[List[str]] = None
    achievements: Optional[List[str]] = None
    challenges: Optional[List[str]] = None
    lessons_learned: Optional[List[str]] = None
    gratitude_notes: Optional[List[str]] = None
    archived: Optional[bool] = None

class JournalEntryResponse(BaseModel):
    id: str
    user_id: str
    title: str
    date: str
    time: Optional[str] = None
    content: str
    category: str = "Personal"
    tags: List[str] = Field(default_factory=list)
    mood: Optional[str] = None
    energy_rating: Optional[int] = None
    people_mentioned: List[str] = Field(default_factory=list)
    events_mentioned: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    challenges: List[str] = Field(default_factory=list)
    lessons_learned: List[str] = Field(default_factory=list)
    gratitude_notes: List[str] = Field(default_factory=list)
    word_count: int = 0
    archived: bool = False
    created_at: str
    updated_at: str
