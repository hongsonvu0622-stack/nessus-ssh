# 📘 NexusSSH Pro — Sổ Tay Hướng Dẫn & Tổng Hợp Tính Năng (User & Feature Guide)

Tài liệu tổng hợp đầy đủ các tính năng, hướng dẫn sử dụng và giải đáp kỹ thuật của **NexusSSH Pro v1.0.2**.

---

## 🌟 1. Quản Lý Kết Nối 4 Giao Thức (Multi-Protocol 4-in-1)

### 🖥️ 1.1 Remote Desktop Protocol (RDP)
Tính năng hỗ trợ kết nối và điều khiển máy chủ Windows/Desktop từ xa:
- **Tùy chỉnh thông số cấu hình**:
  - Địa chỉ IP / Hostname & Cổng RDP (mặc định `3389`).
  - Tên đăng nhập Windows & Mật khẩu (tùy chọn, được mã hóa AES-256-GCM).
  - Độ phân giải màn hình (`1280x720`, `1920x1080`, `2K`, `4K`) và chế độ toàn màn hình (`Fullscreen`).
- **Cơ chế khởi chạy thông minh trên macOS (Microsoft Remote Desktop / Windows App)**:
  - Khi nhấn **"🖥 Kết Nối RDP"**, NexusSSH tự động tạo tệp cấu hình `.rdp` chuẩn và gọi trực tiếp ứng dụng **Microsoft Remote Desktop** (hoặc **Windows App**) trên máy Mac.
  - **Tự động sao chép mật khẩu vào Clipboard (`pbcopy`)**: Do bảo mật của Apple/Microsoft cấm truyền mật khẩu bản rõ qua tệp `.rdp`, ứng dụng tự động chép mật khẩu đã giải mã vào Clipboard hệ thống. Khi ứng dụng Remote Desktop hiện hộp thoại hỏi mật khẩu, bạn chỉ cần bấm **`Cmd + V`** để dán ngay!
- **Hỗ trợ Windows & Linux**:
  - Trên Windows: Khởi chạy trực tiếp `mstsc` (Remote Desktop Connection).
  - Trên Linux: Khởi chạy qua `xfreerdp` hoặc `remmina`.

---

### 🔐 1.2 SSH Server & Quản Lý Khóa
- Kết nối máy chủ Linux/Unix tốc độ cao.
- **Import Khóa SSH & Xem trước thông tin (Review Before Import)**: Kéo thả tệp Private Key (`id_rsa`, `id_ed25519`, `.pem`...) và hiển thị thông tin chi tiết trước khi lưu.
- **Xác thực động (Dynamic Auth)**: Tự động hiện hộp thoại nhập lại mật khẩu hoặc chọn khóa SSH thay thế nếu phiên đăng nhập bị từ chối mà không cần ra ngoài sửa cấu hình.
- **PTY Auto-Resize**: Nhận diện thay đổi kích thước cửa sổ và tự động co giãn màn hình lệnh theo thời gian thực (hỗ trợ `htop`, `vim`, `nano`...).

---

### 🔌 1.3 Serial Console (USB/UART/RS232)
- Hỗ trợ kết nối cấu hình thiết bị mạng (Cisco Switch/Router, Firewall, Arduino, IoT...).
- Tự động quét và liệt kê cổng Serial đang cắm trên macOS (`/dev/cu.usbserial*`) và Windows (`COM*`).
- Cấu hình đầy đủ Baud Rate (`9600`, `115200`...), Data Bits, Parity, Stop Bits.

---

### 💻 1.4 Local Shell
- Khởi chạy trực tiếp terminal nội bộ của máy tính ngay trong tab ứng dụng (`/bin/zsh` trên Mac, `PowerShell` trên Windows).

---

## 🛠️ 2. Các Công Cụ & Tiện Ích Nâng Cao

### 📂 2.1 Nhập / Xuất Dữ Liệu Excel (`.xlsx`)
- **Export Excel**: Xuất toàn bộ danh sách kết nối (kèm thư mục/nhóm) ra file Excel tiện lưu trữ.
- **Import Excel**: Thêm hàng trăm kết nối vào ứng dụng chỉ trong vài giây từ bảng tính.

### 🔄 2.2 Nhập Cấu Hình SSH (`~/.ssh/config`)
- Quét tự động tệp cấu hình OpenSSH trên máy tính và nhập vào danh sách máy chủ chỉ với 1 cú nhấp chuột.

### ⚡ 2.3 Quản Lý Tập Lệnh Nhanh (Snippet Drawer)
- Lưu trữ các lệnh DevOps thường dùng và chạy trực tiếp trên tab terminal đang mở.

### 🚀 2.4 Cập Nhật Tự Động (Auto-Updater)
- Tự động kiểm tra phiên bản mới từ GitHub Releases.
- Tải, giải nén và cập nhật trực tiếp ngay trong giao diện ứng dụng.

---

## 🍏 3. Xử Lý Sự Cố macOS (Gatekeeper & Quarantine)

Khi tải ứng dụng từ trình duyệt web trên macOS, hệ điều hành gắn cờ cách ly bảo mật (`com.apple.quarantine`). Nếu gặp thông báo *"App is damaged and can't be opened"*:

**Khắc phục nhanh:**
1. Kéo ứng dụng **NexusSSH** vào thư mục **Applications**.
2. Mở **Terminal** trên Mac và chạy lệnh:
   ```bash
   sudo xattr -cr /Applications/NexusSSH.app
   ```
3. Bấm đúp vào ứng dụng trong Applications để khởi chạy bình thường.
