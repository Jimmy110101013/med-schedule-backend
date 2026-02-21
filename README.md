負責套件： SQLAlchemy (資料庫溝通)、Pydantic (資料型別驗證)。

執行重點：

定義我們前面討論好的 Course 資料表（包含 Date, Topic, Teacher, Category 等）。

建立驗證機制：確保 Attendance 只能寫入預設的狀態（未標記、現場出席、錄影補課、加強複習），Study_Progress 必須是陣列（Array/JSON）。

驗收標準： 系統能成功在本地端建立一個 .db 檔案，且能寫入一筆測試用的虛擬課程資料而不報錯。

Phase 2: PDF 解析引擎 (The Parser Engine)
這是整個專案運算邏輯最重、最具挑戰性的地方（也就是你的「濾波器」）。


核心目標： 將 114-2 醫四週課表的 PDF 檔案 ，穩定地轉換為 Phase 1 定義好的資料格式。
+3

負責套件： pdfplumber、原生 re (正則表達式)。

執行重點：


空間定位： 精準切分出包含星期與日期的表頭 ，以及 08:00 到 17:00 的時間軸 。
+2


字串拆解： 處理同一時段包含多堂課的狀況（例如將含有換行符號的儲存格劈開）。


正則萃取與覆寫： 寫出能最大化寬容抓取 [科目]、課程代碼、主題、教師 的邏輯，並對含有「考試」或「SKILL」的課程執行分類覆寫 。
+1

驗收標準： 餵入一份 PDF 檔案，解析引擎能吐出一份長度正確、欄位無缺失的 JSON 或 List 格式資料，準備寫入資料庫。

Phase 3: 業務邏輯與狀態管理 (Business Logic Service)
這一步負責串接前後端，管理狀態的更新。

核心目標： 建立提供給前端呼叫的「操作介面（API）」。

負責套件： 純 Python 邏輯。

執行重點：

防呆機制 (Upsert 邏輯)： 確保重新上傳同一份 PDF 時，系統只會新增原本沒有的課程，而不會覆蓋或洗掉你已經標記好的「一刷/二刷」進度。

統計計算： 撰寫邏輯來計算「各科總堂數」與「已完成進度比例」，準備餵給儀表板。

驗收標準： 能成功呼叫函式來更新某堂課的進度，且統計數據能正確反應變化。

Phase 4: Streamlit 互動介面 (Frontend UI)
當前面三層都穩固後，這一步就會非常輕鬆，只需把資料「畫」出來。

核心目標： 打造流暢的戰況總覽與互動課表操作體驗。

負責套件： Streamlit。

執行重點：

實作左側 Sidebar（上傳按鈕、週次切換、條件過濾器）。

實作頂部 Dashboard（圓餅圖、進度條、待補課堂數）。

實作核心的可編輯資料表（Interactive Data Editor），並將使用者的點選動作綁定到 Phase 3 的更新邏輯上。

驗收標準： 擁有一個完整的網頁介面，點選「已補課」時，畫面不崩潰且重整後狀態依然保留。


med_schedule_tracker/          # 你的專案根目錄
│
├── app.py                     # [入口點] Streamlit 的主程式啟動檔
├── requirements.txt           # [依賴設定] 記錄專案所需的所有 Python 套件
│
├── data/                      # [靜態資源] 
│   └── local_database.db      # SQLite 資料庫檔案 (系統自動生成)
│
├── database/                  # [Phase 1: 資料庫連線層]
│   ├── db_setup.py            # 負責建立 SQLite 連線與初始化 Session
│   └── models.py              # SQLAlchemy 資料表結構定義 (定義 Course Table)
│
├── schemas/                   # [Phase 1: 資料驗證層]
│   └── course_schema.py       # Pydantic 型別定義 (確保寫入 DB 前的資料型態 100% 正確)
│
├── parser/                    # [Phase 2: 解析服務層]
│   ├── pdf_reader.py          # 負責 pdfplumber 讀取、表格座標定位與換行拆解
│   └── text_extractor.py      # 負責 Regex 正則萃取與字串分類覆寫邏輯
│
├── services/                  # [Phase 3: 業務邏輯層]
│   └── course_service.py      # 擔任中樞，提供「匯入新課表」、「更新進度」、「計算各科統計」等功能給前端呼叫
│
└── ui/                        # [Phase 4: 展示層]
    ├── sidebar.py             # 負責左側面板的 UI (上傳按鈕、篩選器)
    ├── dashboard.py           # 負責頂部數據儀表板的 UI
    └── schedule_table.py      # 負責互動式課表的渲染與回傳點擊事件