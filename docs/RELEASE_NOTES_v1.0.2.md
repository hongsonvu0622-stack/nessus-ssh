# NexusSSH Pro v1.0.2 — Cyber Glass Edition Release Notes

🚀 **Version:** 1.0.2  
📅 **Release Date:** July 13, 2026  
✨ **Theme:** Full i18n Localization, Multi-Platform Background Updates & SSH Key Management

---

## 🌟 What's New in v1.0.2

### 1. 🗑️ SSH Key Management: Delete Key Feature
- **Permanent & Safe Deletion:** Added ability to safely delete SSH private and public keys (`~/.ssh/`) directly from the **Identity Manager (Quản Lý Khóa SSH)** interface.
- **Confirmation Protection:** Interactive confirmation dialog showing the exact file path and warning before removing key files.
- **Robust Error Handling:** Improved API client fallback for graceful error reporting in Vietnamese/English.

### 2. ⚡ Background Software Updates & Auto-Cleanup (Multi-OS)
- **Silent Background Download:** Users can now click **"⚡ Background Download & Install"** to download updates seamlessly in the background while keeping active SSH/Serial sessions alive.
- **Live Progress Bar:** Real-time download percentage bar integrated directly inside the software update window.
- **OS-Aware Asset Selector:** Automatically detects **Windows (`.exe` / `.msi`)**, **macOS (`.dmg` / `.pkg`)**, and **Linux (`.AppImage` / `.deb`)** to download and execute the exact installer format for your operating system.
- **Automatic Package Cleanup:** Downloaded installer packages are automatically cleaned up from temporary disk space (`os.tmpdir()/nexusssh-updates`) after installation and on application startup.

### 3. 🌐 100% Internationalization (i18n) Transition
- **Systematic UI Localization:** Eliminated all remaining hardcoded Vietnamese text across the entire application:
  - **Serial Port Scanning & Rescan buttons** (`HostList.jsx`, `HostModal.jsx`, `SerialScannerModal.jsx`)
  - **SSH Identity Manager & Update Modal**
- **Dynamic Language Switcher:** Perfect instant switching between **English** and **Tiếng Việt** across all modals, banners, and tooltips.

---

## 🔧 Technical & Bug Fixes
- Fixed `Unexpected token '<', "<!DOCTYPE"...` JSON parse error when calling backend endpoints before server restart.
- Updated `package.json` and `client/package.json` to version `1.0.2`.
- Optimized Vite bundle build for production (`1.0.2`).
