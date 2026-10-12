# LIFEOS — Your Personal Life Intelligence & Continuous Improvement System

> **"Understand Your Time. Improve Your Life."**
> 
> *The Continuous Life Intelligence Loop: Plan → Act → Record → Analyze → Understand → Improve → Repeat.*

---

## 1. Overview
**LIFEOS** is an intelligent, privacy-first personal life operating system designed to answer four foundational questions:
1. **What did I intend to do?** (Plans, task estimates, scheduled commitments)
2. **What did I actually do?** (24-hour visual timeline, focus sessions, recorded durations)
3. **What patterns explain the difference?** (Plan vs. reality variance, estimation bias, context switching)
4. **What should I change next?** (Evidence-backed experiments, daily reviews, AI life analyst recommendations)

The purpose of LIFEOS is not to force extreme productivity or judge how you live. Rest, sleep, recreation, and social connection are treated as legitimate and vital components of life.

---

## 2. Core Features & Modules

1. **Life Overview Dashboard**:
   - Welcome panel with live local time, date, and primary goal progress.
   - Real-time statistics: recorded time, planned time, tasks execution, focus minutes, habits completed.
   - Plan vs. Reality bar chart and category time allocation donut chart powered by Recharts.
   - Continuous improvement observations and quick actions.

2. **My 24 Hours Timeline**:
   - Interactive 24-hour visual timeline representing 00:00 to 23:59.
   - Dual-track display: Planned intentions vs recorded activities.
   - Overlap detector flagging double-counted records without destructive edits.
   - Unlogged gap detector offering non-judgmental prompts to log unrecorded waking periods.
   - Date picker to navigate past, present, and future dates.

3. **Smart Daily Planner**:
   - Schedule builder with capacity and workload meter.
   - Automatic overload conflict warnings when scheduled hours exceed realistic waking capacity.
   - Quick time-blocking of pending tasks into scheduled timeline slots.

4. **Task Management**:
   - Status transitions (`todo`, `in_progress`, `completed`, `cancelled`).
   - Priority indicators (`low`, `medium`, `high`, `urgent`).
   - Estimated duration vs actual duration tracking.
   - Search, status filtering, and subtasks.

5. **Focus Tracker**:
   - Reload-resilient focus timer based on persistent UTC timestamps.
   - Presets (15m, 25m, 45m, 60m, 90m) or custom duration.
   - Interruption logging counter.
   - Session reflection capture.
   - Direct conversion of completed focus sessions into actual timeline activity records.

6. **Habit Tracker**:
   - Daily and weekly habit tracking.
   - Active streaks and longest streaks.
   - 7-day and 30-day consistency percentages.
   - Non-shaming philosophy: missed days do not erase user worth.

7. **Goals & Personal Growth**:
   - Categories (Education, Career, Skills, Fitness, Finance, Relationships, General).
   - Milestones progress calculation.
   - Linked activity hours and linked task counts.

8. **Daily Review**:
   - Evening guided reflection wizard.
   - Accomplishments, challenges, focus helpers, distractions, and tomorrow intentions.
   - Automated synthesis with backend-verified factual logs.
   - Optional subjective energy and mood self-assessments (1-5).

9. **Life Insights & Analytics**:
   - Date filtering: Today, Yesterday, Last 7 Days, Last 30 Days, Custom range.
   - Mathematical variance calculations between planned and actual durations.
   - Category distribution charts.
   - Evidence-backed pattern detection cards (Observation, Evidence, Why it matters, Suggested Action, How to evaluate).

10. **AI Life Analyst**:
    - Conversational assistant answering user questions with verified user records.
    - Provider-agnostic service layer: supports Google Gemini, OpenAI, or an offline Deterministic Analytical Engine fallback.
    - Strict user data isolation: never leaks cross-user data.
    - Clear conversation history on demand.

11. **Reports**:
    - Structured Daily and Weekly reports.
    - Clean printable layout.

12. **Settings & Privacy**:
    - Routine window preferences (wake time, sleep time, timezone).
    - Dark mode and light mode interface theme toggle.
    - Full JSON data export.
    - Permanent account and data deletion.

---

## 3. Technology Stack

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS**
- **Lucide React** (icons)
- **Recharts** (data visualization)
- **React Router v6**

### Backend
- **Python 3.14** + **FastAPI**
- **Pydantic v2** + **pydantic-settings**
- **Motor** + **PyMongo** (with embedded async in-memory collection fallback for instant standalone run)
- **PyJWT** + **Bcrypt** for secure authentication
- **HTTPX** & **Pytest** for testing

---

## 4. Local Quickstart

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.14)
- Node.js 18+ (tested on Node v25)
- npm 9+

### 2. Backend Setup
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Swagger API Documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`

### 4. Running Backend Tests
```powershell
backend\venv\Scripts\pytest backend\tests -v
```

---

## 5. Instant Demo Mode
To immediately test the interface without manual data entry:
1. Open `http://localhost:5173`.
2. Click **"Launch Demo Mode Instantly"** on the landing page or auth page.
3. A pre-populated dataset with sample activities, tasks, focus sessions, habits, and goals will be loaded immediately.
