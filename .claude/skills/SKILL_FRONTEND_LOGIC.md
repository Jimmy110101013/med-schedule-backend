# SKILL: Frontend Data Flow & UI Architecture

> 按需載入：僅在處理前端元件、資料流、UI 互動、或 Next.js 路由相關任務時讀取此檔案。

## 頁面結構

```
frontend/app/
├── page.tsx              # 主儀表板（KPI 卡片、課程列表、戰略週曆）
├── admin/page.tsx        # 管理員頁面（ExamRule CRUD）
└── layout.tsx            # 根 layout（ThemeProvider 包裹）

frontend/components/
├── InteractiveTable.tsx  # 核心課程表元件（篩選 + 行內編輯）
├── CalendarEventModal.tsx # 日曆事件點擊後的快速編輯 Modal
└── ui/                   # shadcn/ui 元件（Button, Badge, Card, Tabs, Table...）
```

---

## 主儀表板資料流（`page.tsx`）

### 初始載入
```typescript
// 並行請求，減少等待時間
Promise.all([
  fetch(`${API_URL}/api/courses`),
  fetch(`${API_URL}/api/exam-rules`)
]).then(([courses, rules]) => { ... })
```

### 課程資料增強（Client-side Enrichment）
從 API 拿到的 `courses` 是原始資料，在 client 端計算 `target_exam`：

```
對每門課程：
  1. 若有 target_exam_override → 直接使用
  2. 否則：遍歷所有 Exam 類課程（依日期排序）
     找出第一個「在本課程日期之後」且「ExamRule 涵蓋本課程 category」的考試
  3. 結果存入 enrichedCourses[].target_exam
```

**ExamRule 匹配邏輯：**
- `exam.topic` 包含 `rule.keyword` → 該 rule 的 `categories` 即為此考試的涵蓋範圍
- 特殊處理：英文 cancer/tumor 相關課程 → 優先匹配「腫瘤」相關 rule

### 狀態管理
```typescript
const [courses, setCourses] = useState<Course[]>([])
const [rules, setRules] = useState<ExamRule[]>([])
const [focusMode, setFocusMode] = useState(false)
const [isMobile, setIsMobile] = useState(false)  // window resize listener
const { theme, setTheme } = useTheme()             // next-themes
```

### 更新課程（Optimistic UI）
```typescript
const handleUpdateCourse = async (id, updates) => {
  setCourses(prev => prev.map(c => c.id === id ? {...c, ...updates} : c))  // 立即更新 UI
  await fetch(`PUT /api/courses/${id}`, { body: JSON.stringify(updates) }) // 背景同步
}
```

---

## InteractiveTable 元件

**Props:**
```typescript
{
  courses: Course[]           // 已增強的課程陣列（含 target_exam）
  allExams: Course[]          // 所有 Exam 類課程（供下拉選單）
  onUpdateCourse: fn          // 向上傳遞更新
  focusMode?: boolean         // 專注模式：隱藏篩選列，只顯示傳入課程
}
```

**響應式行為（`useIsMobile` hook）：**
- `window.innerWidth < 768` → 卡片列表（Card List）
- `>= 768` → 標準表格（Table），含 `overflow-x-auto`

**篩選邏輯（非 focusMode 時）：**
- 科目篩選：`selectedCategory`（下拉選單）
- 考試目標篩選：`selectedExam`（下拉選單）
- 兩個篩選 AND 邏輯

---

## 戰略週曆（FullCalendar）

**事件顏色規則（優先序）：**
```
Exam 類別    → 黑色 #000000
已內化課程   → 綠色 #22c55e  (study_progress 非空)
已出席課程   → 藍色 #3b82f6  (現場出席 | 錄影補課)
其他         → 紅色 #ef4444
PBL          → 紫色 #a855f7
```

**響應式視圖：**
- Mobile（`isMobile = true`）：`listWeek` 預設視圖，toolbar 顯示 `listWeek,timeGridDay`
- Desktop：`timeGridWeek` 預設視圖，toolbar 顯示 `dayGridMonth,timeGridWeek`

**事件點擊：** 觸發 `CalendarEventModal`，傳入課程資料與點擊位置座標。
Mobile 上 Modal 改為螢幕置中（`transform: translate(-50%, -50%)`）。

---

## 專注模式（Focus Mode）

觸發條件（同時符合）：
1. `course.target_exam` 非空
2. `course.category` 不在 `["Exam", "PBL", "Holiday", "國考複習"]`
3. 距離目標考試 `0 ≤ days < 7`
4. `study_progress` 為空（尚未內化）

---

## UI 元件規範

- **新增 shadcn/ui 元件**：`npx shadcn add <component>`（不要手動建立）
- **暗色模式**：全面使用 `dark:` Tailwind prefix；`useTheme()` 來自 `next-themes`
- **Hydration 防護**：`mounted` state 避免 SSR/CSR theme 不一致
- **Toast 通知**：使用 `sonner` 的 `toast.error()`，Toaster 放在 `page.tsx` 頂層
