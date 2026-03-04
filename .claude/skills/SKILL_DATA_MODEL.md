# SKILL: Architecture, Data Model & API Endpoints

> 按需載入：僅在處理資料庫 schema、API 設計、ORM 模型、或 Pydantic schema 相關任務時讀取此檔案。

## Tech Stack

| 層級 | 技術 |
|------|------|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | FastAPI + SQLAlchemy 2.0 + Pydantic 2 |
| Database | PostgreSQL via Supabase（production）/ SQLite（local dev）|
| PDF Processing | pdfplumber + regex（離線工具，非 API）|

---

## 資料庫模型（`database/models.py`）

### Course
```python
class Course(Base):
    id: int (PK)
    course_code: str           # 課程代碼（如 C1234）
    date: str                  # YYYY-MM-DD
    time_slot: str             # 如 "08:00-09:00"
    category: str              # 見 Category Enum 下方
    topic: str                 # 課程主題
    teacher: str               # 教師姓名
    attendance: str            # 見 Attendance Enum 下方
    study_progress: JSON       # 字串陣列 ["一刷", "二刷", "寫考古"]
    target_exam_override: str  # nullable，手動指派考試目標
```

**Upsert 唯一鍵：`(course_code, date, time_slot)`**

### ExamRule
```python
class ExamRule(Base):
    id: int (PK)
    keyword: str       # 考試關鍵字，如 "骨"、"心臟"
    categories: JSON   # 字串陣列，如 ["Science", "Skill"]
```

---

## Pydantic Enums（`schemas/course_schema.py`）

### Category（課程類別）
```
Science | PBL | Exam | Holiday | Skill | Other
```

### Attendance（出席狀態）
```
未標記 | 現場出席 | 錄影補課 | 加強複習
```

### StudyProgress（內化進度，多選）
```
一刷 | 二刷 | 寫考古
```

---

## API Endpoints（`main.py`）

### Courses
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/courses` | 取得所有課程（含所有欄位）|
| PUT | `/api/courses/{id}` | 更新單一課程（attendance / study_progress / target_exam_override）|

### Exam Rules
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/exam-rules` | 取得所有 ExamRule |
| POST | `/api/exam-rules` | 新增 ExamRule |
| PUT | `/api/exam-rules/{id}` | 更新 ExamRule |
| DELETE | `/api/exam-rules/{id}` | 刪除 ExamRule |

### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Uptime 監控用 health check |

---

## 環境變數

### Backend（`.env` 於專案根目錄）
```
DATABASE_URL=<Supabase PostgreSQL URL>
# 若未設定，自動使用 SQLite (data/local.db)
```

### Frontend（`frontend/.env.local`）
```
NEXT_PUBLIC_API_URL=http://localhost:8000          # local dev
# Production 設定在 Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://med-schedule-backend.onrender.com
```

---

## 部署架構

```
Vercel (Frontend)  →  Render (Backend FastAPI)  →  Supabase (PostgreSQL)
```

- Frontend CI: Vercel 自動部署 `main` branch
- Backend CI: Render 自動部署 `main` branch
- DB Migration: SQLAlchemy `create_all()` on startup（非 Alembic）
