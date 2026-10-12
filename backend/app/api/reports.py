from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.analytics_engine import AnalyticsEngine

router = APIRouter(prefix="/reports", tags=["Daily & Weekly Reports"])

@router.get("/daily")
async def get_daily_report(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    today_str = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Fetch daily review
    review = await db.daily_reviews.find_one({"user_id": current_user["id"], "date": today_str})
    
    # Compute analytics for that single date
    act_cursor = db.activities.find({"user_id": current_user["id"], "date": today_str})
    activities = await act_cursor.to_list(length=100)

    task_cursor = db.tasks.find({"user_id": current_user["id"]})
    tasks = await task_cursor.to_list(length=200)

    foc_cursor = db.focus_sessions.find({"user_id": current_user["id"], "status": "completed"})
    focus = [f for f in await foc_cursor.to_list(length=100) if today_str in f.get("start_time", "")]

    habits = await db.habits.find({"user_id": current_user["id"]}).to_list(length=50)
    goals = await db.goals.find({"user_id": current_user["id"]}).to_list(length=50)

    categories = current_user.get("preferences", {}).get("custom_categories", [])

    analytics = AnalyticsEngine.compute_analytics(
        start_date=today_str,
        end_date=today_str,
        date_range_label=f"Daily Report ({today_str})",
        activities=activities,
        tasks=tasks,
        focus_sessions=focus,
        habits=habits,
        goals=goals,
        custom_categories=categories
    )

    return {
        "report_type": "daily",
        "date": today_str,
        "user_name": current_user["name"],
        "analytics": analytics,
        "review": review,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/weekly")
async def get_weekly_report(
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    end_dt = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else datetime.now(timezone.utc).date()
    start_dt = end_dt - timedelta(days=6)
    start_str = start_dt.strftime("%Y-%m-%d")
    end_str = end_dt.strftime("%Y-%m-%d")

    act_cursor = db.activities.find({"user_id": current_user["id"], "date": {"$gte": start_str, "$lte": end_str}})
    activities = await act_cursor.to_list(length=500)

    task_cursor = db.tasks.find({"user_id": current_user["id"]})
    tasks = await task_cursor.to_list(length=500)

    foc_cursor = db.focus_sessions.find({"user_id": current_user["id"], "status": "completed"})
    focus = [f for f in await foc_cursor.to_list(length=200) if start_str <= f.get("start_time", "")[:10] <= end_str]

    habits = await db.habits.find({"user_id": current_user["id"]}).to_list(length=50)
    goals = await db.goals.find({"user_id": current_user["id"]}).to_list(length=50)
    reviews = await db.daily_reviews.find({"user_id": current_user["id"], "date": {"$gte": start_str, "$lte": end_str}}).to_list(length=7)

    categories = current_user.get("preferences", {}).get("custom_categories", [])

    analytics = AnalyticsEngine.compute_analytics(
        start_date=start_str,
        end_date=end_str,
        date_range_label=f"Weekly Report ({start_str} to {end_str})",
        activities=activities,
        tasks=tasks,
        focus_sessions=focus,
        habits=habits,
        goals=goals,
        custom_categories=categories
    )

    return {
        "report_type": "weekly",
        "start_date": start_str,
        "end_date": end_str,
        "user_name": current_user["name"],
        "analytics": analytics,
        "daily_reviews": reviews,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
