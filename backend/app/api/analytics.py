from typing import Optional
from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone, timedelta
from app.models.analytics import AnalyticsSummaryResponse
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.analytics_engine import AnalyticsEngine

router = APIRouter(prefix="/analytics", tags=["Life Insights & Analytics"])

@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary(
    timeframe: str = Query("last_7_days", description="today, yesterday, last_7_days, last_30_days, custom"),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    today = datetime.now(timezone.utc).date()

    if timeframe == "today":
        start_str = end_str = today.strftime("%Y-%m-%d")
        label = "Today"
    elif timeframe == "yesterday":
        yest = today - timedelta(days=1)
        start_str = end_str = yest.strftime("%Y-%m-%d")
        label = "Yesterday"
    elif timeframe == "last_30_days":
        start_str = (today - timedelta(days=29)).strftime("%Y-%m-%d")
        end_str = today.strftime("%Y-%m-%d")
        label = "Last 30 Days"
    elif timeframe == "custom" and start_date and end_date:
        start_str = start_date
        end_str = end_date
        label = f"{start_date} to {end_date}"
    else:  # default last_7_days
        start_str = (today - timedelta(days=6)).strftime("%Y-%m-%d")
        end_str = today.strftime("%Y-%m-%d")
        label = "Last 7 Days"

    # Fetch user records
    act_cursor = db.activities.find({
        "user_id": current_user["id"],
        "date": {"$gte": start_str, "$lte": end_str}
    })
    activities = await act_cursor.to_list(length=1000)

    task_cursor = db.tasks.find({"user_id": current_user["id"]})
    tasks = await task_cursor.to_list(length=1000)

    foc_cursor = db.focus_sessions.find({"user_id": current_user["id"]})
    all_focus = await foc_cursor.to_list(length=1000)
    focus_in_range = [
        f for f in all_focus 
        if start_str <= (f.get("start_time", "")[:10] or "") <= end_str
    ]

    hab_cursor = db.habits.find({"user_id": current_user["id"]})
    habits = await hab_cursor.to_list(length=100)

    goal_cursor = db.goals.find({"user_id": current_user["id"]})
    goals = await goal_cursor.to_list(length=100)

    prefs = current_user.get("preferences", {})
    categories = prefs.get("custom_categories", [])

    return AnalyticsEngine.compute_analytics(
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
