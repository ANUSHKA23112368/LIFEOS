from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.analytics_engine import AnalyticsEngine

router = APIRouter(prefix="/reports", tags=["Daily & Weekly Reports"])

@router.get("/daily")
async def get_daily_report(
    date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    today_str = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Fetch daily review
    review = await db.daily_reviews.find_one({"user_id": current_user["id"], "date": today_str})
    
    # Compute analytics for that single date
    act_cursor = db.activities.find({"user_id": current_user["id"], "date": today_str})
    activities = await act_cursor.to_list(length=100)

    task_cursor = db.tasks.find({"user_id": current_user["id"]})
    tasks = await task_cursor.to_list(length=200)

    foc_cursor = db.focus_sessions.find({"user_id": current_user["id"], "status": "completed"})
    focus = [f for f in await foc_cursor.to_list(length=100) if today_str in f.get("start_time", "")]

    habits = await db.habits.find({"user_id": current_user["id"]}).to_list(length=50)
    goals = await db.goals.find({"user_id": current_user["id"]}).to_list(length=50)

    categories = current_user.get("preferences", {}).get("custom_categories", [])

    analytics = AnalyticsEngine.compute_analytics(
        start_date=today_str,
        end_date=today_str,
        date_range_label=f"Daily Report ({today_str})",
        activities=activities,
        tasks=tasks,
        focus_sessions=focus,
        habits=habits,
        goals=goals,
        custom_categories=categories
    )

    return {
        "report_type": "daily",
        "date": today_str,
        "user_name": current_user["name"],
        "analytics": analytics,
        "review": review,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/weekly")
async def get_weekly_report(
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    end_dt = datetime.strptime(end_date, "%Y-%m-%d").date() if end_date else datetime.now(timezone.utc).date()
    start_dt = end_dt - timedelta(days=6)
    start_str = start_dt.strftime("%Y-%m-%d")
    end_str = end_dt.strftime("%Y-%m-%d")

    act_cursor = db.activities.find({"user_id": current_user["id"], "date": {"$gte": start_str, "$lte": end_str}})
    activities = await act_cursor.to_list(length=500)

    task_cursor = db.tasks.find({"user_id": current_user["id"]})
    tasks = await task_cursor.to_list(length=500)

    foc_cursor = db.focus_sessions.find({"user_id": current_user["id"], "status": "completed"})
    focus = [f for f in await foc_cursor.to_list(length=200) if start_str <= f.get("start_time", "")[:10] <= end_str]

    habits = await db.habits.find({"user_id": current_user["id"]}).to_list(length=50)
    goals = await db.goals.find({"user_id": current_user["id"]}).to_list(length=50)
    reviews = await db.daily_reviews.find({"user_id": current_user["id"], "date": {"$gte": start_str, "$lte": end_str}}).to_list(length=7)

    categories = current_user.get("preferences", {}).get("custom_categories", [])

    analytics = AnalyticsEngine.compute_analytics(
        start_date=start_str,
        end_date=end_str,
        date_range_label=f"Weekly Report ({start_str} to {end_str})",
        activities=activities,
        tasks=tasks,
        focus_sessions=focus,
        habits=habits,
        goals=goals,
        custom_categories=categories
    )

    return {
        "report_type": "weekly",
        "start_date": start_str,
        "end_date": end_str,
        "user_name": current_user["name"],
        "analytics": analytics,
        "daily_reviews": reviews,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@router.get("/monthly")
async def get_monthly_report(
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Comprehensive Monthly Executive Intelligence Report
    Computes daily time-series, 4-week comparisons, category area distributions,
    and a 30-day habit consistency matrix.
    """
    db = get_db()
    today = datetime.now(timezone.utc).date()
    
    if month:
        try:
            year, m = map(int, month.split("-"))
            start_dt = datetime(year, m, 1, tzinfo=timezone.utc).date()
            # Approximate end of month
            if m == 12:
                next_m = datetime(year + 1, 1, 1, tzinfo=timezone.utc).date()
            else:
                next_m = datetime(year, m + 1, 1, tzinfo=timezone.utc).date()
            end_dt = next_m - timedelta(days=1)
        except Exception:
            start_dt = today - timedelta(days=29)
            end_dt = today
    else:
        start_dt = today - timedelta(days=29)
        end_dt = today

    start_str = start_dt.strftime("%Y-%m-%d")
    end_str = end_dt.strftime("%Y-%m-%d")
    month_label = start_dt.strftime("%B %Y")

    # Fetch data
    act_cursor = db.activities.find({"user_id": current_user["id"], "date": {"$gte": start_str, "$lte": end_str}})
    activities = await act_cursor.to_list(length=2000)

    task_cursor = db.tasks.find({"user_id": current_user["id"]})
    tasks = await task_cursor.to_list(length=1000)

    foc_cursor = db.focus_sessions.find({"user_id": current_user["id"], "status": "completed"})
    focus_all = await foc_cursor.to_list(length=1000)
    focus = [f for f in focus_all if start_str <= f.get("start_time", "")[:10] <= end_str]

    habits = await db.habits.find({"user_id": current_user["id"]}).to_list(length=100)
    goals = await db.goals.find({"user_id": current_user["id"]}).to_list(length=100)
    reviews = await db.daily_reviews.find({"user_id": current_user["id"], "date": {"$gte": start_str, "$lte": end_str}}).to_list(length=31)

    categories = current_user.get("preferences", {}).get("custom_categories", [])
    cat_lookup = {c["id"]: c["name"] for c in categories}

    analytics = AnalyticsEngine.compute_analytics(
        start_date=start_str,
        end_date=end_str,
        date_range_label=f"Monthly Report ({month_label})",
        activities=activities,
        tasks=tasks,
        focus_sessions=focus,
        habits=habits,
        goals=goals,
        custom_categories=categories
    )

    # 1. Build Daily Timeseries (for 30-day graphs)
    day_count = (end_dt - start_dt).days + 1
    daily_timeseries = []
    
    # Map activities by date
    acts_by_date: Dict[str, List[dict]] = {}
    for a in activities:
        d = a.get("date", "")
        acts_by_date.setdefault(d, []).append(a)

    focus_by_date: Dict[str, int] = {}
    for f in focus:
        d = f.get("start_time", "")[:10]
        focus_by_date[d] = focus_by_date.get(d, 0) + f.get("actual_duration_minutes", 0)

    tasks_by_date: Dict[str, int] = {}
    for t in tasks:
        if t.get("status") == "completed" and t.get("completed_at"):
            d = t.get("completed_at", "")[:10]
            tasks_by_date[d] = tasks_by_date.get(d, 0) + 1

    # Calculate cumulative totals and target trajectory
    cum_act = 0.0
    cum_plan = 0.0
    cum_foc = 0.0
    total_target_focus_hours = 60.0  # Standard executive 60h monthly target
    target_daily_focus_hours = total_target_focus_hours / max(1, day_count)

    for i in range(day_count):
        curr_d = start_dt + timedelta(days=i)
        curr_str = curr_d.strftime("%Y-%m-%d")
        curr_acts = acts_by_date.get(curr_str, [])

        act_mins = sum(a.get("duration_minutes", 0) for a in curr_acts if a.get("record_type") == "actual")
        plan_mins = sum(a.get("duration_minutes", 0) for a in curr_acts if a.get("record_type") == "planned")
        foc_mins = focus_by_date.get(curr_str, 0)
        t_done = tasks_by_date.get(curr_str, 0)

        # Cumulative hours
        cum_act += round(act_mins / 60.0, 2)
        cum_plan += round(plan_mins / 60.0, 2)
        cum_foc += round(foc_mins / 60.0, 2)

        # Category splits for area chart
        cat_splits: Dict[str, int] = {}
        for a in curr_acts:
            if a.get("record_type") == "actual":
                cid = a.get("category", "other")
                cat_splits[cid] = cat_splits.get(cid, 0) + a.get("duration_minutes", 0)

        daily_timeseries.append({
            "date": curr_str,
            "day_label": curr_d.strftime("%b %d"),
            "weekday": curr_d.strftime("%a"),
            "actual_minutes": act_mins,
            "planned_minutes": plan_mins,
            "actual_hours": round(act_mins / 60.0, 1),
            "planned_hours": round(plan_mins / 60.0, 1),
            "variance_minutes": act_mins - plan_mins,
            "variance_hours": round((act_mins - plan_mins) / 60.0, 1),
            "focus_minutes": foc_mins,
            "focus_hours": round(foc_mins / 60.0, 1),
            "cumulative_focus_hours": round(cum_foc, 1),
            "target_trajectory_hours": round((i + 1) * target_daily_focus_hours, 1),
            "cumulative_actual_hours": round(cum_act, 1),
            "tasks_completed": t_done,
            "deep_work": cat_splits.get("deep_work", 0),
            "study": cat_splits.get("study", 0),
            "exercise": cat_splits.get("exercise", 0),
            "meals": cat_splits.get("meals", 0),
            "leisure": cat_splits.get("leisure", 0)
        })

    # 2. Build 4-Week Breakdown
    weekly_breakdown = []
    chunk_size = 7
    for w in range(4):
        w_start_idx = w * chunk_size
        w_end_idx = min(len(daily_timeseries), (w + 1) * chunk_size)
        if w_start_idx < len(daily_timeseries):
            chunk = daily_timeseries[w_start_idx:w_end_idx]
            w_act_hours = round(sum(item["actual_minutes"] for item in chunk) / 60.0, 1)
            w_plan_hours = round(sum(item["planned_minutes"] for item in chunk) / 60.0, 1)
            w_focus_hours = round(sum(item["focus_minutes"] for item in chunk) / 60.0, 1)
            w_tasks = sum(item["tasks_completed"] for item in chunk)

            weekly_breakdown.append({
                "week_label": f"Week {w + 1}",
                "date_range": f"{chunk[0]['day_label']} – {chunk[-1]['day_label']}",
                "recorded_hours": w_act_hours,
                "planned_hours": w_plan_hours,
                "focus_hours": w_focus_hours,
                "tasks_completed": w_tasks,
                "variance_hours": round(w_act_hours - w_plan_hours, 1)
            })

    # 3. Life Domain Balance (Wheel of Life Radar Data)
    domain_category_map = {
        "Deep Work": ["deep_work", "work"],
        "Learning": ["study"],
        "Fitness": ["exercise"],
        "Nourishment": ["meals"],
        "Leisure": ["leisure"],
        "Operations": ["other"]
    }

    life_domains = []
    for domain_name, cat_keys in domain_category_map.items():
        domain_act_mins = sum(
            a.get("duration_minutes", 0) for a in activities
            if a.get("record_type") == "actual" and a.get("category") in cat_keys
        )
        domain_plan_mins = sum(
            a.get("duration_minutes", 0) for a in activities
            if a.get("record_type") == "planned" and a.get("category") in cat_keys
        )
        act_h = round(domain_act_mins / 60.0, 1)
        plan_h = round(domain_plan_mins / 60.0, 1)
        # Target index normalized score (0-100)
        score = min(100, int((domain_act_mins / max(1, domain_plan_mins)) * 100)) if domain_plan_mins > 0 else (80 if domain_act_mins > 0 else 20)
        life_domains.append({
            "subject": domain_name,
            "actual_hours": act_h,
            "planned_hours": plan_h,
            "score": score
        })

    # 4. Day-of-Week Rhythm Distribution (Mon to Sun)
    dow_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    dow_stats = {name: {"focus_mins": 0, "act_mins": 0, "plan_mins": 0, "count": 0} for name in dow_names}

    for item in daily_timeseries:
        wd = item["weekday"]
        if wd in dow_stats:
            dow_stats[wd]["focus_mins"] += item["focus_minutes"]
            dow_stats[wd]["act_mins"] += item["actual_minutes"]
            dow_stats[wd]["plan_mins"] += item["planned_minutes"]
            dow_stats[wd]["count"] += 1

    day_of_week_distribution = []
    for wd in dow_names:
        c = max(1, dow_stats[wd]["count"])
        day_of_week_distribution.append({
            "day": wd,
            "avg_focus_hours": round((dow_stats[wd]["focus_mins"] / c) / 60.0, 1),
            "avg_recorded_hours": round((dow_stats[wd]["act_mins"] / c) / 60.0, 1),
            "avg_planned_hours": round((dow_stats[wd]["plan_mins"] / c) / 60.0, 1),
            "avg_variance_hours": round(((dow_stats[wd]["act_mins"] - dow_stats[wd]["plan_mins"]) / c) / 60.0, 1)
        })

    # 5. Circadian Slot Distribution (Morning, Afternoon, Evening, Night)
    slot_hours = {"Morning (6-12)": 0.0, "Afternoon (12-17)": 0.0, "Evening (17-22)": 0.0, "Night (22-6)": 0.0}
    for a in activities:
        if a.get("record_type") == "actual":
            st = a.get("start_time", "")
            dur_h = a.get("duration_minutes", 0) / 60.0
            if "T" in st:
                try:
                    hour = int(st.split("T")[1][:2])
                    if 6 <= hour < 12:
                        slot_hours["Morning (6-12)"] += dur_h
                    elif 12 <= hour < 17:
                        slot_hours["Afternoon (12-17)"] += dur_h
                    elif 17 <= hour < 22:
                        slot_hours["Evening (17-22)"] += dur_h
                    else:
                        slot_hours["Night (22-6)"] += dur_h
                except Exception:
                    slot_hours["Morning (6-12)"] += dur_h

    circadian_slots = [
        {"slot": name, "hours": round(val, 1)}
        for name, val in slot_hours.items()
    ]

    # 6. Build Habit Monthly Consistency Matrix (Calendar Grid)
    habit_matrix = []
    for h in habits:
        h_completions = h.get("completions", [])
        completed_dates = {c.get("date") for c in h_completions if c.get("completed", True)}
        
        grid = []
        for i in range(day_count):
            curr_str = (start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
            grid.append({
                "date": curr_str,
                "completed": curr_str in completed_dates
            })

        comp_count = sum(1 for item in grid if item["completed"])
        consistency_pct = round((comp_count / max(1, day_count)) * 100, 1)

        habit_matrix.append({
            "id": h.get("id"),
            "name": h.get("name"),
            "category": h.get("category"),
            "color": h.get("color", "#10B981"),
            "monthly_completions": comp_count,
            "consistency_percentage": consistency_pct,
            "grid": grid
        })

    # 7. Executive Scorecard
    peak_day = max(daily_timeseries, key=lambda x: x["focus_minutes"], default=None)
    best_habit = max(habit_matrix, key=lambda x: x["consistency_percentage"], default=None)
    total_rec_h = round(sum(d["actual_minutes"] for d in daily_timeseries) / 60.0, 1)
    total_deep_h = round(sum(d["deep_work"] for d in daily_timeseries) / 60.0, 1)
    deep_work_share = round((total_deep_h / max(0.1, total_rec_h)) * 100, 1)

    executive_scorecard = {
        "total_recorded_hours": total_rec_h,
        "total_focus_hours": round(cum_foc, 1),
        "target_focus_hours": total_target_focus_hours,
        "focus_achievement_pct": min(150, round((cum_foc / total_target_focus_hours) * 100, 1)),
        "deep_work_share_pct": deep_work_share,
        "peak_focus_day": {
            "date": peak_day["day_label"] if peak_day else "N/A",
            "hours": peak_day["focus_hours"] if peak_day else 0
        },
        "top_habit": {
            "name": best_habit["name"] if best_habit else "N/A",
            "consistency": best_habit["consistency_percentage"] if best_habit else 0
        }
    }

    return {
        "report_type": "monthly",
        "month_label": month_label,
        "start_date": start_str,
        "end_date": end_str,
        "user_name": current_user["name"],
        "analytics": analytics,
        "daily_timeseries": daily_timeseries,
        "weekly_breakdown": weekly_breakdown,
        "life_domains": life_domains,
        "day_of_week_distribution": day_of_week_distribution,
        "circadian_slots": circadian_slots,
        "habit_matrix": habit_matrix,
        "executive_scorecard": executive_scorecard,
        "goals": goals,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
