from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
import uuid
from app.models.activity import ActivityCreate, ActivityUpdate, ActivityResponse
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.time_engine import TimeEngine

router = APIRouter(prefix="/activities", tags=["Activities & 24h Timeline"])

@router.get("", response_model=List[ActivityResponse])
async def get_activities(
    date: Optional[str] = Query(None, description="Date filter YYYY-MM-DD"),
    start_date: Optional[str] = Query(None, description="Start date filter YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date filter YYYY-MM-DD"),
    record_type: Optional[str] = Query(None, description="planned or actual"),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": current_user["id"]}
    if date:
        query["date"] = date
    elif start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    if record_type:
        query["record_type"] = record_type

    cursor = db.activities.find(query).sort("start_time", 1)
    docs = await cursor.to_list(length=1000)
    
    results = []
    for d in docs:
        d_id = d.get("id") or str(d.get("_id"))
        duration = d.get("duration_minutes")
        if not duration and d.get("start_time") and d.get("end_time"):
            duration = TimeEngine.calculate_duration_minutes(d["start_time"], d["end_time"])
        results.append(ActivityResponse(
            id=d_id,
            user_id=d["user_id"],
            title=d["title"],
            description=d.get("description", ""),
            category=d.get("category", "deep_work"),
            start_time=d["start_time"],
            end_time=d["end_time"],
            date=d["date"],
            timezone=d.get("timezone", "UTC"),
            record_type=d.get("record_type", "actual"),
            source=d.get("source", "manual"),
            linked_task_id=d.get("linked_task_id"),
            linked_goal_id=d.get("linked_goal_id"),
            linked_focus_session_id=d.get("linked_focus_session_id"),
            notes=d.get("notes"),
            tags=d.get("tags", []),
            duration_minutes=duration or 0,
            created_at=d.get("created_at", ""),
            updated_at=d.get("updated_at", "")
        ))
    return results

@router.post("", response_model=ActivityResponse)
async def create_activity(
    activity: ActivityCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    duration = TimeEngine.calculate_duration_minutes(activity.start_time, activity.end_time)
    if duration <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time."
        )

    act_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = activity.model_dump()
    doc["id"] = act_id
    doc["user_id"] = current_user["id"]
    doc["duration_minutes"] = duration
    doc["created_at"] = now
    doc["updated_at"] = now

    await db.activities.insert_one(doc)
    return ActivityResponse(**doc)

@router.get("/gaps")
async def get_unlogged_gaps(
    date: str = Query(..., description="Date YYYY-MM-DD"),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    cursor = db.activities.find({"user_id": current_user["id"], "date": date})
    activities = await cursor.to_list(length=100)
    
    prefs = current_user.get("preferences", {})
    wake_time = prefs.get("wake_time", "07:00")
    sleep_time = prefs.get("sleep_time", "23:00")
    
    gaps = TimeEngine.find_unlogged_gaps(date, activities, wake_time, sleep_time)
    return {"date": date, "gaps": gaps}

@router.get("/overlaps")
async def get_overlaps(
    date: str = Query(..., description="Date YYYY-MM-DD"),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    cursor = db.activities.find({"user_id": current_user["id"], "date": date})
    activities = await cursor.to_list(length=100)
    overlaps = TimeEngine.detect_overlaps(activities)
    return {"date": date, "overlaps": overlaps}

@router.put("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
    activity_id: str,
    update: ActivityUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    existing = await db.activities.find_one({"id": activity_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")

    update_dict = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    
    start = update_dict.get("start_time", existing.get("start_time"))
    end = update_dict.get("end_time", existing.get("end_time"))
    if start and end:
        duration = TimeEngine.calculate_duration_minutes(start, end)
        if duration <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End time must be after start time.")
        update_dict["duration_minutes"] = duration

    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.activities.update_one({"id": activity_id, "user_id": current_user["id"]}, {"$set": update_dict})
    
    updated = await db.activities.find_one({"id": activity_id, "user_id": current_user["id"]})
    return ActivityResponse(
        id=updated["id"],
        user_id=updated["user_id"],
        title=updated["title"],
        description=updated.get("description", ""),
        category=updated.get("category", "deep_work"),
        start_time=updated["start_time"],
        end_time=updated["end_time"],
        date=updated["date"],
        timezone=updated.get("timezone", "UTC"),
        record_type=updated.get("record_type", "actual"),
        source=updated.get("source", "manual"),
        linked_task_id=updated.get("linked_task_id"),
        linked_goal_id=updated.get("linked_goal_id"),
        linked_focus_session_id=updated.get("linked_focus_session_id"),
        notes=updated.get("notes"),
        tags=updated.get("tags", []),
        duration_minutes=updated.get("duration_minutes", 0),
        created_at=updated.get("created_at", ""),
        updated_at=updated.get("updated_at", "")
    )

@router.post("/{activity_id}/convert", response_model=ActivityResponse)
async def convert_planned_to_actual(
    activity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Converts a planned schedule block into an actual recorded activity."""
    db = get_db()
    existing = await db.activities.find_one({"id": activity_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")

    now = datetime.now(timezone.utc).isoformat()
    await db.activities.update_one(
        {"id": activity_id, "user_id": current_user["id"]},
        {"$set": {"record_type": "actual", "updated_at": now}}
    )
    existing["record_type"] = "actual"
    existing["updated_at"] = now
    return ActivityResponse(**existing)

@router.delete("/{activity_id}")
async def delete_activity(activity_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.activities.delete_one({"id": activity_id, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found.")
    return {"status": "success", "message": "Activity deleted."}
