from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AiQueryRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500)
    timeframe: str = "last_7_days"  # "today", "yesterday", "last_7_days", "last_30_days", "all"

class AiStructuredInsight(BaseModel):
    title: str
    what_i_observed: str
    evidence: str
    possible_explanation: str
    suggested_experiment: str
    how_to_evaluate: str

class AiQueryResponse(BaseModel):
    answer: str
    insights: List[AiStructuredInsight] = Field(default_factory=list)
    suggested_followups: List[str] = Field(default_factory=list)
    calculated_context: Dict[str, Any] = Field(default_factory=dict)
    provider_used: str

class AiChatMessage(BaseModel):
    id: str
    role: str  # "user" or "assistant"
    content: str
    insights: Optional[List[AiStructuredInsight]] = None
    created_at: str
