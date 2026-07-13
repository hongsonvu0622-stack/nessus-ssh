# 🏗️ NexusSSH Pro — Architecture & Technical Guide (v1.0.2)

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
*Lệnh này khởi chạy đồng thời Backend Server (Port 4000), Vite Frontend Dev Server (Port 5173) và cửa sổ Electron native trên macOS/Windows/Linux.*

### 3. Khởi chạy chế độ Web App trên trình duyệt
```bash
npm run dev
```
Sau đó mở trình duyệt tại đường dẫn: **`http://localhost:5173`**

---

## 📁 Cấu Trúc Mã Nguồn & Module Hệ Thống

```
nexus-ssh/
├── package.json               # Cấu hình script khởi chạy & đóng gói electron-builder
├── electron-main.js           # Wrapper Electron quản lý cửa sổ & backend embedded
├── server/                    # Backend API & Socket.IO realtime server (Port 4000)
│   ├── server.js              # Express & Socket.IO server chính
│   ├── sshManager.js          # Quản lý phiên SSH & Auto-Resize PTY (SIGWINCH)
│   ├── rdpManager.js          # Quản lý & khởi chạy RDP (Microsoft Remote Desktop / mstsc / xfreerdp)
│   ├── serialManager.js       # Quản lý & tự động quét cổng Serial macOS/Windows (/dev/cu.*, COM*)
│   ├── localPtyManager.js     # Quản lý shell nội bộ đa nền tảng (/bin/zsh, PowerShell)
│   ├── sftpManager.js         # Quản lý thao tác file & thư mục SFTP
│   ├── updaterManager.js      # Kiểm tra & tự động tải bản cập nhật mới từ GitHub Releases
│   ├── configImporter.js      # Tự động đọc và parse cấu hình từ ~/.ssh/config
│   ├── cryptoUtil.js          # Mã hóa / giải mã AES-256-GCM mật khẩu cục bộ
│   └── dataStore.js           # Quản lý đọc/ghi cấu hình kết nối (~/.nexusssh)
└── client/                    # Frontend React 18 + Vite + xterm.js
    ├── public/
    │   └── icon.svg           # Biểu tượng ứng dụng chuẩn Squircle Neon
    └── src/
        ├── components/        # HostList, HostModal, TerminalTab (Multi-pane xterm.js), UpdateModal...
        └── index.css          # Design system Cyber Glassmorphism
```

---

## 🖥️ Kiến Trúc Các Giao Thức (4-in-1 Multi-Protocol Architecture)

### 1. SSH Server (`sshManager.js`)
- Sử dụng thư viện `ssh2` thuần JavaScript.
- Hỗ trợ đầy đủ mật khẩu, tệp khóa riêng (`id_rsa`, `id_ed25519`, `.pem`) cùng Passphrase.
- Cơ chế **Dynamic PTY Resize**: Lắng nghe sự kiện resize từ `xterm.js` và đồng bộ kích thước cột/dòng động tới máy chủ từ xa.

### 2. Remote Desktop Protocol (`rdpManager.js`)
- Tự động tạo tệp cấu hình `.rdp` chuẩn Microsoft với đầy đủ tham số: Host, Cổng, Username, Độ phân giải màn hình (`rdpResolution`), chế độ Toàn màn hình (`rdpFullscreen`).
- **macOS Native Integration**: Tự động nhận diện ứng dụng **Microsoft Remote Desktop** / **Windows App** trên Mac (`open -a "Microsoft Remote Desktop" file.rdp`).
- **Auto-Copy Password (macOS)**: Tự động chép mật khẩu đã giải mã vào Clipboard hệ thống (`pbcopy`) trước khi mở app RDP, cho phép người dùng dán nhanh chỉ bằng `Cmd + V`.
- Tự động xóa file `.rdp` tạm sau 5 giây để bảo mật.

### 3. Serial Console (`serialManager.js`)
- Tự động phát hiện cổng nối tiếp trên macOS (`/dev/cu.usbserial*`, `/dev/cu.SLAB_USBtoUART*`) và Windows (`COM*`).
- Hỗ trợ tinh chỉnh Baud Rate (`9600`, `115200`...), Data Bits, Parity, Stop Bits.

### 4. Local Shell (`localPtyManager.js`)
- Khởi chạy shell gốc của hệ điều hành qua `node-pty` (`/bin/zsh` hoặc `powershell.exe`).

---

## 🔒 Kiến Trúc Bảo Mật & Dữ Liệu

Toàn bộ danh sách kết nối và cấu hình được lưu trữ tại thư mục cá nhân của người dùng:
- **Cấu hình máy chủ**: `~/.nexusssh/connections.json`
- **Khóa bí mật mã hóa (AES-256-GCM)**: `~/.nexusssh/secret.key`

### Cơ Chế Bảo Mật
1. **Mã hóa mật khẩu tại chỗ (Zero-Knowledge Local Encryption)**: Mật khẩu và Passphrase được mã hóa AES-256-GCM bằng khóa duy nhất tạo trên máy người dùng.
2. **Cách ly ngữ cảnh Electron (Context Isolation)**: Cửa sổ trình duyệt chạy với `nodeIntegration: false`, `contextIsolation: true` và tắt `devTools` ở chế độ production.

---

## 📦 Hướng Dẫn Đóng Gói & Build Bộ Cài (Production Build Guide)

### 1. Script tự động build phiên bản (`build-local.sh`)
Ứng dụng hỗ trợ script tự động cập nhật số phiên bản từ biến môi trường `VERSION` và tạo bản cài đặt:
```bash
VERSION=1.0.2 ./build-local.sh
```

### 2. Đóng gói thủ công theo nền tảng
- **macOS (.dmg - Apple Silicon & Intel)**: `npm run dist:mac`
- **Windows (.exe Setup Installer)**: `npm run dist:win`
- **Linux (.AppImage)**: `npm run dist:linux`
