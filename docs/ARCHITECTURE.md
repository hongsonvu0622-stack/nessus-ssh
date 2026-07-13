# 🏗️ NexusSSH Pro — Architecture & Technical Guide

Tài liệu này mô tả chi tiết kiến trúc kỹ thuật, quy trình khởi chạy mã nguồn, đóng gói và cấu trúc hệ thống dành cho nhà phát triển (Developers & Architects).

---

## 🚀 Hướng Dẫn Khởi Chạy Mã Nguồn (Development Mode)

### 1. Cài đặt thư viện phụ thuộc
```bash
npm install
```

### 2. Khởi chạy ứng dụng Desktop native (Electron)
```bash
npm run electron
```
*Lệnh này sẽ khởi chạy đồng thời Backend Server (Port 4000), Vite Frontend Dev Server (Port 5173) và cửa sổ Electron native trên macOS/Windows/Linux.*

### 3. Khởi chạy chế độ Web App trên trình duyệt
```bash
npm run dev
```
Sau đó mở trình duyệt tại đường dẫn: **`http://localhost:5173`**

---

## 📁 Cấu Trúc Mã Nguồn

```
nexus-ssh/
├── package.json               # Cấu hình script khởi chạy & đóng gói electron-builder
├── electron-main.js           # Wrapper Electron quản lý cửa sổ & backend embedded
├── server/                    # Backend API & Socket.IO realtime server
│   ├── server.js              # Express & Socket.IO server (Port 4000)
│   ├── sshManager.js          # Quản lý luồng kết nối SSH & Auto-Resize PTY
│   ├── serialManager.js       # Quản lý & tự động quét cổng Serial macOS/Windows
│   ├── localPtyManager.js     # Quản lý shell nội bộ đa nền tảng
│   ├── sftpManager.js         # Quản lý thao tác file SFTP
│   ├── cryptoUtil.js          # Mã hóa / giải mã AES-256-GCM mật khẩu
│   └── dataStore.js           # Lưu trữ danh sách kết nối (~/.nexusssh)
└── client/                    # Frontend React 18 + Vite + xterm.js
    ├── public/
    │   └── icon.svg           # Biểu tượng ứng dụng chuẩn Squircle Neon
    ├── src/
    │   ├── components/        # HostList, TerminalTab, SftpBrowser, SerialScannerModal...
    │   └── index.css          # Design system Cyber Glassmorphism
```

---

## 🔒 Kiến Trúc Bảo Mật & Dữ Liệu

Toàn bộ danh sách kết nối và cấu hình được lưu trữ tại thư mục cá nhân của người dùng:
- **Cấu hình máy chủ**: `~/.nexusssh/connections.json`
- **Khóa bí mật mã hóa (AES-256-GCM)**: `~/.nexusssh/secret.key`

### Cơ Chế Bảo Mật
1. **Mã hóa mật khẩu tại chỗ (Zero-Knowledge Local Encryption)**: Mật khẩu và Passphrase không bao giờ lưu bản rõ (plaintext).
2. **Cách ly ngữ cảnh Electron (Context Isolation)**: Cửa sổ trình duyệt chạy với `nodeIntegration: false`, `contextIsolation: true` và tắt hoàn toàn `devTools`.

---

## 📦 Hướng Dẫn Đóng Gói & Build Bộ Cài (Production Build Guide)

NexusSSH sử dụng **`electron-builder`** để tạo bộ cài đặt độc lập cho macOS, Windows và Linux.

### 1. Đóng gói cho macOS (Hỗ trợ Apple Silicon ARM64 & Intel x64)
```bash
npm run dist:mac
```
- Đầu ra: `release/NexusSSH-1.0.0-arm64.dmg` và `release/NexusSSH-1.0.0-x64.dmg`.

### 2. Đóng gói cho Windows (.exe Setup Installer)
```bash
npm run dist:win
```
- Đầu ra: `release/NexusSSH Setup 1.0.0.exe`.

### 3. Đóng gói cho Linux (.AppImage)
```bash
npm run dist:linux
```
