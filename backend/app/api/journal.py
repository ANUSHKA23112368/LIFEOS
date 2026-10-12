from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query, Response
from datetime import datetime, timezone
import uuid
import re

from app.models.journal import JournalEntryCreate, JournalEntryUpdate, JournalEntryResponse
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/journal", tags=["My Life Journal & Logbook"])

def count_words(text: str) -> int:
    if not text:
        return 0
    words = re.findall(r'\b\w+\b', text)
    return len(words)

@router.get("", response_model=List[JournalEntryResponse])
async def get_journal_entries(
    date: Optional[str] = Query(None, description="Date filter YYYY-MM-DD"),
    start_date: Optional[str] = Query(None, description="Start date filter YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date filter YYYY-MM-DD"),
    category: Optional[str] = Query(None, description="Category filter"),
    tag: Optional[str] = Query(None, description="Tag filter"),
    mood: Optional[str] = Query(None, description="Mood filter"),
    archived: Optional[bool] = Query(False, description="Include or filter archived"),
    q: Optional[str] = Query(None, description="Text search filter"),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": current_user["id"]}
    if archived is not None:
        query["archived"] = archived

    if date:
        query["date"] = date
    elif start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}
    elif end_date:
        query["date"] = {"$lte": end_date}

    if category:
        query["category"] = category
    if mood:
        query["mood"] = mood

    cursor = db.journal_entries.find(query).sort([("date", -1), ("time", -1), ("created_at", -1)])
    docs = await cursor.to_list(length=1000)

    # In-memory secondary filters for tags and search query if supplied
    results = []
    for d in docs:
        if tag and tag not in d.get("tags", []):
            continue
        if q:
            q_lower = q.lower()
            text_corpus = (
                d.get("title", "") + " " +
                d.get("content", "") + " " +
                " ".join(d.get("tags", [])) + " " +
                " ".join(d.get("people_mentioned", [])) + " " +
                " ".join(d.get("achievements", [])) + " " +
                " ".join(d.get("lessons_learned", []))
            ).lower()
            if q_lower not in text_corpus:
                continue
        results.append(JournalEntryResponse(**d))
    return results

@router.get("/dates/{date}", response_model=List[JournalEntryResponse])
async def get_entries_by_date(
    date: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    cursor = db.journal_entries.find({
        "user_id": current_user["id"],
        "date": date,
        "archived": False
    }).sort([("time", 1), ("created_at", 1)])
    docs = await cursor.to_list(length=100)
    return [JournalEntryResponse(**d) for d in docs]

@router.get("/calendar")
async def get_journal_calendar(
    year: Optional[int] = Query(None),
    month: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Returns calendar data: list of dates that have entries, entry counts, and mood overview."""
    db = get_db()
    cursor = db.journal_entries.find({
        "user_id": current_user["id"],
        "archived": False
    })
    docs = await cursor.to_list(length=2000)

    date_map = {}
    for d in docs:
        d_str = d.get("date")
        if not d_str:
            continue
        if year and int(d_str[:4]) != year:
            continue
        if month and int(d_str[5:7]) != month:
            continue

        if d_str not in date_map:
            date_map[d_str] = {
                "date": d_str,
                "entry_count": 0,
                "total_words": 0,
                "moods": [],
                "categories": set(),
                "has_entries": True
            }
        date_map[d_str]["entry_count"] += 1
        date_map[d_str]["total_words"] += d.get("word_count", 0)
        if d.get("mood"):
            date_map[d_str]["moods"].append(d["mood"])
        if d.get("category"):
            date_map[d_str]["categories"].add(d["category"])

    calendar_days = []
    for d_str, data in date_map.items():
        data["categories"] = list(data["categories"])
        calendar_days.append(data)

    calendar_days.sort(key=lambda x: x["date"])
    return {
        "calendar_days": calendar_days,
        "total_active_days": len(calendar_days)
    }

@router.get("/search")
async def search_journal(
    q: str = Query(..., min_length=1, description="Search term or phrase"),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": current_user["id"], "archived": False}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    if category:
        query["category"] = category

    cursor = db.journal_entries.find(query).sort("date", -1)
    docs = await cursor.to_list(length=1000)

    q_lower = q.lower()
    matches = []
    for d in docs:
        if tag and tag not in d.get("tags", []):
            continue
        content = d.get("content", "")
        title = d.get("title", "")
        tags_str = " ".join(d.get("tags", []))
        people_str = " ".join(d.get("people_mentioned", []))
        lessons_str = " ".join(d.get("lessons_learned", []))

        full_text = f"{title} {content} {tags_str} {people_str} {lessons_str}".lower()
        if q_lower in full_text:
            # Generate snippet
            idx = content.lower().find(q_lower)
            snippet = ""
            if idx >= 0:
                start_idx = max(0, idx - 40)
                end_idx = min(len(content), idx + len(q) + 60)
                snippet = ("..." if start_idx > 0 else "") + content[start_idx:end_idx] + ("..." if end_idx < len(content) else "")
            else:
                snippet = content[:100] + ("..." if len(content) > 100 else "")

            matches.append({
                "entry": JournalEntryResponse(**d),
                "snippet": snippet,
                "matched_in": "title" if q_lower in title.lower() else "content"
            })

    return {
        "query": q,
        "total_results": len(matches),
        "results": matches
    }

@router.get("/export")
async def export_journal(
    format: str = Query("markdown", description="markdown or json"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    query = {"user_id": current_user["id"], "archived": False}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}

    cursor = db.journal_entries.find(query).sort([("date", 1), ("time", 1)])
    docs = await cursor.to_list(length=5000)

    if format.lower() == "json":
        return [JournalEntryResponse(**d).model_dump() for d in docs]

    # Markdown format export
    md_lines = [
        f"# LIFEOS — Personal Life Journal Archive",
        f"**User:** {current_user.get('name', 'User')} | **Exported On:** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"**Entries Count:** {len(docs)}",
        "\n---\n"
    ]

    for d in docs:
        time_str = f" at {d['time']}" if d.get("time") else ""
        mood_str = f" | Mood: {d['mood']}" if d.get("mood") else ""
        category_str = f" | Category: {d.get('category', 'Personal')}"
        md_lines.append(f"## {d['title']}")
        md_lines.append(f"*{d['date']}{time_str}{category_str}{mood_str}*\n")
        md_lines.append(d.get("content", ""))
        md_lines.append("")

        if d.get("achievements"):
            md_lines.append(f"**Achievements:** " + ", ".join(d["achievements"]))
        if d.get("challenges"):
            md_lines.append(f"**Challenges:** " + ", ".join(d["challenges"]))
        if d.get("lessons_learned"):
            md_lines.append(f"**Lessons Learned:** " + ", ".join(d["lessons_learned"]))
        if d.get("gratitude_notes"):
            md_lines.append(f"**Gratitude:** " + ", ".join(d["gratitude_notes"]))
        if d.get("tags"):
            md_lines.append(f"**Tags:** #" + " #".join(d["tags"]))
        md_lines.append("\n---\n")

    md_text = "\n".join(md_lines)
    return Response(content=md_text, media_type="text/markdown")

@router.post("", response_model=JournalEntryResponse)
async def create_journal_entry(
    entry: JournalEntryCreate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    word_count = count_words(entry.content)

    doc = entry.model_dump()
    doc["id"] = entry_id
    doc["user_id"] = current_user["id"]
    doc["word_count"] = word_count
    doc["archived"] = False
    doc["created_at"] = now
    doc["updated_at"] = now

    await db.journal_entries.insert_one(doc)
    return JournalEntryResponse(**doc)

@router.get("/{entry_id}", response_model=JournalEntryResponse)
async def get_journal_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    doc = await db.journal_entries.find_one({"id": entry_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    return JournalEntryResponse(**doc)

@router.put("/{entry_id}", response_model=JournalEntryResponse)
async def update_journal_entry(
    entry_id: str,
    entry_update: JournalEntryUpdate,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    existing = await db.journal_entries.find_one({"id": entry_id, "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")

    update_data = {k: v for k, v in entry_update.model_dump().items() if v is not None}
    if "content" in update_data:
        update_data["word_count"] = count_words(update_data["content"])

    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.journal_entries.update_one(
        {"id": entry_id, "user_id": current_user["id"]},
        {"$set": update_data}
    )

    updated_doc = await db.journal_entries.find_one({"id": entry_id, "user_id": current_user["id"]})
    return JournalEntryResponse(**updated_doc)

@router.delete("/{entry_id}")
async def delete_journal_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    res = await db.journal_entries.delete_one({"id": entry_id, "user_id": current_user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    return {"message": "Journal entry deleted successfully", "id": entry_id}

@router.post("/{entry_id}/archive")
async def toggle_archive_journal_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    doc = await db.journal_entries.find_one({"id": entry_id, "user_id": current_user["id"]})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")

    new_archived = not doc.get("archived", False)
    await db.journal_entries.update_one(
        {"id": entry_id, "user_id": current_user["id"]},
        {"$set": {"archived": new_archived, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"id": entry_id, "archived": new_archived}
