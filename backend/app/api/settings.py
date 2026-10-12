from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from app.models.user import UserPreferences, UserResponse
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings & Privacy"])

@router.put("/preferences", response_model=UserResponse)
async def update_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"preferences": preferences.model_dump()}}
    )
    updated = await db.users.find_one({"id": current_user["id"]})
    return UserResponse(
        id=updated["id"],
        name=updated["name"],
        email=updated["email"],
        preferences=UserPreferences(**updated["preferences"]),
        created_at=updated.get("created_at", "")
    )

@router.get("/export")
async def export_user_data(current_user: dict = Depends(get_current_user)):
    """Exports all authenticated user's records as structured JSON."""
    db = get_db()
    uid = current_user["id"]

    activities = await db.activities.find({"user_id": uid}).to_list(length=5000)
    tasks = await db.tasks.find({"user_id": uid}).to_list(length=5000)
    focus = await db.focus_sessions.find({"user_id": uid}).to_list(length=5000)
    habits = await db.habits.find({"user_id": uid}).to_list(length=1000)
    goals = await db.goals.find({"user_id": uid}).to_list(length=1000)
    reviews = await db.daily_reviews.find({"user_id": uid}).to_list(length=1000)

    # Clean internal mongo _id keys if present
    for lst in [activities, tasks, focus, habits, goals, reviews]:
        for item in lst:
            item.pop("_id", None)

    return {
        "metadata": {
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "user_id": uid,
            "user_email": current_user["email"],
            "application": "LIFEOS — Personal Life Intelligence System"
        },
        "profile": {
            "name": current_user["name"],
            "email": current_user["email"],
            "preferences": current_user.get("preferences", {})
        },
        "activities": activities,
        "tasks": tasks,
        "focus_sessions": focus,
        "habits": habits,
        "goals": goals,
        "daily_reviews": reviews
    }

@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """Permanently deletes the user's account and all associated personal data."""
    db = get_db()
    uid = current_user["id"]

    await db.activities.delete_many({"user_id": uid})
    await db.tasks.delete_many({"user_id": uid})
    await db.focus_sessions.delete_many({"user_id": uid})
    await db.habits.delete_many({"user_id": uid})
    await db.goals.delete_many({"user_id": uid})
    await db.daily_reviews.delete_many({"user_id": uid})
    await db.ai_messages.delete_many({"user_id": uid})
    await db.users.delete_one({"id": uid})

    return {"status": "success", "message": "Account and all associated records have been permanently deleted."}
