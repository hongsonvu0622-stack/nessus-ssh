#!/usr/bin/env bash
# ==============================================================================
# NexusSSH Pro - Full Project Setup & Installation Script (macOS / Linux)
# ==============================================================================

# Chuyển về thư mục gốc của dự án
cd "$(dirname "$0")/.." || exit 1

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RESET='\033[0m'

echo -e "${CYAN}=================================================================${RESET}"
echo -e "${CYAN}        NexusSSH Pro — Full Environment Setup (macOS/Linux)     ${RESET}"
echo -e "${CYAN}=================================================================${RESET}"
echo ""

echo -e "${YELLOW}➤ [1/3] Kiểm tra Node.js & npm...${RESET}"
if ! command -v node &> /dev/null; then
    echo "Lỗi: Node.js chưa được cài đặt. Vui lòng cài đặt Node.js (>= 18) trước."
    exit 1
fi
echo -e "${GREEN}✔ Node.js version: $(node -v)${RESET}"
echo -e "${GREEN}✔ npm version: $(npm -v)${RESET}"
echo ""

echo -e "${YELLOW}➤ [2/3] Đang cài đặt thư viện Backend (Root packages & Native SerialPort)...${RESET}"
npm install
if [ $? -ne 0 ]; then
    echo "Lỗi khi cài đặt thư viện gốc!"
    exit 1
fi
echo -e "${GREEN}✔ Cài đặt thư viện gốc thành công!${RESET}"
echo ""

echo -e "${YELLOW}➤ [3/3] Đang cài đặt thư viện Frontend React/Vite (client)...${RESET}"
npm install --prefix client
if [ $? -ne 0 ]; then
    echo "Lỗi khi cài đặt thư viện client!"
    exit 1
fi
echo -e "${GREEN}✔ Cài đặt thư viện client thành công!${RESET}"
echo ""

echo -e "${CYAN}=================================================================${RESET}"
echo -e "${GREEN}🎉 CÀI ĐẶT HOÀN TẤT TRỌN BỘ! Bạn có thể chạy các lệnh sau:${RESET}"
echo -e "  - Chạy thử app (Dev Mode):      ${CYAN}npm run electron${RESET}"
echo -e "  - Build bộ cài macOS (.dmg):    ${CYAN}npm run dist:mac${RESET}"
echo -e "  - Build nhanh bằng script menu: ${CYAN}./build-local.sh${RESET}"
echo -e "${CYAN}=================================================================${RESET}"
