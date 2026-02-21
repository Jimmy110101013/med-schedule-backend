@echo off
chcp 65001 >nul
echo ===================================================
echo 🏥 正在啟動 NYCU 醫學系課表戰略儀表板...
echo ===================================================

echo [1/2] 啟動 FastAPI 後端大腦 (Port 8000)...
:: 開啟一個新的命令提示字元，啟動虛擬環境並執行 FastAPI
start cmd /k "venv\Scripts\activate && uvicorn main:app --reload"

echo [2/2] 啟動 Next.js 前端視覺 (Port 3000)...
:: 開啟第二個命令提示字元，進入 frontend 資料夾並執行 Next.js
start cmd /k "cd frontend && npm run dev"

echo.
echo ✅ 系統已全數點火！3 秒後自動為您開啟瀏覽器...
timeout /t 3 /nobreak >nul

:: 自動呼叫你的預設瀏覽器打開前端網頁
start http://localhost:3000

echo 啟動完畢！此視窗可安全關閉。
exit