from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone, timedelta
import uuid

from app.models.habit import (
    HabitCreate,
    HabitUpdate,
    HabitResponse,
    HabitCheckInRequest,
    HabitEntry
)
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/habits", tags=["Habit Tracker"])

WEEKDAY_MAP = {0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun"}

def _calculate_habit_metrics(habit_doc: dict) -> tuple[int, int, float, float, float]:
    """Calculates streaks and rates considering scheduled opportunities."""
    completions = habit_doc.get("completions", [])
    if not completions:
        return 0, 0, 0.0, 0.0, 0.0

    today = datetime.now(timezone.utc).date()
    comp_map = {c.get("date"): c for c in completions}
    completed_dates = {c.get("date") for c in completions if c.get("completed", True)}

    # Current streak
    current_streak = 0
    check_date = today
    if check_date.strftime("%Y-%m-%d") not in completed_dates:
        check_date = today - timedelta(days=1)

    while check_date.strftime("%Y-%m-%d") in completed_dates:
        current_streak += 1
        check_date -= timedelta(days=1)

    # Longest streak
    sorted_dates = sorted([datetime.strptime(d, "%Y-%m-%d").date() for d in completed_dates])
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
    done_7 = sum(1 for d in last_7 if d in completed_dates)
    rate_7 = round((done_7 / 7.0) * 100, 1)

    # 30-day rate
    last_30 = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(30)]
    done_30 = sum(1 for d in last_30 if d in completed_dates)
    rate_30 = round((done_30 / 30.0) * 100, 1)

    # Scheduled opportunity consistency (30 days)
    selected_weekdays = set(habit_doc.get("selected_weekdays") or ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
    sched_opps = 0
    sched_done = 0
    for i in range(30):
        d_obj = today - timedelta(days=i)
        d_str = d_obj.strftime("%Y-%m-%d")
        wd = WEEKDAY_MAP[d_obj.weekday()]
        if wd in selected_weekdays:
            sched_opps += 1
            if d_str in completed_dates:
                sched_done += 1

    sched_rate = round((sched_done / max(1, sched_opps)) * 100, 1) if sched_opps > 0 else rate_30
    return current_streak, max(longest_streak, current_streak), rate_7, rate_30, sched_rate

def _build_habit_response(d: dict) -> HabitResponse:
    curr_streak, long_streak, r7, r30, sched_rate = _calculate_habit_metrics(d)
    completions = d.get("completions", [])
    entries = [HabitEntry(**c) for c in completions]
    doc = dict(d)
    doc["id"] = d.get("id") or str(d.get("_id"))
    doc["current_streak"] = curr_streak
    doc["longest_streak"] = long_streak
    doc["completion_rate_7d"] = r7
    doc["completion_rate_30d"] = r30
    doc["scheduled_consistency_rate"] = sched_rate
    doc["completions"] = entries
    return HabitResponse(**doc)

@router.get("", response_model=List[HabitResponse])
async def get_habits(
    status_filter: Optional[str] = Query(None, description="active, paused, archived"),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": current_user["id"]}
    if status_filter:
        query["status"] = status_filter
    cursor = db.habits.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=100)

    return [_build_habit_response(d) for d in docs]

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
    return _build_habit_response(doc)

@router.get("/{habit_id}", response_model=HabitResponse)
async def get_single_habit(habit_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = await db.habits.find_one({"id": habit_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found.")
    return _build_habit_response(doc)

@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(habit_id: str, habit_update: HabitUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.habits.find_one({"id": habit_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found.")

    update_dict = {k: v for k, v in habit_update.model_dump().items() if v is not None}
    await db.habits.update_one({"id": habit_id, "user_id": current_user["id"]}, {"$set": update_dict})
    updated = await db.habits.find_one({"id": habit_id, "user_id": current_user["id"]})
    return _build_habit_response(updated)

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
    completions = [c for c in completions if c.get("date") != checkin.date]

    target = existing.get("target", 1.0)
    # Determine state
    status_val = checkin.status
    if checkin.completed:
        if checkin.value >= target:
            status_val = "completed"
        elif checkin.value > 0:
            status_val = "partially_completed"
        else:
            status_val = "completed"
    else:
        status_val = "confirmed_not_completed"

    entry = {
        "date": checkin.date,
        "value": checkin.value,
        "target_value": target,
        "unit": existing.get("unit", "times"),
        "status": status_val,
        "completed": checkin.completed,
        "duration_minutes": checkin.duration_minutes,
        "notes": checkin.notes
    }
    completions.append(entry)

    await db.habits.update_one(
        {"id": habit_id, "user_id": current_user["id"]},
        {"$set": {"completions": completions}}
    )

    updated = await db.habits.find_one({"id": habit_id, "user_id": current_user["id"]})
    return _build_habit_response(updated)

@router.put("/{habit_id}/history/{date}", response_model=HabitResponse)
async def correct_habit_history(
    habit_id: str,
    date: str,
    checkin: HabitCheckInRequest,
    current_user: dict = Depends(get_current_user)
):
    """Corrects historical habit record for a specific date."""
    checkin.date = date
    return await checkin_habit(habit_id, checkin, current_user)

@router.get("/{habit_id}/analytics")
async def get_habit_analytics(
    habit_id: str,
    range_days: int = Query(30, description="7, 30, or 90 days"),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    habit = await db.habits.find_one({"id": habit_id, "user_id": current_user["id"]})
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found.")

    today = datetime.now(timezone.utc).date()
    target_val = habit.get("target", 1.0)
    selected_weekdays = set(habit.get("selected_weekdays") or ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])

    comp_map = {c["date"]: c for c in habit.get("completions", [])}

    # Generate Heatmap (90 days for full calendar visual)
    heatmap = []
    for i in range(89, -1, -1):
        d_obj = today - timedelta(days=i)
        d_str = d_obj.strftime("%Y-%m-%d")
        wd = WEEKDAY_MAP[d_obj.weekday()]
        is_sched = wd in selected_weekdays

        record = comp_map.get(d_str)
        if not record:
            state = "no_record" if is_sched else "unscheduled"
            val = 0.0
        else:
            val = record.get("value", 0.0)
            if not record.get("completed", True):
                state = "failed"
            elif val >= target_val * 1.5 and target_val > 1:
                state = "exceeded"
            elif val >= target_val or record.get("completed"):
                state = "achieved"
            elif val > 0:
                state = "partial"
            else:
                state = "failed"

        heatmap.append({
            "date": d_str,
            "weekday": wd,
            "is_scheduled": is_sched,
            "state": state,
            "value": val,
            "target": target_val,
            "notes": record.get("notes") if record else None
        })

    # Timeseries for requested range
    timeseries = []
    scheduled_opportunities = 0
    scheduled_completed = 0
    total_val = 0.0

    for i in range(range_days - 1, -1, -1):
        d_obj = today - timedelta(days=i)
        d_str = d_obj.strftime("%Y-%m-%d")
        wd = WEEKDAY_MAP[d_obj.weekday()]
        is_sched = wd in selected_weekdays

        record = comp_map.get(d_str)
        val = record.get("value", 0.0) if record else 0.0
        total_val += val
        completed = record.get("completed", False) if record else False

        if is_sched:
            scheduled_opportunities += 1
            if completed:
                scheduled_completed += 1

        timeseries.append({
            "date": d_str,
            "day_label": d_obj.strftime("%b %d"),
            "weekday": wd,
            "value": val,
            "target": target_val,
            "completed": completed,
            "is_scheduled": is_sched
        })

    consistency_pct = round((scheduled_completed / max(1, scheduled_opportunities)) * 100, 1)

    # Deterministic Insights
    insights = []
    insights.append(f"Recorded completions on {scheduled_completed} out of {scheduled_opportunities} scheduled opportunities ({consistency_pct}% adherence).")
    if range_days >= 30:
        avg_val = round(total_val / max(1, scheduled_completed), 1) if scheduled_completed > 0 else 0
        insights.append(f"Average actual recorded output when active is {avg_val} {habit.get('unit', 'times')}.")
    if consistency_pct >= 80:
        insights.append("Consistent execution with low variance across scheduled days.")
    elif consistency_pct < 50:
        insights.append("Scheduled frequency may benefit from recalibration or reduced initial target size.")

    return {
        "habit_id": habit_id,
        "name": habit["name"],
        "unit": habit.get("unit", "times"),
        "target": target_val,
        "habit_type": habit.get("habit_type", "boolean"),
        "range_days": range_days,
        "scheduled_opportunities": scheduled_opportunities,
        "scheduled_completed": scheduled_completed,
        "consistency_percentage": consistency_pct,
        "timeseries": timeseries,
        "heatmap": heatmap,
        "insights": insights
    }

@router.get("/compare")
async def compare_habits(
    habit_id_1: str = Query(..., description="First habit ID"),
    habit_id_2: str = Query(..., description="Second habit ID"),
    range_days: int = Query(30, description="Comparison window in days"),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    h1 = await db.habits.find_one({"id": habit_id_1, "user_id": current_user["id"]})
    h2 = await db.habits.find_one({"id": habit_id_2, "user_id": current_user["id"]})
    if not h1 or not h2:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or both habits not found.")

    today = datetime.now(timezone.utc).date()
    comp_map1 = {c["date"]: c for c in h1.get("completions", [])}
    comp_map2 = {c["date"]: c for c in h2.get("completions", [])}

    comparison_data = []
    for i in range(range_days - 1, -1, -1):
        d_obj = today - timedelta(days=i)
        d_str = d_obj.strftime("%Y-%m-%d")
        r1 = comp_map1.get(d_str)
        r2 = comp_map2.get(d_str)

        comparison_data.append({
            "date": d_str,
            "day_label": d_obj.strftime("%b %d"),
            "habit_1_value": r1.get("value", 0.0) if r1 else 0.0,
            "habit_1_completed": r1.get("completed", False) if r1 else False,
            "habit_2_value": r2.get("value", 0.0) if r2 else 0.0,
            "habit_2_completed": r2.get("completed", False) if r2 else False
        })

    return {
        "habit_1": {"id": h1["id"], "name": h1["name"], "unit": h1.get("unit", "")},
        "habit_2": {"id": h2["id"], "name": h2["name"], "unit": h2.get("unit", "")},
        "range_days": range_days,
        "comparison": comparison_data
    }

@router.delete("/{habit_id}")
async def delete_habit(habit_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.habits.delete_one({"id": habit_id, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found.")
    return {"message": "Habit deleted", "id": habit_id}
