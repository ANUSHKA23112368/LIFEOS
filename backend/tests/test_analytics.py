import pytest
from app.services.analytics_engine import AnalyticsEngine

def test_deterministic_analytics_calculation():
    activities = [
        {
            "id": "1",
            "title": "Study Linear Algebra",
            "category": "study",
            "record_type": "planned",
            "duration_minutes": 60,
            "start_time": "2026-10-13T09:00:00Z",
            "end_time": "2026-10-13T10:00:00Z"
        },
        {
            "id": "2",
            "title": "Study Linear Algebra",
            "category": "study",
            "record_type": "actual",
            "duration_minutes": 90,
            "start_time": "2026-10-13T09:00:00Z",
            "end_time": "2026-10-13T10:30:00Z"
        },
        {
            "id": "3",
            "title": "Evening Run",
            "category": "exercise",
            "record_type": "actual",
            "duration_minutes": 30,
            "start_time": "2026-10-13T18:00:00Z",
            "end_time": "2026-10-13T18:30:00Z"
        }
    ]
    tasks = [
        {
            "id": "t1",
            "title": "Problem Set 4",
            "status": "completed",
            "estimated_duration_minutes": 60,
            "actual_duration_minutes": 90
        },
        {
            "id": "t2",
            "title": "Email Professor",
            "status": "todo",
            "estimated_duration_minutes": 15,
            "actual_duration_minutes": 0
        }
    ]
    focus_sessions = [
        {
            "id": "f1",
            "status": "completed",
            "actual_duration_minutes": 50,
            "interruptions": 1
        }
    ]
    habits = []
    goals = []
    custom_categories = [
        {"id": "study", "name": "Study & Learning", "color": "#8B5CF6"},
        {"id": "exercise", "name": "Exercise & Health", "color": "#10B981"}
    ]

    res = AnalyticsEngine.compute_analytics(
        start_date="2026-10-13",
        end_date="2026-10-13",
        date_range_label="Today",
        activities=activities,
        tasks=tasks,
        focus_sessions=focus_sessions,
        habits=habits,
        goals=goals,
        custom_categories=custom_categories
    )

    assert res.total_recorded_minutes == 120  # 90 study + 30 exercise
    assert res.total_planned_minutes == 60     # 60 study
    assert res.time_variance_minutes == 60     # 120 - 60
    assert res.tasks_total == 2
    assert res.tasks_completed == 1
    assert res.task_completion_rate == 50.0
    assert res.total_focus_minutes == 50
    assert len(res.categories) == 2
    # Verify pattern detected
    assert any(p.id == "p_variance" for p in res.patterns)
