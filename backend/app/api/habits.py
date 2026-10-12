from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone, timedelta
import uuid
from app.models.habit import HabitCreate, HabitUpdate, HabitResponse, HabitCheckInRequest, HabitEntry
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/habits", tags=["Habit Tracker"])

def _calculate_streaks_and_rates(completions: List[dict]) -> tuple[int, int, float, float]:
    """Calculates current streak, longest streak, 7d rate, and 30d rate gracefully."""
    if not completions:
        return 0, 0, 0.0, 0.0

    today = datetime.now(timezone.utc).date()
    date_set = {c.get("date") for c in completions if c.get("completed", True)}

    # Current streak
    current_streak = 0
    check_date = today
    # Allow today or yesterday as current anchor
    if check_date.strftime("%Y-%m-%d") not in date_set:
        check_date = today - timedelta(days=1)
    
    while check_date.strftime("%Y-%m-%d") in date_set:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Longest streak
    sorted_dates = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in date_set])
    longest_streak = 0
    temp_streak = 0
    prev_d = None
    for d in sorted_dates:
        if prev_d and (d - prev_d).days == 1:
            temp_streak += 1
        else:
            temp_streak = 1
        longest_streak = max(longest_streak, temp_streak)
        prev_d = d

    # 7-day rate
    last_7 = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]
    done_7 = sum(1 for d in last_7 if d in date_set)
    rate_7 = round((done_7 / 7.0) * 100, 1)

    # 30-day rate
    last_30 = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30)]
    done_30 = sum(1 for d in last_30 if d in date_set)
    rate_30 = round((done_30 / 30.0) * 100, 1)

    return current_streak, max(longest_streak, current_streak), rate_7, rate_30

@router.get("", response_model=List[HabitResponse])
async def get_habits(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.habits.find({"user_id": current_user["id"]}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)

    results = []
    for d in docs:
        completions = d.get("completions", [])
        curr_streak, long_streak, r7, r30 = _calculate_streaks_and_rates(completions)
        entries = [HabitEntry(**c) for c in completions]
        results.append(HabitResponse(
            id=d.get("id") or str(d.get("_id")),
            user_id=d["user_id"],
            name=d["name"],
            description=d.get("description", ""),
            category=d.get("category", "exercise"),
            frequency=d.get("frequency", "daily"),
            target=d.get("target", 1.0),
            unit=d.get("unit", "times"),
            start_date=d.get("start_date", ""),
            end_date=d.get("end_date"),
            status=d.get("status", "active"),
            color=d.get("color", "#10B981"),
            current_streak=curr_streak,
            longest_streak=long_streak,
            completions=entries,
            completion_rate_7d=r7,
            completion_rate_30d=r30,
            created_at=d.get("created_at", "")
        ))
    return results

@router.post("", response_model=HabitResponse)
async def create_habit(habit: HabitCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    habit_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = habit.model_dump()
    doc["id"] = habit_id
    doc["user_id"] = current_user["id"]
    doc["completions"] = []
    doc["current_streak"] = 0
    doc["longest_streak"] = 0
    doc["created_at"] = now

    await db.habits.insert_one(doc)
    return HabitResponse(**doc)

@router.post("/{habit_id}/checkin", response_model=HabitResponse)
async def checkin_habit(
    habit_id: str,
    checkin: HabitCheckInRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    existing = await db.habits.find_one({"id": habit_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found.")

    completions = existing.get("completions", [])
    # Remove existing entry for the same date if exists
    completions = [c for c in completions if c.get("date") != checkin.date]
    if checkin.completed:
        completions.append(checkin.model_dump())

    curr_streak, long_streak, r7, r30 = _calculate_streaks_and_rates(completions)
    await db.habits.update_one(
        {"id": habit_id, "user_id": current_user["id"]},
        {"$set": {
            "completions": completions,
            "current_streak": curr_streak,
            "longest_streak": long_streak
        }}
    )
    
    updated = await db.habits.find_one({"id": habit_id, "user_id": current_user["id"]})
    entries = [HabitEntry(**c) for c in updated.get("completions", [])]
    return HabitResponse(
        id=updated["id"],
        user_id=updated["user_id"],
        name=updated["name"],
        description=updated.get("description", ""),
        category=updated.get("category", "exercise"),
        frequency=updated.get("frequency", "daily"),
        target=updated.get("target", 1.0),
        unit=updated.get("unit", "times"),
        start_date=updated.get("start_date", ""),
        end_date=updated.get("end_date"),
        status=updated.get("status", "active"),
        color=updated.get("color", "#10B981"),
        current_streak=curr_streak,
        longest_streak=long_streak,
        completions=entries,
        completion_rate_7d=r7,
        completion_rate_30d=r30,
        created_at=updated.get("created_at", "")
    )

@router.delete("/{habit_id}")
async def delete_habit(habit_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.habits.delete_one({"id": habit_id, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found.")
    return {"status": "success", "message": "Habit deleted."}
