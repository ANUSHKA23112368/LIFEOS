from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
import uuid
from app.models.task import TaskCreate, TaskUpdate, TaskResponse, Subtask
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Task Management"])

@router.get("", response_model=List[TaskResponse])
async def get_tasks(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": current_user["id"]}
    if status_filter:
        query["status"] = status_filter
    if priority:
        query["priority"] = priority
    if category:
        query["category"] = category

    cursor = db.tasks.find(query).sort("created_at", -1)
    docs = await cursor.to_list(length=1000)

    if search:
        s = search.lower()
        docs = [d for d in docs if s in d.get("title", "").lower() or s in d.get("description", "").lower()]

    results = []
    for d in docs:
        subtasks_data = [Subtask(**st) for st in d.get("subtasks", [])]
        results.append(TaskResponse(
            id=d.get("id") or str(d.get("_id")),
            user_id=d["user_id"],
            title=d["title"],
            description=d.get("description", ""),
            status=d.get("status", "todo"),
            priority=d.get("priority", "medium"),
            category=d.get("category", "deep_work"),
            estimated_duration_minutes=d.get("estimated_duration_minutes", 30),
            actual_duration_minutes=d.get("actual_duration_minutes", 0),
            deadline=d.get("deadline"),
            scheduled_start=d.get("scheduled_start"),
            scheduled_end=d.get("scheduled_end"),
            linked_goal_id=d.get("linked_goal_id"),
            subtasks=subtasks_data,
            tags=d.get("tags", []),
            notes=d.get("notes"),
            created_at=d.get("created_at", ""),
            completed_at=d.get("completed_at")
        ))
    return results

@router.post("", response_model=TaskResponse)
async def create_task(task: TaskCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = task.model_dump()
    doc["id"] = task_id
    doc["user_id"] = current_user["id"]
    doc["created_at"] = now
    doc["completed_at"] = now if doc.get("status") == "completed" else None

    await db.tasks.insert_one(doc)
    return TaskResponse(**doc)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.tasks.find_one({"id": task_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    update_dict = {k: v for k, v in update.model_dump(exclude_unset=True).items() if v is not None}
    
    # Handle status transition to completed
    if update_dict.get("status") == "completed" and existing.get("status") != "completed":
        update_dict["completed_at"] = datetime.now(timezone.utc).isoformat()
    elif update_dict.get("status") in ("todo", "in_progress"):
        update_dict["completed_at"] = None

    await db.tasks.update_one({"id": task_id, "user_id": current_user["id"]}, {"$set": update_dict})
    updated = await db.tasks.find_one({"id": task_id, "user_id": current_user["id"]})
    
    subtasks_data = [Subtask(**st) for st in updated.get("subtasks", [])]
    return TaskResponse(
        id=updated["id"],
        user_id=updated["user_id"],
        title=updated["title"],
        description=updated.get("description", ""),
        status=updated.get("status", "todo"),
        priority=updated.get("priority", "medium"),
        category=updated.get("category", "deep_work"),
        estimated_duration_minutes=updated.get("estimated_duration_minutes", 30),
        actual_duration_minutes=updated.get("actual_duration_minutes", 0),
        deadline=updated.get("deadline"),
        scheduled_start=updated.get("scheduled_start"),
        scheduled_end=updated.get("scheduled_end"),
        linked_goal_id=updated.get("linked_goal_id"),
        subtasks=subtasks_data,
        tags=updated.get("tags", []),
        notes=updated.get("notes"),
        created_at=updated.get("created_at", ""),
        completed_at=updated.get("completed_at")
    )

@router.delete("/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    res = await db.tasks.delete_one({"id": task_id, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return {"status": "success", "message": "Task deleted."}
