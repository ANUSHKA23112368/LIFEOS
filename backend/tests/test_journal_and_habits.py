from datetime import datetime, timezone
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import connect_to_database, close_database

@pytest_asyncio.fixture
async def client():
    await connect_to_database()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    await close_database()

@pytest.mark.asyncio
async def test_journal_multi_entry_search_and_export(client):
    # 1. Register User
    reg_resp = await client.post("/api/auth/register", json={
        "name": "Marcus Aurelius",
        "email": "marcus@rome.org",
        "password": "Meditations123!"
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 2. Create Entry 1: Morning Incident & Thought
    entry1_resp = await client.post("/api/journal", headers=headers, json={
        "title": "Morning Walk & Stoic Thoughts",
        "date": today_str,
        "time": "07:30",
        "content": "Walked in the gardens early. Observed how the morning light settles through the trees. Key reminder: control your response, not external circumstances.",
        "category": "Reflection",
        "tags": ["morning", "stoicism", "clarity"],
        "mood": "great",
        "energy_rating": 5,
        "achievements": ["Woke up early without hesitation"],
        "lessons_learned": ["Equanimity begins with mindful breathing"],
        "gratitude_notes": ["Peaceful morning air"]
    })
    assert entry1_resp.status_code == 200
    entry1 = entry1_resp.json()
    assert entry1["word_count"] > 10
    e1_id = entry1["id"]

    # 3. Create Entry 2: Afternoon Senate / Project Conversation
    entry2_resp = await client.post("/api/journal", headers=headers, json={
        "title": "Discussion on Legal Reform & Governance",
        "date": today_str,
        "time": "14:15",
        "content": "Intense dialogue during council meeting regarding grain distribution and civic logistics. Decided to grant amnesty to several farmers facing unjust levies.",
        "category": "Work",
        "tags": ["leadership", "justice", "civic"],
        "mood": "good",
        "energy_rating": 4,
        "people_mentioned": ["Claudius", "Senator Frontinus"],
        "achievements": ["Resolved grain supply impasse peacefully"],
        "lessons_learned": ["Patience in debate prevents reckless enforcement"]
    })
    assert entry2_resp.status_code == 200
    e2_id = entry2_resp.json()["id"]

    # 4. Verify Multiple Entries on the same date
    date_entries_resp = await client.get(f"/api/journal/dates/{today_str}", headers=headers)
    assert date_entries_resp.status_code == 200
    date_entries = date_entries_resp.json()
    assert len(date_entries) == 2
    assert date_entries[0]["time"] == "07:30"
    assert date_entries[1]["time"] == "14:15"

    # 5. Full-Text Search
    search_resp = await client.get("/api/journal/search?q=equanimity", headers=headers)
    assert search_resp.status_code == 200
    results = search_resp.json()["results"]
    assert len(results) >= 1
    assert results[0]["entry"]["id"] == e1_id

    # Search for person mentioned
    search_person_resp = await client.get("/api/journal/search?q=Claudius", headers=headers)
    assert search_person_resp.status_code == 200
    assert len(search_person_resp.json()["results"]) >= 1

    # 6. Journal Calendar Data
    cal_resp = await client.get("/api/journal/calendar", headers=headers)
    assert cal_resp.status_code == 200
    cal_data = cal_resp.json()
    assert cal_data["total_active_days"] >= 1
    today_cal = next(d for d in cal_data["calendar_days"] if d["date"] == today_str)
    assert today_cal["entry_count"] == 2
    assert "great" in today_cal["moods"]

    # 7. Export Markdown
    export_md_resp = await client.get("/api/journal/export?format=markdown", headers=headers)
    assert export_md_resp.status_code == 200
    assert "Morning Walk & Stoic Thoughts" in export_md_resp.text
    assert "Discussion on Legal Reform" in export_md_resp.text

    # 8. User Data Isolation Security Check
    # Register second user and verify they CANNOT see or edit Marcus's entries!
    reg2_resp = await client.post("/api/auth/register", json={
        "name": "Stranger",
        "email": "stranger@other.com",
        "password": "Password123!"
    })
    token2 = reg2_resp.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Stranger tries to access Marcus's entry by ID
    unauthorized_get = await client.get(f"/api/journal/{e1_id}", headers=headers2)
    assert unauthorized_get.status_code == 404

    # Stranger searches
    stranger_search = await client.get("/api/journal/search?q=equanimity", headers=headers2)
    assert stranger_search.json()["total_results"] == 0

@pytest.mark.asyncio
async def test_daily_summary_lifecycle(client):
    # Register user
    reg_resp = await client.post("/api/auth/register", json={
        "name": "Ada Lovelace",
        "email": "ada@analytical.engine",
        "password": "AnalyticalEngine1!"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Add activity
    await client.post("/api/activities", headers=headers, json={
        "title": "Bernoulli Numbers Algorithm Design",
        "category": "deep_work",
        "start_time": f"{today_str}T09:00:00Z",
        "end_time": f"{today_str}T11:30:00Z",
        "date": today_str,
        "record_type": "actual"
    })

    # Add journal entry
    await client.post("/api/journal", headers=headers, json={
        "title": "First Computer Algorithm",
        "date": today_str,
        "time": "11:45",
        "content": "Completed the table for calculating Bernoulli numbers on the Analytical Engine.",
        "achievements": ["Derived Note G algorithm"],
        "lessons_learned": ["The engine weaves algebraical patterns just as the Jacquard-loom weaves flowers."]
    })

    # Generate daily summary
    gen_resp = await client.post(f"/api/daily-summary/generate?date={today_str}", headers=headers)
    assert gen_resp.status_code == 200
    summary = gen_resp.json()
    assert summary["date"] == today_str
    assert any("Derived Note G" in a for a in summary["main_accomplishments"])
    assert any("Bernoulli" in e for e in summary["important_events"])
    assert any("Jacquard" in l for l in summary["lessons_and_ideas"])

    # User edits and saves summary
    summary["overview"] += " An epochal day in mathematical history."
    save_resp = await client.post("/api/daily-summary/save", headers=headers, json=summary)
    assert save_resp.status_code == 200
    assert save_resp.json()["overview"] == summary["overview"]

    # Verify saved retrieval
    saved_check = await client.get(f"/api/daily-summary/{today_str}", headers=headers)
    assert saved_check.status_code == 200
    assert saved_check.json()["saved"] is True
    assert saved_check.json()["summary"]["date"] == today_str

    # Export markdown
    export_resp = await client.get(f"/api/daily-summary/export/{today_str}", headers=headers)
    assert export_resp.status_code == 200
    assert "LIFEOS Daily Life Summary" in export_resp.text
    assert "Bernoulli Numbers" in export_resp.text

@pytest.mark.asyncio
async def test_advanced_habits_and_analytics(client):
    reg_resp = await client.post("/api/auth/register", json={
        "name": "Nikola Tesla",
        "email": "tesla@wardenclyffe.cc",
        "password": "AlternatingCurrent1!"
    })
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Create quantity-based habit with scheduled weekdays
    hab_resp = await client.post("/api/habits", headers=headers, json={
        "name": "Read Patent Applications",
        "category": "study",
        "habit_type": "quantity",
        "target": 15.0,
        "unit": "pages",
        "frequency": "scheduled",
        "selected_weekdays": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "start_date": today_str
    })
    assert hab_resp.status_code == 200
    h_id = hab_resp.json()["id"]

    # Check-in with actual quantity (exceeded target: 25 pages)
    checkin_resp = await client.post(f"/api/habits/{h_id}/checkin", headers=headers, json={
        "date": today_str,
        "value": 25.0,
        "completed": True,
        "notes": "Reviewed electromagnetic induction filings."
    })
    assert checkin_resp.status_code == 200
    assert checkin_resp.json()["completions"][0]["value"] == 25.0
    assert checkin_resp.json()["completions"][0]["status"] == "completed"

    # Habit Analytics Endpoint
    analytics_resp = await client.get(f"/api/habits/{h_id}/analytics?range_days=30", headers=headers)
    assert analytics_resp.status_code == 200
    adata = analytics_resp.json()
    assert adata["habit_id"] == h_id
    assert adata["target"] == 15.0
    assert "heatmap" in adata
    assert len(adata["heatmap"]) == 90
    assert len(adata["timeseries"]) == 30
    assert len(adata["insights"]) >= 1

    # Historical correction endpoint
    correct_resp = await client.put(f"/api/habits/{h_id}/history/{today_str}", headers=headers, json={
        "date": today_str,
        "value": 30.0,
        "completed": True,
        "notes": "Correction: actually read 30 pages"
    })
    assert correct_resp.status_code == 200
    assert correct_resp.json()["completions"][0]["value"] == 30.0
