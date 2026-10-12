from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone, timedelta
import uuid
from app.models.ai import AiQueryRequest, AiQueryResponse, AiChatMessage
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.analytics_engine import AnalyticsEngine
from app.services.ai_service import AiService

router = APIRouter(prefix="/ai", tags=["AI Life Analyst"])

@router.post("/query", response_model=AiQueryResponse)
async def query_ai_analyst(
    req: AiQueryRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    today = datetime.now(timezone.utc).date()

    # Determine date range from requested timeframe
    if req.timeframe == "today":
        start_str = end_str = today.strftime("%Y-%m-%d")
        label = "Today"
    elif req.timeframe == "yesterday":
        yest = today - timedelta(days=1)
        start_str = end_str = yest.strftime("%Y-%m-%d")
        label = "Yesterday"
    elif req.timeframe == "last_30_days":
        start_str = (today - timedelta(days=29)).strftime("%Y-%m-%d")
        end_str = today.strftime("%Y-%m-%d")
        label = "Last 30 Days"
    else:  # default last_7_days
        start_str = (today - timedelta(days=6)).strftime("%Y-%m-%d")
        end_str = today.strftime("%Y-%m-%d")
        label = "Last 7 Days"

    # Extract user's factual data securely (only this user's data)
    act_cursor = db.activities.find({
        "user_id": current_user["id"],
        "date": {"$gte": start_str, "$lte": end_str}
    })
    activities = await act_cursor.to_list(length=500)

    task_cursor = db.tasks.find({"user_id": current_user["id"]})
    tasks = await task_cursor.to_list(length=500)

    foc_cursor = db.focus_sessions.find({"user_id": current_user["id"]})
    all_focus = await foc_cursor.to_list(length=500)
    focus_in_range = [
        f for f in all_focus 
        if start_str <= (f.get("start_time", "")[:10] or "") <= end_str
    ]

    hab_cursor = db.habits.find({"user_id": current_user["id"]})
    habits = await hab_cursor.to_list(length=100)

    goal_cursor = db.goals.find({"user_id": current_user["id"]})
    goals = await goal_cursor.to_list(length=100)

    categories = current_user.get("preferences", {}).get("custom_categories", [])

    # Deterministically calculate real stats
    analytics = AnalyticsEngine.compute_analytics(
        start_date=start_str,
        end_date=end_str,
        date_range_label=label,
        activities=activities,
        tasks=tasks,
        focus_sessions=focus_in_range,
        habits=habits,
        goals=goals,
        custom_categories=categories
    )

    context = analytics.model_dump()
    context["user_name"] = current_user.get("name", "User")
    context["occupation"] = current_user.get("preferences", {}).get("occupation", "professional")

    # Generate response
    response = await AiService.analyze_life_data(req.question, context)

    # Persist message history
    now = datetime.now(timezone.utc).isoformat()
    await db.ai_messages.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "role": "user",
        "content": req.question,
        "created_at": now
    })
    await db.ai_messages.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "role": "assistant",
        "content": response.answer,
        "insights": [i.model_dump() for i in response.insights],
        "created_at": now
    })

    return response

@router.get("/history", response_model=List[AiChatMessage])
async def get_ai_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.ai_messages.find({"user_id": current_user["id"]}).sort("created_at", 1)
    docs = await cursor.to_list(length=50)
    return [
        AiChatMessage(
            id=d.get("id") or str(d.get("_id")),
            role=d["role"],
            content=d["content"],
            insights=d.get("insights"),
            created_at=d.get("created_at", "")
        )
        for d in docs
    ]

@router.delete("/history")
async def clear_ai_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    await db.ai_messages.delete_many({"user_id": current_user["id"]})
    return {"status": "success", "message": "AI conversation history cleared."}
