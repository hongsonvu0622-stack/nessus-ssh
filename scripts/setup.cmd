@echo off
cd /d "%~dp0\.."
chcp 65001 > nul
echo =================================================================
echo        NexusSSH Pro — Full Environment Setup (Windows)
echo =================================================================
echo.

echo [1/3] Kiểm tra Node.js và npm...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo LỖI: Chưa cài đặt Node.js! Vui lòng cài đặt Node.js từ https://nodejs.org/
    pause
    exit /b 1
)
node -v
npm -v
echo.

echo [2/3] Đang cài đặt thư viện gốc và biên dịch SerialPort cho Windows...
call npm install
if %ERRORLEVEL% neq 0 (
    echo Lỗi khi cài đặt thư viện gốc!
    pause
    exit /b 1
)
echo Hoàn tất cài đặt thư viện gốc!
echo.

echo [3/3] Đang cài đặt thư viện Frontend React/Vite (client)...
call npm install --prefix client
if %ERRORLEVEL% neq 0 (
    echo Lỗi khi cài đặt thư viện client!
    pause
    exit /b 1
)
echo Hoàn tất cài đặt thư viện client!
echo.

echo =================================================================
echo HOÀN TẤT CÀI ĐẶT TRỌN BỘ CHO WINDOWS!
echo Các lệnh bạn có thể sử dụng:
echo   - Chạy thử app:                 npm run electron
echo   - Build bộ cài Windows (.exe):  npm run dist:win
echo =================================================================
pause
