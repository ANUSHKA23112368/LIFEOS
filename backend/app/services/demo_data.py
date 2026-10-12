from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
import uuid

class DemoDataService:
    """Provides explicitly labeled sample data for product exploration."""

    @staticmethod
    def generate_demo_dataset(user_id: str, today_str: str) -> Dict[str, List[Dict[str, Any]]]:
        now = datetime.now(timezone.utc)
        today = datetime.strptime(today_str, "%Y-%m-%d")
        
        # Activities (Planned vs Actual on 24-hour timeline)
        activities = [
            # Morning routine
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Morning Routine & Healthy Breakfast",
                "description": "Mindful wake up, hydration, and nutritional breakfast",
                "category": "meals",
                "start_time": f"{today_str}T07:30:00Z",
                "end_time": f"{today_str}T08:15:00Z",
                "date": today_str,
                "timezone": "UTC",
                "record_type": "actual",
                "source": "manual",
                "duration_minutes": 45,
                "tags": ["morning", "health"],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            # Planned study / work block
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Deep Work: LIFEOS System Design",
                "description": "Complete architecture draft and database index planning",
                "category": "deep_work",
                "start_time": f"{today_str}T09:00:00Z",
                "end_time": f"{today_str}T11:00:00Z",
                "date": today_str,
                "timezone": "UTC",
                "record_type": "planned",
                "source": "schedule",
                "duration_minutes": 120,
                "tags": ["deep-work", "architecture"],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            # Actual recorded study / work block (took slightly longer!)
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Deep Work: LIFEOS System Design",
                "description": "Finished schema models and core engine",
                "category": "deep_work",
                "start_time": f"{today_str}T09:15:00Z",
                "end_time": f"{today_str}T11:45:00Z",
                "date": today_str,
                "timezone": "UTC",
                "record_type": "actual",
                "source": "timer",
                "duration_minutes": 150,
                "tags": ["deep-work", "architecture"],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            # Planned lunch & walk
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Lunch & Outdoor Walk",
                "description": "Rest eyes, healthy lunch, fresh air",
                "category": "meals",
                "start_time": f"{today_str}T12:00:00Z",
                "end_time": f"{today_str}T13:00:00Z",
                "date": today_str,
                "timezone": "UTC",
                "record_type": "planned",
                "source": "schedule",
                "duration_minutes": 60,
                "tags": ["rest", "wellness"],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Lunch & Outdoor Walk",
                "description": "Actual lunch break and 20 min walk",
                "category": "meals",
                "start_time": f"{today_str}T12:00:00Z",
                "end_time": f"{today_str}T12:50:00Z",
                "date": today_str,
                "timezone": "UTC",
                "record_type": "actual",
                "source": "manual",
                "duration_minutes": 50,
                "tags": ["rest", "wellness"],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            # Afternoon study / learning
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Algorithms & Distributed Systems",
                "description": "Study chapter 4 on consistency and fault tolerance",
                "category": "study",
                "start_time": f"{today_str}T14:00:00Z",
                "end_time": f"{today_str}T16:00:00Z",
                "date": today_str,
                "timezone": "UTC",
                "record_type": "actual",
                "source": "timer",
                "duration_minutes": 120,
                "tags": ["study", "learning"],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            # Evening workout
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Strength Training & Stretching",
                "description": "Upper body workout and mobility cool down",
                "category": "exercise",
                "start_time": f"{today_str}T17:30:00Z",
                "end_time": f"{today_str}T18:30:00Z",
                "date": today_str,
                "timezone": "UTC",
                "record_type": "actual",
                "source": "manual",
                "duration_minutes": 60,
                "tags": ["fitness", "strength"],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        ]

        # Tasks
        tasks = [
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Complete LIFEOS Database Architecture",
                "description": "Define MongoDB document schemas and indexes",
                "status": "completed",
                "priority": "urgent",
                "category": "deep_work",
                "estimated_duration_minutes": 90,
                "actual_duration_minutes": 115,
                "deadline": f"{today_str}T18:00:00Z",
                "subtasks": [
                    {"id": str(uuid.uuid4()), "title": "Design user schema", "completed": True},
                    {"id": str(uuid.uuid4()), "title": "Add index specifications", "completed": True},
                    {"id": str(uuid.uuid4()), "title": "Add in-memory fallback", "completed": True}
                ],
                "tags": ["backend", "database"],
                "created_at": now.isoformat(),
                "completed_at": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Review Distributed Systems Chapter 4",
                "description": "Write notes on consensus and state machine replication",
                "status": "completed",
                "priority": "high",
                "category": "study",
                "estimated_duration_minutes": 60,
                "actual_duration_minutes": 75,
                "deadline": f"{today_str}T20:00:00Z",
                "subtasks": [
                    {"id": str(uuid.uuid4()), "title": "Read pages 120-145", "completed": True},
                    {"id": str(uuid.uuid4()), "title": "Summarize key algorithms", "completed": True}
                ],
                "tags": ["study", "reading"],
                "created_at": now.isoformat(),
                "completed_at": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Draft Weekly Reflection Report",
                "description": "Synthesize plan vs actual trends for the past 7 days",
                "status": "in_progress",
                "priority": "medium",
                "category": "deep_work",
                "estimated_duration_minutes": 45,
                "actual_duration_minutes": 20,
                "deadline": f"{today_str}T22:00:00Z",
                "subtasks": [
                    {"id": str(uuid.uuid4()), "title": "Review recorded hours", "completed": True},
                    {"id": str(uuid.uuid4()), "title": "Write insights paragraph", "completed": False}
                ],
                "tags": ["review", "planning"],
                "created_at": now.isoformat(),
                "completed_at": None
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Schedule Dental Checkup",
                "description": "Routine bi-annual appointment",
                "status": "todo",
                "priority": "low",
                "category": "chores",
                "estimated_duration_minutes": 15,
                "actual_duration_minutes": 0,
                "deadline": f"{(today + timedelta(days=2)).strftime('%Y-%m-%d')}T17:00:00Z",
                "subtasks": [],
                "tags": ["admin"],
                "created_at": now.isoformat(),
                "completed_at": None
            }
        ]

        # Focus Sessions
        focus_sessions = [
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "start_time": f"{today_str}T09:15:00Z",
                "end_time": f"{today_str}T10:00:00Z",
                "intended_duration_minutes": 45,
                "actual_duration_minutes": 45,
                "status": "completed",
                "category": "deep_work",
                "interruptions": 1,
                "notes": "Focused sprint on backend models",
                "reflection": "High flow state once notifications were muted.",
                "created_at": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "start_time": f"{today_str}T14:15:00Z",
                "end_time": f"{today_str}T15:05:00Z",
                "intended_duration_minutes": 50,
                "actual_duration_minutes": 50,
                "status": "completed",
                "category": "study",
                "interruptions": 0,
                "notes": "Reading and taking notes on consensus algorithms",
                "reflection": "Great uninterrupted focus period.",
                "created_at": now.isoformat()
            }
        ]

        # Habits
        habits = [
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": "Daily Strength / Cardio Workout",
                "description": "At least 30 minutes of physical exercise",
                "category": "exercise",
                "frequency": "daily",
                "target": 1.0,
                "unit": "times",
                "start_date": (today - timedelta(days=14)).strftime("%Y-%m-%d"),
                "status": "active",
                "color": "#10B981",
                "current_streak": 5,
                "longest_streak": 12,
                "completions": [
                    {"date": (today - timedelta(days=i)).strftime("%Y-%m-%d"), "value": 1.0, "completed": True}
                    for i in range(5)
                ],
                "created_at": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": "Read Non-Fiction Book",
                "description": "Read 20 pages of technical or personal growth material",
                "category": "study",
                "frequency": "daily",
                "target": 20.0,
                "unit": "pages",
                "start_date": (today - timedelta(days=10)).strftime("%Y-%m-%d"),
                "status": "active",
                "color": "#8B5CF6",
                "current_streak": 4,
                "longest_streak": 8,
                "completions": [
                    {"date": (today - timedelta(days=i)).strftime("%Y-%m-%d"), "value": 20.0, "completed": True}
                    for i in range(4)
                ],
                "created_at": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "name": "Evening Digital Wind-down",
                "description": "Screens off 45 minutes before sleep",
                "category": "sleep",
                "frequency": "daily",
                "target": 1.0,
                "unit": "times",
                "start_date": (today - timedelta(days=7)).strftime("%Y-%m-%d"),
                "status": "active",
                "color": "#6366F1",
                "current_streak": 3,
                "longest_streak": 6,
                "completions": [
                    {"date": (today - timedelta(days=i)).strftime("%Y-%m-%d"), "value": 1.0, "completed": True}
                    for i in range(3)
                ],
                "created_at": now.isoformat()
            }
        ]

        # Goals
        goals = [
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Master Full-Stack System Architecture & AI Integration",
                "description": "Build high-reliability production applications with modern Python and React",
                "category": "Skills",
                "start_date": (today - timedelta(days=30)).strftime("%Y-%m-%d"),
                "target_date": (today + timedelta(days=60)).strftime("%Y-%m-%d"),
                "status": "active",
                "success_criteria": "Deploy 3 production-grade intelligent systems with automated testing",
                "milestones": [
                    {"id": str(uuid.uuid4()), "title": "Complete Backend Architecture & Data Layer", "completed": True, "completed_at": now.isoformat()},
                    {"id": str(uuid.uuid4()), "title": "Build Interactive 24-Hour Timeline Frontend", "completed": True, "completed_at": now.isoformat()},
                    {"id": str(uuid.uuid4()), "title": "Integrate Provider-Agnostic AI Life Analyst", "completed": False},
                    {"id": str(uuid.uuid4()), "title": "Achieve 95%+ Automated Test Coverage", "completed": False}
                ],
                "self_assessment_progress": 50.0,
                "color": "#3B82F6",
                "review_notes": "Significant progress on architecture and core calculation engines.",
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Establish Sustainable Health & Energy Routine",
                "description": "Consistent sleep schedule, daily exercise, and regular nutrition",
                "category": "Fitness",
                "start_date": (today - timedelta(days=14)).strftime("%Y-%m-%d"),
                "target_date": (today + timedelta(days=90)).strftime("%Y-%m-%d"),
                "status": "active",
                "success_criteria": "Maintain 85%+ habit consistency over 3 consecutive months",
                "milestones": [
                    {"id": str(uuid.uuid4()), "title": "Workout 5 days/week for 2 weeks straight", "completed": True, "completed_at": now.isoformat()},
                    {"id": str(uuid.uuid4()), "title": "Sleep by 23:00 on weekdays consistently", "completed": False},
                    {"id": str(uuid.uuid4()), "title": "Run a 5K under 28 minutes", "completed": False}
                ],
                "self_assessment_progress": 33.3,
                "color": "#10B981",
                "review_notes": "Strength workouts are solid, need to tighten up bedtime routine.",
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        ]

        # Daily Review
        daily_reviews = [
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "date": today_str,
                "accomplishments": "Completed core LIFEOS system design and finished Chapter 4 on distributed consensus.",
                "challenges_faced": "Slightly under-estimated database model edge cases which pushed the morning block by 30 mins.",
                "what_went_well": "Deep work focus timer kept me completely off social media.",
                "distractions_encountered": "Midday email notifications.",
                "focus_helpers": "Noise-cancelling headphones and lo-fi playlist.",
                "tomorrow_intentions": "Implement frontend timeline and test edge-case midnight crossing.",
                "mood_rating": 4,
                "energy_rating": 4,
                "verified_planned_minutes": 180,
                "verified_actual_minutes": 375,
                "verified_tasks_completed": 2,
                "verified_tasks_remaining": 2,
                "verified_focus_minutes": 95,
                "verified_habits_completed": 2,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        ]

        return {
            "activities": activities,
            "tasks": tasks,
            "focus_sessions": focus_sessions,
            "habits": habits,
            "goals": goals,
            "daily_reviews": daily_reviews
        }
