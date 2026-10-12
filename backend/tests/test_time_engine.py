import pytest
from datetime import datetime, timezone
from app.services.time_engine import TimeEngine

def test_duration_calculation():
    start = "2026-10-13T09:00:00Z"
    end = "2026-10-13T10:30:00Z"
    duration = TimeEngine.calculate_duration_minutes(start, end)
    assert duration == 90

def test_midnight_crossing_duration():
    start = "2026-10-13T23:30:00Z"
    end = "2026-10-14T01:15:00Z"
    duration = TimeEngine.calculate_duration_minutes(start, end)
    assert duration == 105

def test_detect_overlaps():
    activities = [
        {
            "id": "act-1",
            "title": "Study Math",
            "record_type": "actual",
            "start_time": "2026-10-13T10:00:00Z",
            "end_time": "2026-10-13T11:30:00Z"
        },
        {
            "id": "act-2",
            "title": "Call Colleague",
            "record_type": "actual",
            "start_time": "2026-10-13T11:00:00Z",
            "end_time": "2026-10-13T12:00:00Z"
        },
        {
            "id": "act-3",
            "title": "Lunch",
            "record_type": "actual",
            "start_time": "2026-10-13T12:30:00Z",
            "end_time": "2026-10-13T13:30:00Z"
        }
    ]
    overlaps = TimeEngine.detect_overlaps(activities)
    assert len(overlaps) == 1
    assert overlaps[0]["activity_1_id"] == "act-1"
    assert overlaps[0]["activity_2_id"] == "act-2"
    assert overlaps[0]["overlap_duration_minutes"] == 30

def test_find_unlogged_gaps():
    activities = [
        {
            "id": "act-1",
            "title": "Deep Work",
            "record_type": "actual",
            "start_time": "2026-10-13T09:00:00Z",
            "end_time": "2026-10-13T11:00:00Z"
        },
        {
            "id": "act-2",
            "title": "Workout",
            "record_type": "actual",
            "start_time": "2026-10-13T13:00:00Z",
            "end_time": "2026-10-13T14:00:00Z"
        }
    ]
    gaps = TimeEngine.find_unlogged_gaps(
        date_str="2026-10-13",
        activities=activities,
        wake_time="08:00",
        sleep_time="22:00",
        min_gap_minutes=30
    )
    # Gap 1: 08:00 to 09:00 (60m)
    # Gap 2: 11:00 to 13:00 (120m)
    # Gap 3: 14:00 to 22:00 (480m)
    assert len(gaps) == 3
    assert gaps[0]["duration_minutes"] == 60
    assert gaps[1]["duration_minutes"] == 120
    assert "unlogged" in gaps[1]["suggestion"].lower()
