# CLAUDE.md

## ⚡ 知識導航 (Knowledge Navigation)

**預設不載入細節文件。** 依任務類型，按需讀取對應 Skill 檔案：

| 任務類型 | 按需讀取 |
|---------|---------|
| PDF 匯入、`parser/` 目錄、解析邏輯 | `@.claude/skills/SKILL_PDF_PARSER.md` |
| API、資料庫 schema、ORM、Pydantic、部署 | `@.claude/skills/SKILL_DATA_MODEL.md` |
| 前端元件、資料流、UI 互動、Next.js | `@.claude/skills/SKILL_FRONTEND_LOGIC.md` |

---

## 🚨 Critical Rules（最高優先級，不可違反）

### 【Plan Mode 協議】
當使用者在訊息中標註 **`[plan mode]`** 時：
> **絕對禁止直接給出實作程式碼。**
> 必須先與使用者深度討論架構細節、實作邏輯與邊界條件，確認雙方達成共識後，才能開始撰寫任何程式碼。

### 【Tool Use 協議】
- CLAUDE.md 與 Skills 檔案已描述過的架構，不得重複用 Read/Glob 驗證
- 使用者明確指定檔案路徑時，直接操作，不先 Explore
- 是否啟動 Agent/Explore 以**任務複雜度**判斷，而非檔案數量——單純的定點修改不需要探索
- 修改後**不做確認性 Read**；依賴 `npm run build` / TypeScript / Linter 的報錯來發現問題，而非手動重讀檔案

---

## Project Overview

**NYCU 醫四週課表戰略儀表板** — NYCU Med10 學生的臨床課程追蹤系統。
追蹤項目：課程出席、讀書進度、考試準備。

**Stack:** FastAPI + Next.js 16 + Supabase PostgreSQL

---

## Dev Commands

```bash
# Backend（先啟動 venv）
venv\Scripts\activate
uvicorn main:app --reload        # dev (port 8000)

# Frontend
cd frontend
npm run dev                      # dev (port 3000)
npm run build && npm run start   # production

# 兩者同時啟動（Windows）
start.bat
```

---

## Directory Structure

```
Med_schedule_tracker/
├── main.py              # FastAPI 入口，所有 API routes
├── database/            # SQLAlchemy engine + ORM models
├── schemas/             # Pydantic schemas & Enums
├── parser/              # 離線 PDF 解析工具（非 API）
├── services/            # 業務邏輯（upsert、exam 映射）
├── scripts/             # 開發用工具腳本
├── data/                # PDF 原始檔、SQLite DB（本地用）
└── frontend/
    ├── app/             # Next.js App Router 頁面
    └── components/      # 共用元件（InteractiveTable 等）
```
