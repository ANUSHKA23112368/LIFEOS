from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
import uuid
from app.models.goal import GoalCreate, GoalUpdate, GoalResponse, GoalMilestone
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals & Personal Growth"])

@router.get("", response_model=List[GoalResponse])
async def get_goals(current_user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.goals.find({"user_id": current_user["id"]}).sort("created_at", -1)
    docs = await cursor.to_list(length=100)

    # Fetch tasks and activities to link metrics
    t_cursor = db.tasks.find({"user_id": current_user["id"]})
    all_tasks = await t_cursor.to_list(length=1000)
    
    a_cursor = db.activities.find({"user_id": current_user["id"], "record_type": "actual"})
    all_activities = await a_cursor.to_list(length=1000)

    results = []
    for d in docs:
        g_id = d.get("id") or str(d.get("_id"))
        milestones = [GoalMilestone(**m) for m in d.get("milestones", [])]
        
        # Calculate progress
        if milestones:
            done_m = sum(1 for m in milestones if m.completed)
            progress = round((done_m / len(milestones)) * 100, 1)
        elif d.get("self_assessment_progress") is not None:
            progress = float(d["self_assessment_progress"])
        else:
            progress = 0.0

        linked_tasks = sum(1 for t in all_tasks if t.get("linked_goal_id") == g_id)
        linked_mins = sum(a.get("duration_minutes", 0) for a in all_activities if a.get("linked_goal_id") == g_id)

        results.append(GoalResponse(
            id=g_id,
            user_id=d["user_id"],
            title=d["title"],
            description=d.get("description", ""),
            category=d.get("category", "Career"),
            start_date=d.get("start_date", ""),
            target_date=d.get("target_date", ""),
            status=d.get("status", "active"),
            success_criteria=d.get("success_criteria", ""),
            milestones=milestones,
            self_assessment_progress=d.get("self_assessment_progress"),
            color=d.get("color", "#3B82F6"),
            review_notes=d.get("review_notes", ""),
            calculated_progress=progress,
            linked_task_count=linked_tasks,
            linked_activity_minutes=linked_mins,
            created_at=d.get("created_at", ""),
            updated_at=d.get("updated_at", "")
        ))
    return results

@router.post("", response_model=GoalResponse)
async def create_goal(goal: GoalCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    goal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = goal.model_dump()
    doc["id"] = goal_id
    doc["user_id"] = current_user["id"]
    doc["created_at"] = now
    doc["updated_at"] = now

    await db.goals.insert_one(doc)
    
    milestones = [GoalMilestone(**m) for m in doc.get("milestones", [])]
    prog = (sum(1 for m in milestones if m.completed) / len(milestones) * 100) if milestones else (doc.get("self_assessment_progress") or 0.0)
    return GoalResponse(
        **doc,
        calculated_progress=round(prog, 1),
        linked_task_count=0,
        linked_activity_minutes=0
    )

@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(goal_id: str, update: GoalUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.goals.find_one({"id": goal_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")

    update_dict = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.goals.update_one({"id": goal_id, "user_id": current_user["id"]}, {"$set": update_dict})
    updated = await db.goals.find_one({"id": goal_id, "user_id": current_user["id"]})
    
    milestones = [GoalMilestone(**m) for m in updated.get("milestones", [])]
    prog = (sum(1 for m in milestones if m.completed) / len(milestones) * 100) if milestones else (updated.get("self_assessment_progress") or 0.0)
    
    return GoalResponse(
        id=updated["id"],
        user_id=updated["user_id"],
        title=updated["title"],
        description=updated.get("description", ""),
        category=updated.get("category", "Career"),
        start_date=updated.get("start_date", ""),
        target_date=updated.get("target_date", ""),
        status=updated.get("status", "active"),
        success_criteria=updated.get("success_criteria", ""),
        milestones=milestones,
        self_assessment_progress=updated.get("self_assessment_progress"),
        color=updated.get("color", "#3B82F6"),
        review_notes=updated.get("review_notes", ""),
        calculated_progress=round(prog, 1),
        linked_task_count=0,
        linked_activity_minutes=0,
        created_at=updated.get("created_at", ""),
        updated_at=updated.get("updated_at", "")
    )

@router.delete("/{goal_id}")
async def delete_goal(goal_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.goals.delete_one({"id": goal_id, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found.")
    return {"status": "success", "message": "Goal deleted."}
