# Med Schedule Tracker

**Clinical course tracking dashboard for NYCU Med10 students.**
NYCU 醫四週課表戰略儀表板

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/Jimmy110101013/med-schedule-backend)](https://github.com/Jimmy110101013/med-schedule-backend/releases)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)
![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131)

---

- Exam countdown with internalization rate tracking
- Interactive course table and strategic calendar view
- 16-subject progress grid with focus mode for high-risk courses
- Dark and light theme support

<!-- Screenshot: replace this comment with a screenshot of the dashboard -->

## Installation

### Homebrew (macOS)

```bash
brew tap Jimmy110101013/homebrew-tap
brew install med-schedule-tracker
```

### Direct Download

Download the latest `.dmg` from [GitHub Releases](https://github.com/Jimmy110101013/med-schedule-backend/releases).

### Web

Visit the hosted version at [med-schedule-tracker.vercel.app](https://med-schedule-tracker.vercel.app).

## Features

| Feature | Description |
|---------|-------------|
| Exam Countdown | Tracks days remaining and internalization rate per subject |
| Interactive Table | Sortable course table with inline editing for attendance and progress |
| Strategic Calendar | FullCalendar-powered view with exam and course overlays |
| Progress Grid | 16-subject grid showing completion status at a glance |
| Focus Mode | Filters view to high-risk courses needing attention |
| Dark / Light Theme | System-aware theme with manual toggle |
| PDF Import | Offline schedule import via pdfplumber sidecar |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop | Tauri v2 (macOS) |
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | FastAPI, SQLAlchemy 2.0, Pydantic 2 |
| Database | PostgreSQL (Supabase) |
| PDF Parser | pdfplumber (offline import, not an API) |

## Architecture

**Desktop app** — Tauri v2 wraps the Next.js frontend into a native macOS application. The backend runs as an embedded sidecar or connects to the remote API depending on configuration.

**Web deployment** — The frontend is deployed to Vercel. The backend runs on Render (`https://med-schedule-backend.onrender.com`). The database is hosted on Supabase PostgreSQL.

## Local Development

### Prerequisites

```bash
# Backend
cp .env.example .env          # Set DATABASE_URL (leave empty for SQLite)
python -m venv venv
source venv/bin/activate      # macOS / Linux
pip install -r requirements.txt

# Frontend
cd frontend
cp .env.local.example .env.local   # Defaults to localhost:8000
npm install
```

### Start

```bash
# Option 1: start both (Windows)
start.bat

# Option 2: start separately
uvicorn main:app --reload              # Backend  -> http://localhost:8000
cd frontend && npm run dev             # Frontend -> http://localhost:3000
```

## Project Structure

```
med-schedule-backend/
├── main.py                 # FastAPI entry point, all API routes
├── database/               # SQLAlchemy models and DB connection
├── schemas/                # Pydantic validation schemas
├── parser/                 # PDF parsing engine (offline use)
├── services/               # Business logic (upsert, exam mapping)
├── scripts/                # Development utility scripts
├── data/                   # PDF sources, exam timetables, local SQLite
├── src-tauri/              # Tauri v2 desktop app configuration
└── frontend/               # Next.js frontend
    ├── app/page.tsx        # Main dashboard
    ├── app/admin/page.tsx  # Exam rule management
    └── components/         # React components + shadcn/ui
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/courses` | List all courses |
| PUT | `/api/courses/{id}` | Update attendance, progress, or exam assignment |
| GET | `/api/exam-rules` | List exam mapping rules |
| POST | `/api/exam-rules` | Create a mapping rule |
| PUT | `/api/exam-rules/{id}` | Update a mapping rule |
| DELETE | `/api/exam-rules/{id}` | Delete a mapping rule |

## License

This project is released under the [MIT License](LICENSE).
