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

![Dashboard Screenshot](docs/example01.png)
![Dashboard Screenshot](docs/example02.png)

## Installation

### Homebrew (macOS)

```bash
brew tap Jimmy110101013/homebrew-tap
brew install med-schedule-tracker
```

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

Full interactive documentation is available at [`/docs`](https://med-schedule-backend.onrender.com/docs) (Swagger UI) once the backend is running.

## License

This project is released under the [MIT License](LICENSE).
