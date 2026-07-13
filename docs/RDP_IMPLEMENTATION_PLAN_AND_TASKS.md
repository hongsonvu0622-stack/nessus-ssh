# 📋 Hồ Sơ Kỹ Thuật: Prompt, Kế Hoạch Triển Khai & Danh Sách Công Việc (RDP Support)

Tài liệu này tổng hợp toàn bộ bối cảnh yêu cầu (Prompt), kế hoạch thiết kế kỹ thuật (Implementation Plan) và danh sách các tác vụ đã hoàn thành (Task Checklist) cho tính năng **Hỗ Trợ Remote Desktop Protocol (RDP)** trên NexusSSH Pro v1.0.2.

---

## I. YÊU CẦU & BỐI CẢNH (PROMPT & REQUIREMENT)

### 1. Yêu cầu của người dùng (User Prompt)
> *"Là tính năng hỗ trợ RDP được không, mô tả trước khi làm nhé."*  
> *"MacBook thì dùng Remote Desktop app của Mac chứ."*  
> *"Không truyền được password hả, tôi bấm nhưng vẫn hỏi pass."*

### 2. Bối cảnh hệ thống
Trước phiên bản 1.0.2, NexusSSH hỗ trợ 3 giao thức quản lý chính:
- **SSH Server** (thư viện `ssh2` thuần JS + `xterm.js`)
- **Serial Console** (Cổng USB-to-Serial/UART qua `/dev/cu.*` hoặc `COM*`)
- **Local Shell** (`/bin/zsh` hoặc `PowerShell`)

Mục tiêu mới là nâng cấp thành **4-in-1 Multi-Protocol Manager**, bổ sung khả năng quản lý và khởi chạy kết nối **Remote Desktop (RDP)** tới các máy chủ Windows/Desktop từ xa.

---

## II. KẾ HOẠCH TRIỂN KHAI KỸ THUẬT (IMPLEMENTATION PLAN)

### 1. Phân Tích Kiến Trúc: Tại sao chọn "RDP Launcher" thay vì nhúng trực tiếp?
RDP là giao thức nhị phân phức tạp của Microsoft. Các giải pháp cố gắng nhúng RDP viewer trực tiếp vào Electron gặp nhiều hạn chế chí mạng:
- `node-rdpjs`: Đã ngừng duy trì ~10 năm, không tương thích Node.js hiện đại.
- FreeRDP native C++ addon: Đòi hỏi biên dịch riêng cho từng OS/kiến trúc CPU, làm tăng kích thước bộ cài lên hàng trăm MB.
- Apache Guacamole Gateway: Cần một server Java/Tomcat trung gian riêng biệt, không phù hợp với kiến trúc ứng dụng Desktop độc lập.

**Quyết định kiến trúc:** Sử dụng mô hình **RDP Launcher đa nền tảng** — NexusSSH đóng vai trò trung tâm quản lý cấu hình (được mã hóa bảo mật) và khởi chạy native RDP client tốt nhất có sẵn trên hệ điều hành của người dùng.

### 2. Ma Trận Khởi Chạy RDP Client theo Hệ Điều Hành

| Hệ Điều Hành | RDP Client Mặc Định | Cơ Chế Khởi Chạy |
|--------------|---------------------|------------------|
| **macOS** | **Microsoft Remote Desktop** / **Windows App** | Tạo tệp cấu hình `.rdp` tạm → gọi lệnh `open -a "Microsoft Remote Desktop" file.rdp` (hoặc `open -a "Windows App" file.rdp`) |
| **Windows** | **Remote Desktop Connection (`mstsc.exe`)** | Tự động đăng ký Credential qua `cmdkey` → tạo `.rdp` → gọi lệnh `start mstsc file.rdp` |
| **Linux** | **`xfreerdp` / `remmina`** | Gọi CLI args trực tiếp: `xfreerdp /v:IP /u:user /p:pass ...` |

### 3. Giải Pháp Đột Phá cho vấn đề Mật Khẩu trên macOS (Auto-Copy Password)
- **Vấn đề kỹ thuật**: Vì lý do bảo mật, Apple và Microsoft cấm ứng dụng *Microsoft Remote Desktop trên macOS* đọc mật khẩu dưới dạng văn bản rõ (plaintext) từ tệp `.rdp` hay tham số dòng lệnh. Khi mở `.rdp`, ứng dụng luôn yêu cầu người dùng xác nhận mật khẩu hoặc dùng Keychain cũ.
- **Giải pháp**:
  1. Khi người dùng nhấn nút **"🖥 Kết Nối RDP"**, NexusSSH tự động giải mã mật khẩu RDP lưu trong cơ sở dữ liệu cục bộ.
  2. Ứng dụng lập tức nạp mật khẩu vào **Clipboard hệ thống của macOS** (`pbcopy` qua tiến trình con an toàn `spawnSync`).
  3. Hiển thị thông báo Toast Banner nổi bật:  
     `📋 Đã mở Remote Desktop & đã sao chép mật khẩu vào Clipboard (Nhấn Cmd + V để dán ngay)!`
  4. Người dùng chỉ cần nhấn tổ hợp phím **`Cmd + V`** khi cửa sổ Remote Desktop hiện lên để hoàn tất kết nối trong 1 giây.
  5. Tệp `.rdp` tạm thời được tự động tiêu hủy sau 5 giây để bảo vệ thông tin máy chủ.

---

## III. DANH SÁCH CÔNG VIỆC & TRẠNG THÁI TRIỂN KHAI (TASK CHECKLIST)

- [x] **Server: Tạo module `server/rdpManager.js`**
  - Hàm kiểm tra client khả dụng theo OS (`checkRdpClient`).
  - Hàm sinh nội dung tệp chuẩn Microsoft (`generateRdpFile`) hỗ trợ độ phân giải (`rdpResolution`), chế độ toàn màn hình (`rdpFullscreen`), cổng (`rdpPort`), username.
  - Tự động sao chép mật khẩu vào Clipboard trên macOS (`pbcopy`) và đăng ký Credential trên Windows (`cmdkey`).
  - Cơ chế tự động dọn dẹp file `.rdp` tạm sau 5s.
- [x] **Server: Cập nhật `server/server.js`**
  - Đăng ký sự kiện Socket.IO `rdp:connect` và `rdp:check-client`.
  - Phát lại trạng thái `rdp:launching`, `rdp:launched`, `rdp:error` về Frontend.
- [x] **Server: Cập nhật `server/dataStore.js`**
  - Hỗ trợ lưu trữ cấu hình kết nối giao thức `protocol: 'rdp'`.
  - Tự động mã hóa chuẩn **AES-256-GCM** đối với trường `rdpPassword`.
- [x] **Client: Cập nhật từ điển đa ngôn ngữ `client/src/i18n/translations.js`**
  - Thêm đầy đủ nhãn tiếng Việt và tiếng Anh cho tab RDP, nút kết nối và thông báo sao chép mật khẩu (`rdpLaunchedCopied`).
- [x] **Client: Cập nhật Form Cấu Hình `client/src/components/HostModal.jsx`**
  - Thêm tab chọn giao thức **Remote Desktop** (icon `Monitor`).
  - Bố trí lưới form gọn gàng cho IP/Host, Cổng, Username, Password, Độ phân giải màn hình và Checkbox Fullscreen.
- [x] **Client: Cập nhật Danh Sách Máy Chủ `client/src/components/HostList.jsx` & `App.jsx`**
  - Thêm nút lọc `RDP` trên thanh công cụ lọc giao thức.
  - Hiển thị nút kết nối riêng biệt **"🖥 Kết Nối RDP"** với dải màu xanh biển sang trọng.
  - Gắn Toast Notification Banner động hiển thị trạng thái và thông báo dán mật khẩu.
- [x] **Kiểm Tra & Đóng Gói (Build & Verification)**
  - Kiểm tra bundle production `npm run build --prefix client` thành công.
  - Kiểm tra đồng bộ với các tài liệu hướng dẫn (`docs/ARCHITECTURE.md`, `docs/USER_GUIDE.md`).
