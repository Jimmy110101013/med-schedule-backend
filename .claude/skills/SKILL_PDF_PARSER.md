# SKILL: PDF Parser Logic

> 按需載入：僅在處理 PDF 匯入、解析邏輯、或 `parser/` 目錄相關任務時讀取此檔案。

## 架構概覽

PDF Parser 是**純離線工具**，不對外暴露 API endpoint。
用途：將課表 PDF 匯入資料庫，由 `scripts/run_import.py` 手動執行。

```
parser/
├── pdf_reader.py       # 座標提取、ROI 格子裁切
└── text_extractor.py   # Regex 分類、類別覆寫

services/
└── course_service.py   # Upsert 邏輯（保護使用者進度不被覆蓋）
```

---

## pdf_reader.py — 座標解析引擎

**核心職責：** 從 PDF 的二維座標系統中定位每個課程格子。

### 運作原理
1. **Y 軸時間錨點偵測**：掃描頁面找出時段標籤（如 `08:00-09:00`），記錄其 Y 座標作為列邊界
2. **X 軸日期錨點偵測**：掃描找出星期/日期標題，記錄其 X 座標作為欄邊界
3. **ROI 格子裁切**：對每個 `(date, time_slot)` 組合，依 X/Y 邊界裁出矩形區域（ROI = Region of Interest），再從該區域提取文字

### 關鍵注意事項
- PDF 座標系原點在**左下角**（pdfplumber 使用標準 PDF 座標）
- 格子邊界有容差值（tolerance），避免像素偏移導致漏字
- 空白格子（Holiday/無課）會返回空字串，由 text_extractor 處理

---

## text_extractor.py — 文字分類引擎

**核心職責：** 將 ROI 裁出的原始文字字串，分類並結構化為課程資料。

### 處理流程
```
原始文字
  ↓ 1. Blacklist 過濾（去除版權、頁碼、雜訊字串）
  ↓ 2. 類別關鍵字偵測
  ↓ 3. Bracket 格式解析
  ↓ 4. 返回結構化 Course dict
```

### 類別偵測規則（優先序）
| 類別 | 偵測方式 |
|------|---------|
| `Holiday` | 關鍵字：國定假日、補假、休課 |
| `Exam` | 關鍵字：考試、測驗、exam |
| `PBL` | 關鍵字：PBL、問題導向 |
| `Skill` | 關鍵字：技能、OSCE |
| `Science/Other` | 解析 `[科目]` bracket 格式後依科目名稱判斷 |

### Bracket 格式解析
標準課程格式：`[科目]: 課程代碼, 主題, 教師`

範例：`[內科]: C1234, 心臟衰竭病理機轉, 王大明`

解析結果：
- `category` = `"內科"` (或經過 category override 映射後的值)
- `course_code` = `"C1234"`
- `topic` = `"心臟衰竭病理機轉"`
- `teacher` = `"王大明"`

### Category Override
部分科目名稱需要手動映射到標準 category（如 `"基礎醫學"` → `"Science"`）。
Override 表定義在 `text_extractor.py` 頂部的 dict 常數中。

---

## course_service.py — 安全 Upsert 邏輯

**最重要的不變式（Invariant）：**
> 重新匯入 PDF **絕對不會** 覆蓋使用者已輸入的 `attendance` 和 `study_progress`。

### Upsert Key
唯一識別鍵為複合主鍵：`(course_code, date, time_slot)`

### Upsert 行為
- **新課程**：完整插入，所有欄位設為預設值（`attendance = "未標記"`, `study_progress = []`）
- **已存在課程**：只更新 `topic`、`teacher`、`category` 等靜態欄位；**跳過** `attendance`、`study_progress`、`target_exam_override`

### 執行方式
```bash
# 在 venv 啟動後執行
python scripts/run_import.py --pdf data/<filename>.pdf
```

---

## 常見除錯腳本

```bash
python scripts/debug_pdf.py    # 印出 PDF 座標分析結果
python scripts/test_roi.py     # 視覺化 ROI 裁切範圍
python scripts/check_db.py     # 確認資料庫現有課程數量
```
