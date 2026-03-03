# NYCU 醫四週課表戰略儀表板

NYCU Med10 (114-2) 臨床課程追蹤系統 — 追蹤出席、讀書進度、考試準備。

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui |
| Backend | FastAPI · SQLAlchemy 2.0 · Pydantic 2 |
| Database | PostgreSQL (Supabase) |
| PDF Parser | pdfplumber (離線匯入，非 API) |

## 部署架構

- **Frontend** → Vercel
- **Backend** → Render (`https://med-schedule-backend.onrender.com`)
- **Database** → Supabase PostgreSQL

## 本地開發

### 環境準備

```bash
# 後端
cp .env.example .env          # 填入 DATABASE_URL（留空則使用 SQLite）
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt

# 前端
cd frontend
cp .env.local.example .env.local   # 本地預設指向 localhost:8000
npm install
```

### 啟動

```bash
# 方法一：一鍵啟動（Windows）
start.bat

# 方法二：分別啟動
uvicorn main:app --reload              # Backend → http://localhost:8000
cd frontend && npm run dev             # Frontend → http://localhost:3000
```

## 專案結構

```
├── main.py                 # FastAPI 入口，所有 API 路由
├── database/               # SQLAlchemy models & DB 連線
├── schemas/                # Pydantic 驗證 schemas
├── parser/                 # PDF 解析引擎（離線使用）
├── services/               # 業務邏輯（upsert、考試映射）
├── scripts/                # 開發輔助腳本
├── data/                   # PDF 原檔、考試時刻表、本地 SQLite
└── frontend/               # Next.js 前端
    ├── app/page.tsx        # 主儀表板
    ├── app/admin/page.tsx  # 考試規則管理
    └── components/         # React 元件 + shadcn/ui
```

## API 端點

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/courses` | 取得所有課程 |
| PUT | `/api/courses/{id}` | 更新出席/進度/考試指定 |
| GET | `/api/exam-rules` | 取得考試映射規則 |
| POST | `/api/exam-rules` | 新增映射規則 |
| PUT | `/api/exam-rules/{id}` | 更新映射規則 |
| DELETE | `/api/exam-rules/{id}` | 刪除映射規則 |
