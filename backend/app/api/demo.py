from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.demo_data import DemoDataService

router = APIRouter(prefix="/demo", tags=["Sample / Demo Mode"])

@router.post("/seed")
async def seed_demo_data(current_user: dict = Depends(get_current_user)):
    """Seeds the user account with realistic sample data for instant trial."""
    db = get_db()
    uid = current_user["id"]
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    dataset = DemoDataService.generate_demo_dataset(uid, today_str)

    for act in dataset["activities"]:
        await db.activities.insert_one(act)
    for tsk in dataset["tasks"]:
        await db.tasks.insert_one(tsk)
    for foc in dataset["focus_sessions"]:
        await db.focus_sessions.insert_one(foc)
    for hab in dataset["habits"]:
        await db.habits.insert_one(hab)
    for gol in dataset["goals"]:
        await db.goals.insert_one(gol)
    for jnl in dataset.get("journal_entries", []):
        await db.journal_entries.insert_one(jnl)
    for rev in dataset["daily_reviews"]:
        # Update or insert
        await db.daily_reviews.update_one(
            {"user_id": uid, "date": today_str},
            {"$set": rev},
            upsert=True
        )

    return {"status": "success", "message": "Sample activities, tasks, focus sessions, habits, goals, and journal entries loaded."}

@router.post("/clear")
async def clear_data(current_user: dict = Depends(get_current_user)):
    """Clears all records for the current user to return to a fresh empty state."""
    db = get_db()
    uid = current_user["id"]
    await db.activities.delete_many({"user_id": uid})
    await db.journal_entries.delete_many({"user_id": uid})
    await db.daily_summaries.delete_many({"user_id": uid})
    await db.tasks.delete_many({"user_id": uid})
    await db.focus_sessions.delete_many({"user_id": uid})
    await db.habits.delete_many({"user_id": uid})
    await db.goals.delete_many({"user_id": uid})
    await db.daily_reviews.delete_many({"user_id": uid})
    await db.ai_messages.delete_many({"user_id": uid})
    return {"status": "success", "message": "All activity records cleared."}
