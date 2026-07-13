# NexusSSH Pro v1.0.1 — Cyber Glass Edition (Release Notes)

**Ngày phát hành:** 13/07/2026  
**Mã Phiên Bản:** `v1.0.1`

---

## 🌟 Điểm Nổi Bật & Tính Năng Mới (New Features)

### 1. Hệ Thống Kiểm Tra & Tự Động Thông Báo Cập Nhật (Software Updater)
- **Kiểm tra phiên bản mới từ GitHub Releases:** Tự động kết nối tới GitHub API (`hongsonvu0622-stack/nessus-ssh`) để đối chiếu phiên bản hiện tại và phiên bản mới nhất.
- **Không chặn luồng (100% Non-Blocking & Fault Tolerant):**
  - Đợi 5 giây sau khi ứng dụng và kết nối khởi động hoàn tất mới chạy ngầm kiểm tra cập nhật.
  - Tự động hủy yêu cầu khi quá hạn 4s (Timeout 4s) hoặc mất mạng, bảo đảm không bao giờ ảnh hưởng đến kết nối SSH/Terminal.
- **Nút "Kiểm tra cập nhật" trực tiếp:** Tích hợp nút `🔄 Kiểm tra cập nhật` trực quan ngay góc dưới thanh Sidebar bên trái.
- **Hộp thoại Cập nhật & Thông báo Cyber Glass:**
  - Hiển thị huy hiệu `NEW` trên biểu tượng Settings khi có phiên bản mới.
  - Banner thông báo nổi ở góc phải màn hình cùng Hộp thoại chi tiết Ghi chú thay đổi (Changelog) và liên kết tải về trực tiếp.

### 2. Tích Hợp Passphrase Cho Khóa SSH (SSH Key Passphrase Handling)
- **Hỗ trợ khóa SSH mã hóa (Encrypted Private Keys):** Thêm ô nhập **Passphrase mở khóa Private Key (Nếu có)** ngay trong Hộp thoại Thêm/Sửa kết nối (`HostModal.jsx`).
- **Tự động hỏi Passphrase khi kết nối:** Nếu tệp Private Key bị mã hóa nhưng chưa có Passphrase, ứng dụng tự động hiển thị hộp thoại xác thực bảo mật ngay trên tab Terminal để nhập Passphrase mở khóa tức thì.

### 3. Tối Ưu Tải Trọng & Gói Tệp (Bundle Optimization)
- **Tối ưu Manual Chunks:** Phân chia gói bundle Vite thành các chunk riêng (`vendor`, `terminal`, `utils`), giảm thiểu dung lượng và loại bỏ cảnh báo tải trọng lớn của Vite.

---

## 🛠 Cải Tiến Giao Diện & Trải Nghiệm (UI/UX Refinements)
- **Thiết kế riêng biệt phong cách Cyber Neon Glass:** Chuẩn hóa toàn bộ màu sắc, typography và hiệu ứng kính mờ Neon Glass cao cấp cho NexusSSH Pro.
- **Trang Cài đặt & Quản lý Cập nhật (`Settings` View):** Bổ sung bảng điều khiển kiểm tra phiên bản và tùy chọn bật/tắt tự động kiểm tra cập nhật khi khởi động.
