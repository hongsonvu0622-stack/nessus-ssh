<div align="center">
  <img src="./client/public/icon.svg" width="110" alt="NexusSSH Logo" />
  <h1>NexusSSH Pro — Cyber Glass Edition</h1>
  <p><b>Trình quản lý kết nối máy chủ SSH, Serial Console (UART/USB) và trình duyệt SFTP cao cấp đa nền tảng mang phong cách Cyber Glassmorphism độc quyền.</b></p>
</div>

---

## 🌟 Tính Năng Nổi Bật

### 1. Quản Lý Kết Nối Đa Giao Thức (Multi-Protocol)
- **SSH Server**: Kết nối máy chủ Linux/Unix qua thư viện `ssh2` thuần JavaScript (hiệu năng cao, bảo mật tuyệt đối).
- **Serial Console (USB/UART/RS232)**: Tự động quét cáp console, thiết bị USB-to-Serial trên macOS/Windows (`/dev/cu.*`, `COM*`), tùy chỉnh Baud Rate (`9600`, `115200`, `38400`...), Data Bits, Parity, Stop Bits.
- **Local Terminal**: Mở shell nội bộ trực tiếp trên máy Mac (`/bin/zsh`) hoặc Windows (`powershell.exe`).

### 2. Xác Thực Thông Minh & Bảo Mật Chuẩn AES-256-GCM
- **Lưu trữ mật khẩu mã hóa**: Toàn bộ mật khẩu và passphrase được mã hóa chuẩn **AES-256-GCM** bảo mật cục bộ ngay trên thiết bị của bạn.
- **Chuyển đổi xác thực động**: Khi kết nối SSH thất bại do sai mật khẩu hoặc khóa cũ, ứng dụng tự động hiển thị hộp thoại cho phép chọn khóa SSH thay thế hoặc nhập lại mật khẩu ngay lập tức.

### 3. Terminal Tương Tác Đa Tab (`xterm.js`) & Tự Động Co Giãn Màn Hình
- **Đồng bộ kích thước động (Dynamic PTY Auto-Resize)**: Nhận diện thay đổi kích thước cửa sổ theo thời gian thực và gửi tín hiệu `SIGWINCH` tới máy chủ, giúp các ứng dụng full-screen như **`htop`**, **`vim`**, **`nano`** luôn vừa vặn hoàn hảo.
- **4 bộ Theme cao cấp**: **Nexus Cyber Dark**, **Cyberpunk Neon**, **Dracula**, **Nord**.

### 4. Trình Duyệt File SFTP & Quản Lý Lệnh Nhanh
- Duyệt, chỉnh sửa, tải xuống/tải lên tệp tin từ xa qua SFTP được tích hợp sẵn.
- **Run Snippet**: Thực thi nhanh các lệnh DevOps (`htop`, `docker ps`, `show running-config`...).
- **Nhập tự động cấu hình SSH có sẵn trên máy** chỉ với 1 cú nhấp chuột.

---

## 📥 Hướng Dẫn Tải Về & Cài Đặt (Download & Installation)

Tải xuống bản phát hành chính thức mới nhất cho **macOS** và **Windows**:  
👉 **[Trang Phát Hành NexusSSH Releases](https://github.com/hongsonvu0622-stack/nessus-ssh/releases)**

### 🍏 Người dùng macOS & Cách xử lý thông báo Gatekeeper ("App is damaged")
Khi tải file `.dmg` từ trình duyệt web, macOS tự động gắn cờ cách ly bảo mật (`com.apple.quarantine`). Nếu macOS báo lỗi không mở được ứng dụng:

**Khắc phục nhanh trong 3 giây:**
1. Kéo ứng dụng **NexusSSH** vào thư mục **Applications**.
2. Mở **Terminal** trên máy Mac và chạy lệnh sau:
   ```bash
   sudo xattr -cr /Applications/NexusSSH.app
   ```
3. Bấm đúp vào **NexusSSH** trong Applications là ứng dụng mở và hoạt động bình thường!

### 🪟 Người dùng Windows
Tải file bộ cài đặt **`NexusSSH Setup x.x.x.exe`** từ trang Releases và nhấp đúp để cài đặt ứng dụng.

---

## 📚 Tài Liệu Kỹ Thuật & Khởi Chạy Mã Nguồn (For Developers)

Để xem hướng dẫn khởi chạy mã nguồn (`npm run electron`, `npm run dev`), cấu trúc hệ thống và quy trình đóng gói (`electron-builder`), vui lòng tham khảo:  
👉 **[Tài Liệu Kiến Trúc & Khởi Chạy Mã Nguồn (docs/ARCHITECTURE.md)](./docs/ARCHITECTURE.md)**
