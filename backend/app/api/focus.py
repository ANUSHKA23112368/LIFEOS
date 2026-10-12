from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import uuid
from app.models.focus import FocusSessionStart, FocusSessionUpdate, FocusSessionResponse
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.time_engine import TimeEngine

router = APIRouter(prefix="/focus", tags=["Focus Tracker"])

@router.get("", response_model=List[FocusSessionResponse])
async def get_focus_sessions(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.focus_sessions.find({"user_id": current_user["id"]}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)
    return [
        FocusSessionResponse(
            id=d.get("id") or str(d.get("_id")),
            user_id=d["user_id"],
            start_time=d["start_time"],
            end_time=d.get("end_time"),
            intended_duration_minutes=d.get("intended_duration_minutes", 25),
            actual_duration_minutes=d.get("actual_duration_minutes", 0),
            status=d.get("status", "running"),
            category=d.get("category", "deep_work"),
            linked_task_id=d.get("linked_task_id"),
            linked_goal_id=d.get("linked_goal_id"),
            interruptions=d.get("interruptions", 0),
            notes=d.get("notes"),
            reflection=d.get("reflection"),
            created_at=d.get("created_at", "")
        )
        for d in docs
    ]

@router.get("/active", response_model=Optional[FocusSessionResponse])
async def get_active_session(current_user: dict = Depends(get_current_user)):
    """Finds an in-progress or paused focus session so UI stays resilient to page reloads."""
    db = get_db()
    doc = await db.focus_sessions.find_one({
        "user_id": current_user["id"],
        "status": {"$in": ["running", "paused"]}
    })
    if not doc:
        return None
    return FocusSessionResponse(
        id=doc.get("id") or str(doc.get("_id")),
        user_id=doc["user_id"],
        start_time=doc["start_time"],
        end_time=doc.get("end_time"),
        intended_duration_minutes=doc.get("intended_duration_minutes", 25),
        actual_duration_minutes=doc.get("actual_duration_minutes", 0),
        status=doc.get("status", "running"),
        category=doc.get("category", "deep_work"),
        linked_task_id=doc.get("linked_task_id"),
        linked_goal_id=doc.get("linked_goal_id"),
        interruptions=doc.get("interruptions", 0),
        notes=doc.get("notes"),
        reflection=doc.get("reflection"),
        created_at=doc.get("created_at", "")
    )

@router.post("/start", response_model=FocusSessionResponse)
async def start_focus_session(
    session_data: FocusSessionStart,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    # Cancel any lingering open sessions
    await db.focus_sessions.update_one(
        {"user_id": current_user["id"], "status": "running"},
        {"$set": {"status": "cancelled", "end_time": datetime.now(timezone.utc).isoformat()}}
    )

    now = datetime.now(timezone.utc).isoformat()
    session_id = str(uuid.uuid4())
    doc = {
        "id": session_id,
        "user_id": current_user["id"],
        "start_time": now,
        "end_time": None,
        "intended_duration_minutes": session_data.intended_duration_minutes,
        "actual_duration_minutes": 0,
        "status": "running",
        "category": session_data.category,
        "linked_task_id": session_data.linked_task_id,
        "linked_goal_id": session_data.linked_goal_id,
        "interruptions": 0,
        "notes": session_data.notes or "",
        "reflection": "",
        "created_at": now
    }
    await db.focus_sessions.insert_one(doc)
    return FocusSessionResponse(**doc)

@router.put("/{session_id}", response_model=FocusSessionResponse)
async def update_focus_session(
    session_id: str,
    update: FocusSessionUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    existing = await db.focus_sessions.find_one({"id": session_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Focus session not found.")

    update_dict = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    now = datetime.now(timezone.utc).isoformat()

    # Calculate actual duration upon completion
    if update.status in ("completed", "cancelled") and not existing.get("end_time"):
        update_dict["end_time"] = now
        duration = TimeEngine.calculate_duration_minutes(existing["start_time"], now)
        if update.actual_duration_minutes is None:
            update_dict["actual_duration_minutes"] = max(1, duration)

    await db.focus_sessions.update_one(
        {"id": session_id, "user_id": current_user["id"]},
        {"$set": update_dict}
    )
    updated = await db.focus_sessions.find_one({"id": session_id, "user_id": current_user["id"]})

    # Optional: convert completed focus session into an actual timeline activity
    if update.convert_to_activity and update.status == "completed":
        act_id = str(uuid.uuid4())
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        act_doc = {
            "id": act_id,
            "user_id": current_user["id"],
            "title": f"Focus Session: {updated.get('notes') or updated.get('category', 'Deep Work').title()}",
            "description": f"Focus reflection: {updated.get('reflection') or 'Completed uninterrupted'}",
            "category": updated.get("category", "deep_work"),
            "start_time": updated["start_time"],
            "end_time": updated.get("end_time", now),
            "date": today_str,
            "timezone": "UTC",
            "record_type": "actual",
            "source": "timer",
            "linked_task_id": updated.get("linked_task_id"),
            "linked_goal_id": updated.get("linked_goal_id"),
            "linked_focus_session_id": session_id,
            "duration_minutes": updated.get("actual_duration_minutes", 25),
            "tags": ["focus-session"],
            "created_at": now,
            "updated_at": now
        }
        await db.activities.insert_one(act_doc)

    return FocusSessionResponse(
        id=updated["id"],
        user_id=updated["user_id"],
        start_time=updated["start_time"],
        end_time=updated.get("end_time"),
        intended_duration_minutes=updated.get("intended_duration_minutes", 25),
        actual_duration_minutes=updated.get("actual_duration_minutes", 0),
        status=updated.get("status", "running"),
        category=updated.get("category", "deep_work"),
        linked_task_id=updated.get("linked_task_id"),
        linked_goal_id=updated.get("linked_goal_id"),
        interruptions=updated.get("interruptions", 0),
        notes=updated.get("notes"),
        reflection=updated.get("reflection"),
        created_at=updated.get("created_at", "")
    )
