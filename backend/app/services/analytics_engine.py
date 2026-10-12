from typing import List, Dict, Any, Optional
from datetime import datetime
from app.services.time_engine import TimeEngine
from app.models.analytics import (
    AnalyticsSummaryResponse, 
    CategoryDuration, 
    PlanVsRealityItem, 
    PatternInsight
)

class AnalyticsEngine:
    """Deterministic analytics computation and evidence-backed pattern engine."""

    @staticmethod
    def compute_analytics(
        start_date: str,
        end_date: str,
        date_range_label: str,
        activities: List[Dict[str, Any]],
        tasks: List[Dict[str, Any]],
        focus_sessions: List[Dict[str, Any]],
        habits: List[Dict[str, Any]],
        goals: List[Dict[str, Any]],
        custom_categories: List[Dict[str, str]]
    ) -> AnalyticsSummaryResponse:
        
        # Build category lookup map
        cat_map = {c["id"]: c for c in custom_categories}
        
        # 1. Activities Breakdown (Planned vs Actual)
        actual_activities = [a for a in activities if a.get("record_type") == "actual"]
        planned_activities = [a for a in activities if a.get("record_type") == "planned"]
        
        cat_actual_mins: Dict[str, int] = {}
        cat_planned_mins: Dict[str, int] = {}
        
        total_actual_mins = 0
        for act in actual_activities:
            mins = act.get("duration_minutes", 0)
            if not mins and act.get("start_time") and act.get("end_time"):
                mins = TimeEngine.calculate_duration_minutes(act["start_time"], act["end_time"])
            cat = act.get("category", "other")
            cat_actual_mins[cat] = cat_actual_mins.get(cat, 0) + mins
            total_actual_mins += mins

        total_planned_mins = 0
        for act in planned_activities:
            mins = act.get("duration_minutes", 0)
            if not mins and act.get("start_time") and act.get("end_time"):
                mins = TimeEngine.calculate_duration_minutes(act["start_time"], act["end_time"])
            cat = act.get("category", "other")
            cat_planned_mins[cat] = cat_planned_mins.get(cat, 0) + mins
            total_planned_mins += mins

        # Category Durations List
        category_durations: List[CategoryDuration] = []
        for cat_id, mins in cat_actual_mins.items():
            cat_info = cat_map.get(cat_id, {"name": cat_id.replace("_", " ").title(), "color": "#64748B"})
            percentage = round((mins / total_actual_mins * 100), 1) if total_actual_mins > 0 else 0.0
            category_durations.append(CategoryDuration(
                category_id=cat_id,
                category_name=cat_info.get("name", cat_id),
                color=cat_info.get("color", "#64748B"),
                minutes=mins,
                percentage=percentage
            ))
        category_durations.sort(key=lambda x: x.minutes, reverse=True)

        # Plan vs Reality Items
        plan_vs_reality: List[PlanVsRealityItem] = []
        all_cats = set(list(cat_actual_mins.keys()) + list(cat_planned_mins.keys()))
        for cat_id in all_cats:
            cat_info = cat_map.get(cat_id, {"name": cat_id.replace("_", " ").title()})
            p_mins = cat_planned_mins.get(cat_id, 0)
            a_mins = cat_actual_mins.get(cat_id, 0)
            plan_vs_reality.append(PlanVsRealityItem(
                category_id=cat_id,
                category_name=cat_info.get("name", cat_id),
                planned_minutes=p_mins,
                actual_minutes=a_mins,
                difference_minutes=a_mins - p_mins
            ))
        plan_vs_reality.sort(key=lambda x: (x.actual_minutes + x.planned_minutes), reverse=True)

        # 2. Tasks Metrics
        tasks_total = len(tasks)
        tasks_completed = sum(1 for t in tasks if t.get("status") == "completed")
        tasks_in_prog = sum(1 for t in tasks if t.get("status") == "in_progress")
        tasks_pending = sum(1 for t in tasks if t.get("status") in ("todo", "pending"))
        task_completion_rate = round((tasks_completed / tasks_total * 100), 1) if tasks_total > 0 else 0.0

        # Estimation accuracy on completed tasks with recorded duration
        completed_tasks_with_act = [
            t for t in tasks 
            if t.get("status") == "completed" and t.get("actual_duration_minutes", 0) > 0
        ]
        if completed_tasks_with_act:
            ratios = [
                t.get("estimated_duration_minutes", 30) / max(1, t.get("actual_duration_minutes", 30))
                for t in completed_tasks_with_act
            ]
            avg_estimation_acc = round(sum(ratios) / len(ratios), 2)
        else:
            avg_estimation_acc = 1.0

        # 3. Focus Sessions Metrics
        total_focus_mins = sum(
            f.get("actual_duration_minutes", 0) 
            for f in focus_sessions 
            if f.get("status") == "completed"
        )
        completed_focus_sessions = sum(1 for f in focus_sessions if f.get("status") == "completed")
        total_interruptions = sum(f.get("interruptions", 0) for f in focus_sessions)
        avg_focus_duration = (
            round(total_focus_mins / completed_focus_sessions, 1) 
            if completed_focus_sessions > 0 else 0.0
        )

        # 4. Habits Metrics
        habits_tracked = len(habits)
        habit_rates = []
        for h in habits:
            completions = h.get("completions", [])
            if completions:
                # 7d rate
                comp_count = sum(1 for c in completions if c.get("completed", True))
                habit_rates.append(min(100.0, (comp_count / 7.0) * 100))
        avg_habit_rate = round(sum(habit_rates) / len(habit_rates), 1) if habit_rates else 0.0

        # 5. Goals Metrics
        active_goals = [g for g in goals if g.get("status") == "active"]
        active_goals_count = len(active_goals)
        progresses = []
        for g in active_goals:
            milestones = g.get("milestones", [])
            if milestones:
                done = sum(1 for m in milestones if m.get("completed", False))
                progresses.append((done / len(milestones)) * 100)
            elif g.get("self_assessment_progress") is not None:
                progresses.append(float(g["self_assessment_progress"]))
        avg_goal_progress = round(sum(progresses) / len(progresses), 1) if progresses else 0.0

        # 6. Pattern Detection (Evidence-Backed)
        patterns: List[PatternInsight] = []

        # Pattern A: Plan vs Reality Variance
        if total_planned_mins > 0 and total_actual_mins > 0:
            variance = total_actual_mins - total_planned_mins
            if abs(variance) >= 45:
                direction = "exceeded" if variance > 0 else "under-delivered on"
                patterns.append(PatternInsight(
                    id="p_variance",
                    title="Plan vs Reality Divergence",
                    observation=f"Your recorded activity time {direction} planned commitments by {abs(variance)} minutes.",
                    evidence=f"Planned: {total_planned_mins} mins, Recorded: {total_actual_mins} mins over {date_range_label.lower()}.",
                    why_it_matters="Consistently under-allocating planned time leads to schedule crowding and cognitive fatigue.",
                    suggested_action="Incorporate a 15-minute buffer between major planned blocks to absorb transition friction.",
                    how_to_evaluate="Track next week's schedule adherence in the Daily Review module.",
                    category="planning",
                    confidence="high"
                ))

        # Pattern B: Task Duration Estimation Bias
        if avg_estimation_acc < 0.75 and len(completed_tasks_with_act) >= 2:
            patterns.append(PatternInsight(
                id="p_underestimating",
                title="Task Duration Underestimation",
                observation="Tasks took noticeably longer to finish than initial estimates.",
                evidence=f"Average estimation accuracy is {avg_estimation_acc * 100:.0f}% across {len(completed_tasks_with_act)} measured tasks.",
                why_it_matters="Optimistic time estimation causes cascading delays throughout the day.",
                suggested_action="Multiply your initial task time estimates by 1.3x before finalizing your morning schedule.",
                how_to_evaluate="Compare tomorrow's task estimated vs actual duration in the Tasks tab.",
                category="planning",
                confidence="high"
            ))

        # Pattern C: Focus Continuity & Interruptions
        if completed_focus_sessions >= 2:
            avg_interr = total_interruptions / completed_focus_sessions
            if avg_interr >= 1.5:
                patterns.append(PatternInsight(
                    id="p_interruptions",
                    title="Focus Session Friction",
                    observation="Focus intervals encountered recurring interruptions.",
                    evidence=f"Recorded an average of {avg_interr:.1f} interruptions across {completed_focus_sessions} focus sessions.",
                    why_it_matters="Context switching takes an estimated 15-20 minutes to recover deep immersion.",
                    suggested_action="Try 25-minute intervals with notifications silenced and physical workspace signals.",
                    how_to_evaluate="Check whether interruption counts decrease in the Focus Tracker log.",
                    category="focus",
                    confidence="moderate"
                ))
            elif avg_focus_duration >= 40:
                patterns.append(PatternInsight(
                    id="p_deep_work",
                    title="High Focus Endurance",
                    observation="You maintain sustained focus blocks once initialized.",
                    evidence=f"Average session duration was {avg_focus_duration} minutes across {completed_focus_sessions} sessions.",
                    why_it_matters="Long, uninterrupted sessions are optimal for complex analytical and creative tasks.",
                    suggested_action="Protect high-energy hours (e.g. morning) for high-impact goal milestones.",
                    how_to_evaluate="Review weekly goal milestone advancement against focus logs.",
                    category="focus",
                    confidence="high"
                ))

        # Empty/Insufficient Data Graceful Pattern
        if not patterns and total_actual_mins < 120:
            patterns.append(PatternInsight(
                id="p_starter",
                title="Initial Baseline Phase",
                observation="Currently gathering sufficient activity history.",
                evidence=f"Only {total_actual_mins} minutes of activities recorded so far in this period.",
                why_it_matters="Statistical patterns require at least 3-5 days of consistent tracking to prevent false assumptions.",
                suggested_action="Continue logging major activities and running focus sessions as your day unfolds.",
                how_to_evaluate="Revisit the Insights page after 3 full days of logging.",
                category="time",
                confidence="hypothesis"
            ))

        return AnalyticsSummaryResponse(
            date_range_label=date_range_label,
            start_date=start_date,
            end_date=end_date,
            total_recorded_minutes=total_actual_mins,
            total_planned_minutes=total_planned_mins,
            time_variance_minutes=total_actual_mins - total_planned_mins,
            unlogged_minutes=max(0, (16 * 60) - total_actual_mins), # waking 16h window estimate
            categories=category_durations,
            plan_vs_reality=plan_vs_reality,
            tasks_total=tasks_total,
            tasks_completed=tasks_completed,
            tasks_in_progress=tasks_in_prog,
            tasks_pending=tasks_pending,
            task_completion_rate=task_completion_rate,
            avg_task_estimation_accuracy=avg_estimation_acc,
            total_focus_minutes=total_focus_mins,
            completed_focus_sessions=completed_focus_sessions,
            total_interruptions=total_interruptions,
            avg_focus_session_duration=avg_focus_duration,
            habits_tracked=habits_tracked,
            avg_habit_completion_rate=avg_habit_rate,
            active_goals_count=active_goals_count,
            avg_goal_progress=avg_goal_progress,
            patterns=patterns
        )
