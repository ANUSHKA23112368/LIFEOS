from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class DailySummarySaveRequest(BaseModel):
    date: str
    overview: str
    important_events: List[str] = Field(default_factory=list)
    main_accomplishments: List[str] = Field(default_factory=list)
    tasks_completed: List[str] = Field(default_factory=list)
    tasks_incomplete: List[str] = Field(default_factory=list)
    habits_recorded: List[Dict[str, Any]] = Field(default_factory=list)
    focus_time_minutes: int = 0
    focus_sessions_count: int = 0
    lessons_and_ideas: List[str] = Field(default_factory=list)
    variance_analysis: str = ""
    user_reflection: Optional[str] = ""
    priorities_for_tomorrow: List[str] = Field(default_factory=list)
    source_record_ids: Dict[str, Any] = Field(default_factory=dict)

class DailySummaryResponse(BaseModel):
    id: str
    user_id: str
    date: str
    overview: str
    important_events: List[str] = Field(default_factory=list)
    main_accomplishments: List[str] = Field(default_factory=list)
    tasks_completed: List[str] = Field(default_factory=list)
    tasks_incomplete: List[str] = Field(default_factory=list)
    habits_recorded: List[Dict[str, Any]] = Field(default_factory=list)
    focus_time_minutes: int = 0
    focus_sessions_count: int = 0
    lessons_and_ideas: List[str] = Field(default_factory=list)
    variance_analysis: str = ""
    user_reflection: Optional[str] = ""
    priorities_for_tomorrow: List[str] = Field(default_factory=list)
    is_sparse_data: bool = False
    source_record_ids: Dict[str, Any] = Field(default_factory=dict)
    version: int = 1
    created_at: str
    updated_at: str
