from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Query, Response
from datetime import datetime, timezone
import uuid

from app.models.daily_summary import DailySummarySaveRequest, DailySummaryResponse
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/daily-summary", tags=["Daily Life Summary"])

@router.post("/generate", response_model=DailySummaryResponse)
async def generate_daily_summary(
    date: str = Query(..., description="Date YYYY-MM-DD to summarize"),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    uid = current_user["id"]

    # 1. Fetch Journal Entries
    journal_cursor = db.journal_entries.find({"user_id": uid, "date": date, "archived": False})
    journal_docs = await journal_cursor.to_list(length=100)

    # 2. Fetch Timeline Activities
    act_cursor = db.activities.find({"user_id": uid, "date": date})
    act_docs = await act_cursor.to_list(length=200)

    # 3. Fetch Tasks
    task_cursor = db.tasks.find({"user_id": uid})
    all_tasks = await task_cursor.to_list(length=300)
    tasks_completed = [
        t["title"] for t in all_tasks
        if t.get("status") == "completed" and (t.get("completed_at", "")[:10] == date or t.get("deadline", "")[:10] == date)
    ]
    tasks_incomplete = [
        t["title"] for t in all_tasks
        if t.get("status") in ("todo", "in_progress")
    ][:5]

    # 4. Fetch Focus Sessions
    focus_cursor = db.focus_sessions.find({"user_id": uid, "status": "completed"})
    all_focus = await focus_cursor.to_list(length=200)
    focus_today = [f for f in all_focus if f.get("start_time", "")[:10] == date]
    total_focus_minutes = sum(f.get("actual_duration_minutes", 0) for f in focus_today)

    # 5. Fetch Habits
    habit_cursor = db.habits.find({"user_id": uid})
    all_habits = await habit_cursor.to_list(length=100)
    habits_recorded = []
    for h in all_habits:
        for c in h.get("completions", []):
            if c.get("date") == date:
                habits_recorded.append({
                    "name": h["name"],
                    "value": c.get("value", 1.0),
                    "unit": h.get("unit", "times"),
                    "status": c.get("status", "completed" if c.get("completed") else "missed")
                })

    # 6. Fetch Existing Daily Review
    review_doc = await db.daily_reviews.find_one({"user_id": uid, "date": date})

    # Synthesize Accomplishments
    accomplishments = []
    for j in journal_docs:
        accomplishments.extend(j.get("achievements", []))
    accomplishments.extend([f"Completed task: {t}" for t in tasks_completed])

    # Synthesize Important Events
    events = []
    for j in journal_docs:
        events.append(f"{j.get('time', '') + ' - ' if j.get('time') else ''}{j.get('title', '')}")
        events.extend(j.get("events_mentioned", []))
    for a in act_docs:
        if a.get("record_type") == "actual":
            events.append(f"{a.get('start_time', '')[11:16]} Actual: {a.get('title', '')} ({a.get('duration_minutes', 0)}m)")

    # Synthesize Lessons
    lessons = []
    for j in journal_docs:
        lessons.extend(j.get("lessons_learned", []))

    # Variance Calculation
    actual_mins = sum(a.get("duration_minutes", 0) for a in act_docs if a.get("record_type") == "actual")
    planned_mins = sum(a.get("duration_minutes", 0) for a in act_docs if a.get("record_type") == "planned")
    diff = actual_mins - planned_mins
    var_sign = "+" if diff >= 0 else ""
    var_str = f"Planned: {planned_mins // 60}h {planned_mins % 60}m | Actual: {actual_mins // 60}h {actual_mins % 60}m | Net Variance: {var_sign}{diff} mins"

    # Total recorded evidence items
    evidence_count = len(journal_docs) + len(act_docs) + len(tasks_completed) + len(focus_today) + len(habits_recorded)
    is_sparse = evidence_count == 0

    if is_sparse:
        overview = f"Limited recorded information for {date}. No diary entries, timeline activities, or focus sessions were logged on this date."
    else:
        overview = (
            f"Summary for {date}: Recorded {len(journal_docs)} journal entries, {len(act_docs)} timeline activities ({actual_mins // 60}h {actual_mins % 60}m), "
            f"{len(tasks_completed)} completed tasks, and {total_focus_minutes} minutes of dedicated focus across {len(focus_today)} sessions."
        )

    user_reflection = review_doc.get("accomplishments", "") if review_doc else ""

    summary_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    return DailySummaryResponse(
        id=summary_id,
        user_id=uid,
        date=date,
        overview=overview,
        important_events=events,
        main_accomplishments=accomplishments,
        tasks_completed=tasks_completed,
        tasks_incomplete=tasks_incomplete,
        habits_recorded=habits_recorded,
        focus_time_minutes=total_focus_minutes,
        focus_sessions_count=len(focus_today),
        lessons_and_ideas=lessons,
        variance_analysis=var_str,
        user_reflection=user_reflection,
        priorities_for_tomorrow=tasks_incomplete[:3],
        is_sparse_data=is_sparse,
        source_record_ids={
            "journal_entry_ids": [j["id"] for j in journal_docs],
            "activity_ids": [a.get("id", str(a.get("_id"))) for a in act_docs],
            "focus_session_ids": [f["id"] for f in focus_today]
        },
        version=1,
        created_at=now,
        updated_at=now
    )

@router.post("/save", response_model=DailySummaryResponse)
async def save_daily_summary(
    summary_data: DailySummarySaveRequest,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    uid = current_user["id"]
    now = datetime.now(timezone.utc).isoformat()

    existing = await db.daily_summaries.find_one({"user_id": uid, "date": summary_data.date})
    version = (existing.get("version", 1) + 1) if existing else 1
    doc_id = existing.get("id", str(uuid.uuid4())) if existing else str(uuid.uuid4())

    doc = summary_data.model_dump()
    doc["id"] = doc_id
    doc["user_id"] = uid
    doc["version"] = version
    doc["is_sparse_data"] = False
    doc["updated_at"] = now
    if not existing:
        doc["created_at"] = now
    else:
        doc["created_at"] = existing.get("created_at", now)

    await db.daily_summaries.update_one(
        {"user_id": uid, "date": summary_data.date},
        {"$set": doc},
        upsert=True
    )
    return DailySummaryResponse(**doc)

@router.get("/{date}")
async def get_saved_daily_summary(
    date: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    doc = await db.daily_summaries.find_one({"user_id": current_user["id"], "date": date})
    if not doc:
        return {"saved": False, "summary": None}
    return {"saved": True, "summary": DailySummaryResponse(**doc)}

@router.get("/export/{date}")
async def export_daily_summary_markdown(
    date: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    doc = await db.daily_summaries.find_one({"user_id": current_user["id"], "date": date})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No saved summary found for this date.")

    lines = [
        f"# LIFEOS Daily Life Summary — {date}",
        f"**User:** {current_user.get('name', 'User')} | **Generated:** {doc.get('updated_at', '')}",
        "\n## Overview",
        doc.get("overview", ""),
        "\n## Plan vs. Reality Variance",
        doc.get("variance_analysis", ""),
        f"\n## Focus Time",
        f"{doc.get('focus_time_minutes', 0)} minutes across {doc.get('focus_sessions_count', 0)} sessions",
        "\n## Accomplishments",
        "\n".join(f"- {a}" for a in doc.get("main_accomplishments", [])) or "None logged",
        "\n## Tasks Completed",
        "\n".join(f"- {t}" for t in doc.get("tasks_completed", [])) or "None logged",
        "\n## Habits Recorded",
        "\n".join(f"- {h['name']}: {h['value']} {h.get('unit', '')} ({h.get('status', 'completed')})" for h in doc.get("habits_recorded", [])) or "None logged",
        "\n## Important Events & Timeline",
        "\n".join(f"- {e}" for e in doc.get("important_events", [])) or "None logged",
        "\n## Lessons & Ideas",
        "\n".join(f"- {l}" for l in doc.get("lessons_and_ideas", [])) or "None logged",
        "\n## Personal Reflection",
        doc.get("user_reflection", "") or "No reflection entered",
        "\n## Tomorrow's Priorities",
        "\n".join(f"- {p}" for p in doc.get("priorities_for_tomorrow", [])) or "None set"
    ]

    return Response(content="\n".join(lines), media_type="text/markdown")
