from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional
import zoneinfo

class TimeEngine:
    """Core engine for all datetime, duration, timezone, and timeline math."""

    @staticmethod
    def parse_iso(dt_str: str) -> datetime:
        """Parse ISO datetime string, ensuring timezone awareness (defaulting to UTC)."""
        dt_str = dt_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(dt_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt

    @staticmethod
    def calculate_duration_minutes(start_iso: str, end_iso: str) -> int:
        """Calculate duration between two ISO datetimes in minutes."""
        start = TimeEngine.parse_iso(start_iso)
        end = TimeEngine.parse_iso(end_iso)
        diff = (end - start).total_seconds()
        return max(0, int(diff / 60))

    @staticmethod
    def get_date_string(dt_iso: str, tz_name: str = "UTC") -> str:
        """Extract YYYY-MM-DD from an ISO string in the specified timezone."""
        dt = TimeEngine.parse_iso(dt_iso)
        try:
            tz = zoneinfo.ZoneInfo(tz_name)
            local_dt = dt.astimezone(tz)
        except Exception:
            local_dt = dt
        return local_dt.strftime("%Y-%m-%d")

    @staticmethod
    def detect_overlaps(activities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify pairs of overlapping actual activities without double counting."""
        overlaps = []
        actuals = [
            a for a in activities 
            if a.get("record_type") == "actual" and a.get("start_time") and a.get("end_time")
        ]
        
        # Sort by start_time
        sorted_acts = sorted(actuals, key=lambda x: TimeEngine.parse_iso(x["start_time"]))
        
        for i in range(len(sorted_acts)):
            for j in range(i + 1, len(sorted_acts)):
                a1 = sorted_acts[i]
                a2 = sorted_acts[j]
                start1 = TimeEngine.parse_iso(a1["start_time"])
                end1 = TimeEngine.parse_iso(a1["end_time"])
                start2 = TimeEngine.parse_iso(a2["start_time"])
                end2 = TimeEngine.parse_iso(a2["end_time"])

                if start2 < end1:
                    # Overlap detected
                    overlap_start = max(start1, start2)
                    overlap_end = min(end1, end2)
                    overlap_duration = int((overlap_end - overlap_start).total_seconds() / 60)
                    if overlap_duration > 0:
                        overlaps.append({
                            "activity_1_id": a1.get("id") or str(a1.get("_id")),
                            "activity_1_title": a1.get("title"),
                            "activity_2_id": a2.get("id") or str(a2.get("_id")),
                            "activity_2_title": a2.get("title"),
                            "overlap_duration_minutes": overlap_duration,
                            "overlap_start": overlap_start.isoformat(),
                            "overlap_end": overlap_end.isoformat()
                        })
        return overlaps

    @staticmethod
    def find_unlogged_gaps(
        date_str: str, 
        activities: List[Dict[str, Any]], 
        wake_time: str = "07:00", 
        sleep_time: str = "23:00",
        min_gap_minutes: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Identify unlogged periods during waking hours without judgment.
        Offers gentle suggestions for unrecorded time.
        """
        actuals = [
            a for a in activities 
            if a.get("record_type") == "actual" and a.get("start_time") and a.get("end_time")
        ]
        if not actuals:
            return [{
                "start": f"{date_str}T{wake_time}:00",
                "end": f"{date_str}T{sleep_time}:00",
                "duration_minutes": TimeEngine.calculate_duration_minutes(
                    f"{date_str}T{wake_time}:00", f"{date_str}T{sleep_time}:00"
                ),
                "suggestion": "No activities recorded for today yet. Would you like to log your morning or day?"
            }]

        sorted_acts = sorted(actuals, key=lambda x: TimeEngine.parse_iso(x["start_time"]))
        
        # Consider the day window
        day_start = TimeEngine.parse_iso(f"{date_str}T{wake_time}:00")
        day_end = TimeEngine.parse_iso(f"{date_str}T{sleep_time}:00")
        
        gaps = []
        current_cursor = day_start
        
        for act in sorted_acts:
            act_start = TimeEngine.parse_iso(act["start_time"])
            act_end = TimeEngine.parse_iso(act["end_time"])
            
            if act_start > current_cursor:
                gap_mins = int((act_start - current_cursor).total_seconds() / 60)
                if gap_mins >= min_gap_minutes:
                    gaps.append({
                        "start": current_cursor.isoformat(),
                        "end": act_start.isoformat(),
                        "duration_minutes": gap_mins,
                        "suggestion": f"You have an unlogged {gap_mins}-minute period. Would you like to log an activity?"
                    })
            if act_end > current_cursor:
                current_cursor = act_end
                
        if day_end > current_cursor:
            gap_mins = int((day_end - current_cursor).total_seconds() / 60)
            if gap_mins >= min_gap_minutes:
                gaps.append({
                    "start": current_cursor.isoformat(),
                    "end": day_end.isoformat(),
                    "duration_minutes": gap_mins,
                    "suggestion": f"You have an unlogged {gap_mins}-minute period before your planned rest time."
                })
                
        return gaps
