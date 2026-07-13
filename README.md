<div align="center">
  <img src="./client/public/icon.svg" width="115" alt="NexusSSH Logo" />
  <h1>NexusSSH Pro — Cyber Glass Edition</h1>
  <p><b>Trình quản lý kết nối đa giao thức: SSH, Remote Desktop (RDP), Serial Console (UART/USB) & Local Shell mang phong cách Cyber Glassmorphism độc quyền.</b></p>
</div>

---

## 🌟 Tính Năng Nổi Bật

### 1. Quản Lý Kết Nối 4 Trong 1 (Multi-Protocol All-in-One)
- **SSH Server**: Kết nối máy chủ Linux/Unix qua thư viện `ssh2` thuần JavaScript với độ trễ cực thấp và bảo mật tuyệt đối. Hỗ trợ đầy đủ mật khẩu, khóa riêng (`id_rsa`, `id_ed25519`, `.pem`) và Passphrase.
- **Remote Desktop (RDP)**: Quản lý và kết nối máy chủ Windows/Desktop từ xa chỉ với 1 cú nhấp chuột:
  - Tự động tạo tệp cấu hình `.rdp` chuẩn Microsoft với các tùy chỉnh: Độ phân giải (`1920x1080`, `2K`, `4K`...), Chế độ toàn màn hình (`Fullscreen`), Username & Cổng (`3389`).
  - Khởi chạy ứng dụng RDP chuẩn theo hệ điều hành: **Microsoft Remote Desktop / Windows App** (macOS), **Remote Desktop Connection - mstsc** (Windows), **xfreerdp / remmina** (Linux).
  - **Tự động sao chép mật khẩu vào Clipboard trên macOS**: Do Apple & Microsoft cấm truyền mật khẩu plaintext qua tệp `.rdp`, NexusSSH tự động sao chép mật khẩu đã giải mã vào Clipboard — bạn chỉ cần nhấn **`Cmd + V`** để dán ngay khi kết nối!
- **Serial Console (USB/UART/RS232)**: Tự động quét và phát hiện cáp console Cisco, thiết bị USB-to-Serial trên macOS/Windows (`/dev/cu.*`, `COM*`). Tùy chỉnh đầy đủ Baud Rate (`9600`, `115200`, `38400`...), Data Bits, Parity, Stop Bits.
- **Local Shell Terminal**: Mở trực tiếp shell nội bộ trên máy Mac (`/bin/zsh` / `/bin/bash`) hoặc Windows (`powershell.exe`) ngay trong thẻ của ứng dụng.

---

### 2. Bảo Mật Cấp Độ Cao Chuẩn AES-256-GCM
- **Mã hóa cục bộ toàn bộ mật khẩu**: Toàn bộ mật khẩu SSH, mật khẩu RDP và Passphrase được mã hóa chuẩn **AES-256-GCM** với khóa riêng tư lưu ngay trên thiết bị của bạn.
- **Quản lý & Xem trước Khóa SSH (Review Before Import)**: Hỗ trợ kéo thả tệp Private Key và hiển thị thẻ xem trước chi tiết (định dạng khóa, tình trạng mã hóa Passphrase, số dòng) trước khi lưu.
- **Xác thực động (Dynamic Authentication)**: Khi kết nối SSH thất bại do sai mật khẩu hoặc khóa cũ, ứng dụng hiển thị hộp thoại tương tác cho phép chọn khóa SSH thay thế hoặc nhập lại mật khẩu ngay lập tức mà không cần chỉnh sửa kết nối lại từ đầu.

---

### 3. Terminal Tương Tác Đa Tab (`xterm.js`) & Tự Động Co Giãn
- **Đồng bộ kích thước động (Dynamic PTY Auto-Resize)**: Nhận diện thay đổi kích thước cửa sổ theo thời gian thực và gửi tín hiệu `SIGWINCH` tới máy chủ, giúp các ứng dụng full-screen như **`htop`**, **`vim`**, **`nano`** luôn hiển thị vừa vặn hoàn hảo.
- **4 bộ Theme cao cấp**: **Nexus Cyber Dark**, **Cyberpunk Neon**, **Dracula**, **Nord**.
- **Chạy Lệnh Nhanh (Snippet Drawer)**: Thực thi nhanh các tập lệnh DevOps và giám sát hệ thống (`htop`, `docker ps`, `df -h`, `show running-config`...).

---

### 4. Nhập & Xuất Dữ Liệu Linh Hoạt (Excel & SSH Config)
- **Import / Export bảng tính Excel (`.xlsx`)**: Thêm hàng loạt hàng chục hoặc hàng trăm máy chủ vào danh sách quản lý theo Thư mục/Nhóm chỉ trong vài giây.
- **Tự động quét & Nhập cấu hình từ `~/.ssh/config`**.

---

### 5. Hệ Thống Cập Nhật Tự Động (Auto-Updater)
- **Tự động kiểm tra phiên bản mới từ GitHub Releases**: Thông báo ngay trên thanh công cụ khi có bản phát hành mới.
- **Tải và cài đặt trực tiếp trong ứng dụng**: Hộp thoại hiển thị tiến trình tải, tiến trình giải nén và tự động khởi động lại bản cập nhật mới trong 3 giây sau khi hoàn tất.

---

## 📥 Hướng Dẫn Tải Về & Cài Đặt (Download & Installation)

Tải xuống bản phát hành chính thức mới nhất cho **macOS** và **Windows**:  
👉 **[Trang Phát Hành NexusSSH Releases](https://github.com/hongsonvu0622-stack/nessus-ssh/releases)**

### 🍏 Người dùng macOS & Cách xử lý thông báo Gatekeeper ("App is damaged")
Khi tải file `.dmg` hoặc `.zip` từ trình duyệt web, macOS tự động gắn cờ cách ly bảo mật (`com.apple.quarantine`). Nếu macOS báo lỗi ứng dụng bị hỏng hoặc không mở được:

**Khắc phục nhanh trong 3 giây:**
1. Kéo ứng dụng **NexusSSH** vào thư mục **Applications**.
2. Mở **Terminal** trên máy Mac và chạy lệnh sau:
   ```bash
   sudo xattr -cr /Applications/NexusSSH.app
   ```
3. Bấm đúp vào **NexusSSH** trong Applications là ứng dụng mở và hoạt động bình thường!

*(Lưu ý đối với tính năng RDP trên máy Mac: Vui lòng cài đặt sẵn ứng dụng **Microsoft Remote Desktop** hoặc **Windows App** từ Mac App Store).*

### 🪟 Người dùng Windows
Tải file bộ cài đặt **`NexusSSH Setup x.x.x.exe`** từ trang Releases và nhấp đúp để cài đặt ứng dụng.
