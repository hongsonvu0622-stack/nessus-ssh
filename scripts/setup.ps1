# ==============================================================================
# NexusSSH Pro - Full Project Setup & Installation Script (Windows PowerShell)
# ==============================================================================

Set-Location -Path "$PSScriptRoot\.."

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "       NexusSSH Pro — Full Environment Setup (PowerShell)        " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "➤ [1/3] Kiểm tra Node.js & npm..." -ForegroundColor Yellow
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "Lỗi: Node.js chưa được cài đặt trên máy này." -ForegroundColor Red
    exit 1
}
Write-Host "✔ Node.js version: $(node -v)" -ForegroundColor Green
Write-Host "✔ npm version: $(npm -v)" -ForegroundColor Green
Write-Host ""

Write-Host "➤ [2/3] Đang cài đặt thư viện gốc (Root & Native SerialPort cho Windows)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Lỗi khi chạy npm install!" -ForegroundColor Red
    exit 1
}
Write-Host "✔ Cài đặt thư viện gốc thành công!" -ForegroundColor Green
Write-Host ""

Write-Host "➤ [3/3] Đang cài đặt thư viện Frontend React/Vite (client)..." -ForegroundColor Yellow
npm install --prefix client
if ($LASTEXITCODE -ne 0) {
    Write-Host "Lỗi khi cài đặt thư viện client!" -ForegroundColor Red
    exit 1
}
Write-Host "✔ Cài đặt thư viện client thành công!" -ForegroundColor Green
Write-Host ""

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "🎉 CÀI ĐẶT HOÀN TẤT TRỌN BỘ CHO WINDOWS!" -ForegroundColor Green
Write-Host "  - Chạy thử app (Dev Mode):         npm run electron"
Write-Host "  - Build bộ cài Windows (.exe):     npm run dist:win"
Write-Host "=================================================================" -ForegroundColor Cyan
