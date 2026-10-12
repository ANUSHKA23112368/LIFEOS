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
async def test_health_check(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

@pytest.mark.asyncio
async def test_register_and_login_flow(client):
    email = "researcher@lifeos.app"
    password = "StrongPassword123!"
    
    # 1. Register
    reg_resp = await client.post("/api/auth/register", json={
        "name": "Jordan Lee",
        "email": email,
        "password": password
    })
    assert reg_resp.status_code == 200
    token_data = reg_resp.json()
    assert "access_token" in token_data
    assert token_data["user"]["email"] == email
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get profile
    me_resp = await client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["name"] == "Jordan Lee"

    # 3. Create Task
    task_resp = await client.post("/api/tasks", headers=headers, json={
        "title": "Analyze Quantum Circuit",
        "priority": "high",
        "estimated_duration_minutes": 45
    })
    assert task_resp.status_code == 200
    task_id = task_resp.json()["id"]

    # 4. Create Activity
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    act_resp = await client.post("/api/activities", headers=headers, json={
        "title": "Quantum Circuit Simulation",
        "category": "deep_work",
        "start_time": f"{today_str}T09:00:00Z",
        "end_time": f"{today_str}T10:00:00Z",
        "date": today_str,
        "record_type": "actual",
        "linked_task_id": task_id
    })
    assert act_resp.status_code == 200
    assert act_resp.json()["duration_minutes"] == 60

    # 5. Get Analytics
    analytics_resp = await client.get("/api/analytics/summary?timeframe=today", headers=headers)
    assert analytics_resp.status_code == 200
    analytics_data = analytics_resp.json()
    assert analytics_data["total_recorded_minutes"] == 60
    assert analytics_data["tasks_total"] == 1

    # 6. Ask AI Analyst
    ai_resp = await client.post("/api/ai/query", headers=headers, json={
        "question": "How did I spend my time today?",
        "timeframe": "today"
    })
    assert ai_resp.status_code == 200
    ai_data = ai_resp.json()
    assert len(ai_data["insights"]) > 0
    assert ai_data["calculated_context"]["recorded_minutes"] == 60
