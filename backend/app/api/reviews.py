from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
import uuid
from app.models.review import DailyReviewCreate, DailyReviewResponse
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/daily-reviews", tags=["Daily Review"])

async def _calculate_verified_stats(user_id: str, date_str: str) -> dict:
    """Computes mathematically verified factual records for the given date."""
    db = get_db()
    
    # Activities
    act_cursor = db.activities.find({"user_id": user_id, "date": date_str})
    activities = await act_cursor.to_list(length=100)
    planned_mins = sum(a.get("duration_minutes", 0) for a in activities if a.get("record_type") == "planned")
    actual_mins = sum(a.get("duration_minutes", 0) for a in activities if a.get("record_type") == "actual")

    # Tasks
    task_cursor = db.tasks.find({"user_id": user_id})
    all_tasks = await task_cursor.to_list(length=500)
    # Tasks completed on that date or overall
    tasks_done = sum(1 for t in all_tasks if t.get("status") == "completed" and (not t.get("completed_at") or date_str in t.get("completed_at", "")))
    tasks_rem = sum(1 for t in all_tasks if t.get("status") in ("todo", "in_progress"))

    # Focus
    foc_cursor = db.focus_sessions.find({"user_id": user_id, "status": "completed"})
    all_focus = await foc_cursor.to_list(length=100)
    focus_mins = sum(f.get("actual_duration_minutes", 0) for f in all_focus if date_str in f.get("start_time", ""))

    # Habits
    hab_cursor = db.habits.find({"user_id": user_id})
    all_habits = await hab_cursor.to_list(length=100)
    habits_done = 0
    for h in all_habits:
        for c in h.get("completions", []):
            if c.get("date") == date_str and c.get("completed", True):
                habits_done += 1

    return {
        "verified_planned_minutes": planned_mins,
        "verified_actual_minutes": actual_mins,
        "verified_tasks_completed": tasks_done,
        "verified_tasks_remaining": tasks_rem,
        "verified_focus_minutes": focus_mins,
        "verified_habits_completed": habits_done
    }

@router.get("", response_model=List[DailyReviewResponse])
async def get_reviews(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.daily_reviews.find({"user_id": current_user["id"]}).sort("date", -1)
    docs = await cursor.to_list(length=60)
    return [DailyReviewResponse(**d) for d in docs]

@router.get("/{date}", response_model=Optional[DailyReviewResponse])
async def get_review_by_date(date: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.daily_reviews.find_one({"user_id": current_user["id"], "date": date})
    if not doc:
        # Return an initial preview with verified stats even before review is submitted
        verified = await _calculate_verified_stats(current_user["id"], date)
        return DailyReviewResponse(
            id="",
            user_id=current_user["id"],
            date=date,
            created_at="",
            updated_at="",
            **verified
        )
    return DailyReviewResponse(**doc)

@router.post("", response_model=DailyReviewResponse)
async def submit_review(review: DailyReviewCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    verified = await _calculate_verified_stats(current_user["id"], review.date)
    now = datetime.now(timezone.utc).isoformat()

    existing = await db.daily_reviews.find_one({"user_id": current_user["id"], "date": review.date})
    doc_data = review.model_dump()
    doc_data.update(verified)
    doc_data["updated_at"] = now

    if existing:
        doc_data["id"] = existing.get("id") or str(existing.get("_id"))
        doc_data["created_at"] = existing.get("created_at", now)
        await db.daily_reviews.update_one(
            {"user_id": current_user["id"], "date": review.date},
            {"$set": doc_data}
        )
    else:
        doc_data["id"] = str(uuid.uuid4())
        doc_data["user_id"] = current_user["id"]
        doc_data["created_at"] = now
        await db.daily_reviews.insert_one(doc_data)

    return DailyReviewResponse(**doc_data)
