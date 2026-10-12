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

        # Generate 29 preceding days of history for monthly summary charts
        for d_offset in range(1, 30):
            day_dt = today - timedelta(days=d_offset)
            d_str = day_dt.strftime("%Y-%m-%d")

            # 1. Planned deep work
            p_mins = 120 if d_offset % 7 < 5 else 60
            activities.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Deep Work Sprint",
                "category": "deep_work",
                "start_time": f"{d_str}T09:00:00Z",
                "end_time": f"{d_str}T{9 + (p_mins // 60):02d}:{p_mins % 60:02d}:00Z",
                "date": d_str,
                "timezone": "UTC",
                "record_type": "planned",
                "source": "schedule",
                "duration_minutes": p_mins,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })

            # 2. Actual deep work (with realistic variance)
            variance = ((d_offset * 13) % 45) - 15  # -15 to +30 mins variance
            a_mins = max(45, p_mins + variance)
            activities.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Deep Work Sprint",
                "category": "deep_work",
                "start_time": f"{d_str}T09:15:00Z",
                "end_time": f"{d_str}T{9 + (a_mins // 60):02d}:{a_mins % 60:02d}:00Z",
                "date": d_str,
                "timezone": "UTC",
                "record_type": "actual",
                "source": "timer",
                "duration_minutes": a_mins,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })

            # 3. Learning / study
            s_mins = 60 + ((d_offset * 7) % 40)
            activities.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Skill Practice & Reading",
                "category": "study",
                "start_time": f"{d_str}T14:30:00Z",
                "end_time": f"{d_str}T{14 + (s_mins // 60):02d}:{s_mins % 60:02d}:00Z",
                "date": d_str,
                "timezone": "UTC",
                "record_type": "actual",
                "source": "manual",
                "duration_minutes": s_mins,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })

            # 4. Exercise (planned & actual on weekdays and select weekend days)
            if d_offset % 7 not in (0, 6) or d_offset % 3 == 0:
                activities.append({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "title": "Cardio & Strength Training",
                    "category": "exercise",
                    "start_time": f"{d_str}T17:30:00Z",
                    "end_time": f"{d_str}T18:15:00Z",
                    "date": d_str,
                    "timezone": "UTC",
                    "record_type": "planned",
                    "source": "schedule",
                    "duration_minutes": 45,
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat()
                })
                activities.append({
                    "id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "title": "Cardio & Strength Training",
                    "category": "exercise",
                    "start_time": f"{d_str}T17:35:00Z",
                    "end_time": f"{d_str}T18:25:00Z",
                    "date": d_str,
                    "timezone": "UTC",
                    "record_type": "actual",
                    "source": "manual",
                    "duration_minutes": 50,
                    "created_at": now.isoformat(),
                    "updated_at": now.isoformat()
                })

            # 5. Meals / Nourishment
            activities.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Healthy Meals & Nutrition",
                "category": "meals",
                "start_time": f"{d_str}T12:00:00Z",
                "end_time": f"{d_str}T13:00:00Z",
                "date": d_str,
                "timezone": "UTC",
                "record_type": "planned",
                "source": "schedule",
                "duration_minutes": 60,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })
            activities.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Healthy Meals & Nutrition",
                "category": "meals",
                "start_time": f"{d_str}T12:05:00Z",
                "end_time": f"{d_str}T12:55:00Z",
                "date": d_str,
                "timezone": "UTC",
                "record_type": "actual",
                "source": "manual",
                "duration_minutes": 50,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })

            # 6. Leisure / Reading / Wind-down
            activities.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Wind-down & Reading",
                "category": "leisure",
                "start_time": f"{d_str}T20:30:00Z",
                "end_time": f"{d_str}T21:15:00Z",
                "date": d_str,
                "timezone": "UTC",
                "record_type": "actual",
                "source": "manual",
                "duration_minutes": 45,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })

            # 5. Focus sessions
            foc_dur = 45 if d_offset % 2 == 0 else 50
            focus_sessions.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "start_time": f"{d_str}T09:15:00Z",
                "end_time": f"{d_str}T10:00:00Z",
                "intended_duration_minutes": foc_dur,
                "actual_duration_minutes": foc_dur,
                "status": "completed",
                "category": "deep_work",
                "interruptions": (d_offset % 3),
                "notes": f"Focus sprint day -{d_offset}",
                "reflection": "Solid flow and progress.",
                "created_at": now.isoformat()
            })

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

        # Add completed tasks for preceding days
        for d_offset in range(1, 30):
            day_dt = today - timedelta(days=d_offset)
            d_str = day_dt.strftime("%Y-%m-%d")
            tasks.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": f"Sprint Task #{30 - d_offset}",
                "description": "Completed project development increment",
                "status": "completed",
                "priority": "medium" if d_offset % 2 == 0 else "high",
                "category": "deep_work" if d_offset % 2 == 0 else "study",
                "estimated_duration_minutes": 45,
                "actual_duration_minutes": 55,
                "deadline": f"{d_str}T18:00:00Z",
                "subtasks": [],
                "tags": ["sprint"],
                "created_at": now.isoformat(),
                "completed_at": f"{d_str}T17:00:00Z"
            })

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
                "longest_streak": 14,
                "completions": [
                    {"date": (today - timedelta(days=i)).strftime("%Y-%m-%d"), "value": 1.0, "completed": (i % 6 != 0)}
                    for i in range(30)
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
                "start_date": (today - timedelta(days=30)).strftime("%Y-%m-%d"),
                "status": "active",
                "color": "#8B5CF6",
                "current_streak": 4,
                "longest_streak": 11,
                "completions": [
                    {"date": (today - timedelta(days=i)).strftime("%Y-%m-%d"), "value": 20.0, "completed": (i % 5 != 0)}
                    for i in range(30)
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
                "start_date": (today - timedelta(days=30)).strftime("%Y-%m-%d"),
                "status": "active",
                "color": "#6366F1",
                "current_streak": 3,
                "longest_streak": 9,
                "completions": [
                    {"date": (today - timedelta(days=i)).strftime("%Y-%m-%d"), "value": 1.0, "completed": (i % 4 != 0)}
                    for i in range(30)
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

        # Journal Entries (Multiple per day across history)
        journal_entries = [
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Morning Clarity & System Intentions",
                "date": today_str,
                "time": "08:00",
                "content": "Woke up energized at 07:15. Hydrated with 500ml water and had a wholesome breakfast. Today's primary focus is completing the core architecture and interactive canvas. Setting a firm personal boundary: no notification browsing before midday.",
                "category": "Personal",
                "tags": ["morning", "intentions", "focus"],
                "mood": "great",
                "energy_rating": 5,
                "people_mentioned": [],
                "events_mentioned": ["Morning coffee ritual"],
                "achievements": ["Woke up promptly without snoozing", "Planned day before opening inbox"],
                "challenges": [],
                "lessons_learned": ["Mornings without screen exposure feel twice as calm."],
                "gratitude_notes": ["Crisp morning light and clean workspace."],
                "word_count": 48,
                "archived": False,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Distributed Systems Insights & Architecture",
                "date": today_str,
                "time": "15:30",
                "content": "Had an intense study session on Chapter 4. Key breakthrough: monotonic sequence numbers and write-ahead logging guarantee deterministic state recovery even during sudden crashes. Applying this directly to our client-side persistence.",
                "category": "Study",
                "tags": ["learning", "algorithms", "systems"],
                "mood": "good",
                "energy_rating": 4,
                "people_mentioned": ["Professor Vance"],
                "events_mentioned": ["Chapter 4 study sprint"],
                "achievements": ["Completed 25 pages of dense technical reading"],
                "challenges": ["Proof of safety required re-reading 3 times."],
                "lessons_learned": ["Break complex proofs into small invariant statements."],
                "gratitude_notes": ["Access to clear reference textbooks."],
                "word_count": 45,
                "archived": False,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": "Evening Reflection & Grounded Progress",
                "date": today_str,
                "time": "21:45",
                "content": "Reflecting on today's execution: finished 2 key tasks, logged 95 minutes of focused flow, and completed strength training. The morning session ran 30 minutes over plan, which proves the need for 15-minute buffers between blocks. Feeling grateful and centered.",
                "category": "Reflection",
                "tags": ["reflection", "evening", "wellness"],
                "mood": "great",
                "energy_rating": 4,
                "people_mentioned": [],
                "events_mentioned": ["Evening mobility workout"],
                "achievements": ["Logged 95m focus", "Completed strength routine"],
                "challenges": ["Slight afternoon energy dip around 14:00."],
                "lessons_learned": ["A 10-minute walk after lunch completely eliminates the afternoon slump."],
                "gratitude_notes": ["Consistent progress on long-term personal goals."],
                "word_count": 52,
                "archived": False,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            }
        ]

        # Add entries on previous days for search & calendar exploration
        for d_offset in [1, 2, 4, 7, 10, 14, 20]:
            past_dt = today - timedelta(days=d_offset)
            past_str = past_dt.strftime("%Y-%m-%d")
            journal_entries.append({
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": f"Daily Log & Reflection for {past_dt.strftime('%A, %b %d')}",
                "date": past_str,
                "time": "20:30",
                "content": f"Reviewing day -{d_offset}: sustained solid flow in deep work blocks, maintained consistent hydration, and pushed forward on software milestones. Every day of consistent tracking brings more clarity on personal energy rhythms.",
                "category": "Personal" if d_offset % 2 == 0 else "Study",
                "tags": ["daily-log", "progress", "habits"],
                "mood": "good" if d_offset % 3 != 0 else "great",
                "energy_rating": 4,
                "people_mentioned": [],
                "events_mentioned": [f"Day -{d_offset} focus blocks"],
                "achievements": [f"Completed day -{d_offset} scheduled tasks"],
                "challenges": ["Minor scheduling variances."],
                "lessons_learned": ["Consistency compounds over weeks."],
                "gratitude_notes": ["Good health and dedicated focus time."],
                "word_count": 42,
                "archived": False,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat()
            })

        return {
            "activities": activities,
            "tasks": tasks,
            "focus_sessions": focus_sessions,
            "habits": habits,
            "goals": goals,
            "daily_reviews": daily_reviews,
            "journal_entries": journal_entries
        }
