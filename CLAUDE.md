# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NYCU 醫四週課表戰略儀表板 — A medical school schedule tracker for NYCU Med10 students. Tracks clinical course attendance, study progress, and exam preparation.

## Development Commands

### Backend (Python/FastAPI)
```bash
# Activate virtual environment (Windows)
venv\Scripts\activate

# Run dev server (port 8000)
uvicorn main:app --reload

# Run production server
uvicorn main:app
```

### Frontend (Next.js)
```bash
cd frontend

npm run dev      # Dev server on port 3000
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint
```

### Start both together (Windows)
```
start.bat   # Opens two cmd windows (FastAPI + Next.js) and opens browser at localhost:3000
```

## Architecture

### Tech Stack
- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Backend:** FastAPI + SQLAlchemy 2.0 + Pydantic 2
- **Database:** PostgreSQL via Supabase (production), SQLite (local dev)
- **PDF Processing:** pdfplumber + regex

### Project Structure
```
Med_schedule_tracker/
├── main.py                  # FastAPI app entry point, all API routes
├── database/
│   ├── db_setup.py          # SQLAlchemy engine + session setup
│   └── models.py            # ORM models: Course, ExamRule
├── schemas/
│   └── course_schema.py     # Pydantic schemas with Enums for attendance/progress
├── parser/
│   ├── pdf_reader.py        # pdfplumber coordinate extraction, ROI cell cropping
│   └── text_extractor.py    # Regex classification, category overrides
├── services/
│   ├── course_service.py    # Upsert logic (preserves existing progress on re-import)
│   └── exam_service.py      # Maps exam keywords to course categories
├── scripts/                 # Dev utility scripts (check_db, debug_pdf, run_import, test_roi)
├── data/                    # PDF source files, exam schedules, local SQLite DB
└── frontend/
    ├── app/
    │   ├── page.tsx         # Main dashboard (KPI cards, table, calendar)
    │   └── admin/page.tsx   # Admin panel for exam rule CRUD
    ├── components/
    │   └── InteractiveTable.tsx  # Filterable inline-edit course table
    └── components/ui/       # shadcn/ui components
```

### API Endpoints (main.py)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/courses` | All courses |
| PUT | `/api/courses/{id}` | Update attendance/progress/exam override |
| GET | `/api/exam-rules` | All exam-to-category mapping rules |
| POST | `/api/exam-rules` | Create exam rule |
| PUT | `/api/exam-rules/{id}` | Update exam rule |
| DELETE | `/api/exam-rules/{id}` | Delete exam rule |

**Backend URL** is configured via `NEXT_PUBLIC_API_URL` environment variable:
- Local dev: `http://localhost:8000` (set in `frontend/.env.local`)
- Production: `https://med-schedule-backend.onrender.com` (set in Vercel dashboard)

### Data Model

**Course fields:**
- `category` — `Science | PBL | Exam | Holiday | Skill | Other`
- `attendance` — `未標記 | 現場出席 | 錄影補課 | 加強複習`
- `study_progress` — JSON array of `["一刷", "二刷", "寫考古"]`
- `target_exam_override` — manually assigned exam (nullable)

**ExamRule:** maps an `exam_keyword` (e.g. `"骨"`) to a JSON array of `target_categories`.

### Frontend Data Flow
1. `page.tsx` fetches `/api/courses` + `/api/exam-rules` in parallel on load
2. Courses are enriched client-side: each course gets a `target_exam` by matching exam rules (ExamRule.target_categories ↔ course.category), finding the next upcoming exam after the course date
3. `InteractiveTable.tsx` receives enriched courses; user edits trigger PUT requests immediately (optimistic UI)
4. Calendar view uses `@fullcalendar/react` with courses as color-coded events

### PDF Parser Logic (parser/)
The parser is used offline to import schedules — it is **not** exposed as an API endpoint. Key behaviors:
- `pdf_reader.py`: Detects time anchors (Y-axis) and date anchors (X-axis), crops ROI cells per time slot per day
- `text_extractor.py`: Applies blacklist filtering, detects PBL/Holiday/Exam/Skill categories, parses `[科目]: 課程代碼, 主題, 教師` bracket format
- `course_service.py`: Upsert by `(course_code, date, time_slot)` — re-importing never overwrites user-entered attendance/progress

### Environment Variables

**Backend** (`.env` at project root — see `.env.example`):
- `DATABASE_URL` — Supabase PostgreSQL connection string. Leave unset to use local SQLite.

**Frontend** (`frontend/.env.local` — see `frontend/.env.local.example`):
- `NEXT_PUBLIC_API_URL` — Backend API base URL.

### Deployment
- **Frontend** → Vercel (set `NEXT_PUBLIC_API_URL` in Vercel dashboard)
- **Backend** → Render
- **Database** → Supabase PostgreSQL
