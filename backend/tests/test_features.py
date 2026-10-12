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
async def test_focus_habits_goals_and_reviews_flow(client):
    # 1. Register user
    reg_resp = await client.post("/api/auth/register", json={
        "name": "Sarah Connor",
        "email": "sarah@lifeos.app",
        "password": "Password999!"
    })
    assert reg_resp.status_code == 200
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Start Focus Session
    foc_resp = await client.post("/api/focus/start", headers=headers, json={
        "intended_duration_minutes": 25,
        "category": "deep_work",
        "notes": "Testing focus resilience"
    })
    assert foc_resp.status_code == 200
    foc_id = foc_resp.json()["id"]
    assert foc_resp.json()["status"] == "running"

    # Active session check
    active_resp = await client.get("/api/focus/active", headers=headers)
    assert active_resp.status_code == 200
    assert active_resp.json()["id"] == foc_id

    # Complete session and convert to activity
    comp_resp = await client.put(f"/api/focus/{foc_id}", headers=headers, json={
        "status": "completed",
        "actual_duration_minutes": 25,
        "reflection": "Strong progress without interruptions",
        "convert_to_activity": True
    })
    assert comp_resp.status_code == 200
    assert comp_resp.json()["status"] == "completed"

    # Verify activity was automatically created from focus session!
    acts_resp = await client.get("/api/activities", headers=headers)
    assert acts_resp.status_code == 200
    acts = acts_resp.json()
    assert any(a.get("linked_focus_session_id") == foc_id for a in acts)

    # 3. Habits: create and check-in
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    hab_resp = await client.post("/api/habits", headers=headers, json={
        "name": "Daily Hydration",
        "frequency": "daily",
        "target": 8.0,
        "unit": "glasses",
        "start_date": today_str
    })
    assert hab_resp.status_code == 200
    hab_id = hab_resp.json()["id"]

    checkin_resp = await client.post(f"/api/habits/{hab_id}/checkin", headers=headers, json={
        "date": today_str,
        "value": 8.0,
        "completed": True
    })
    assert checkin_resp.status_code == 200
    assert checkin_resp.json()["current_streak"] == 1

    # 4. Goals: create and milestone completion
    goal_resp = await client.post("/api/goals", headers=headers, json={
        "title": "Publish Research Paper",
        "category": "Education",
        "start_date": today_str,
        "target_date": today_str,
        "milestones": [
            {"title": "Literature review", "completed": True},
            {"title": "Draft manuscript", "completed": False}
        ]
    })
    assert goal_resp.status_code == 200
    assert goal_resp.json()["calculated_progress"] == 50.0

    # 5. Daily Review submit
    rev_resp = await client.post("/api/daily-reviews", headers=headers, json={
        "date": today_str,
        "accomplishments": "Completed focus sprint and hydrated well.",
        "mood_rating": 5,
        "energy_rating": 4
    })
    assert rev_resp.status_code == 200
    assert rev_resp.json()["verified_focus_minutes"] >= 25
    assert rev_resp.json()["verified_habits_completed"] >= 1

    # 6. Monthly Report test
    monthly_resp = await client.get("/api/reports/monthly", headers=headers)
    assert monthly_resp.status_code == 200
    monthly_data = monthly_resp.json()
    assert monthly_data["report_type"] == "monthly"
    assert "daily_timeseries" in monthly_data
    assert "weekly_breakdown" in monthly_data
    assert "habit_matrix" in monthly_data
    assert "life_domains" in monthly_data
    assert "day_of_week_distribution" in monthly_data
    assert "executive_scorecard" in monthly_data
    assert "circadian_slots" in monthly_data
    assert len(monthly_data["daily_timeseries"]) >= 28
    assert len(monthly_data["day_of_week_distribution"]) == 7
    assert len(monthly_data["life_domains"]) == 6
