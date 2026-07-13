const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const packageJson = require('../package.json');

const UPDATE_TEMP_DIR = path.join(os.tmpdir(), 'nexusssh-updates');

const CURRENT_VERSION = packageJson.version || '1.0.0';
const GITHUB_REPO = 'hongsonvu0622-stack/nessus-ssh';

function parseVersion(v) {
  return (v || '').replace(/^v/i, '').trim();
}

function compareVersions(v1, v2) {
  const parts1 = parseVersion(v1).split('.').map(Number);
  const parts2 = parseVersion(v2).split('.').map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

function checkLatestRelease() {
  return new Promise((resolve) => {
    try {
      const options = {
        hostname: 'api.github.com',
        path: `/repos/${GITHUB_REPO}/releases/latest`,
        headers: {
          'User-Agent': 'NexusSSH-Updater/1.0'
        },
        timeout: 4000
      };

      const req = https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const release = JSON.parse(data);
              const latestVersion = parseVersion(release.tag_name);
              const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION) > 0;
              resolve({
                status: hasUpdate ? 'update-available' : 'up-to-date',
                currentVersion: CURRENT_VERSION,
                latestVersion: latestVersion || CURRENT_VERSION,
                releaseNotes: release.body || 'Không có ghi chú phát hành.',
                releaseName: release.name || `NexusSSH v${latestVersion}`,
                publishedAt: release.published_at || null,
                downloadUrl: release.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`,
                assets: (release.assets || [])
                  .filter(a => !a.name.endsWith('.blockmap') && !a.name.endsWith('.yml') && !a.name.endsWith('.yaml'))
                  .map(a => ({
                    name: a.name,
                    downloadUrl: a.browser_download_url,
                    sizeBytes: a.size
                  }))
              });
            } catch (err) {
              resolve({
                status: 'error',
                currentVersion: CURRENT_VERSION,
                latestVersion: CURRENT_VERSION,
                message: 'Lỗi phân tích thông tin phiên bản từ GitHub.'
              });
            }
          } else {
            resolve({
              status: 'up-to-date',
              currentVersion: CURRENT_VERSION,
              latestVersion: CURRENT_VERSION,
              message: `Chưa có bản phát hành mới (Mã HTTP: ${res.statusCode})`
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'error',
          currentVersion: CURRENT_VERSION,
          latestVersion: CURRENT_VERSION,
          message: 'Kiểm tra cập nhật hết thời gian phản hồi (Timeout 4s).'
        });
      });

      req.on('error', (err) => {
        resolve({
          status: 'error',
          currentVersion: CURRENT_VERSION,
          latestVersion: CURRENT_VERSION,
          message: 'Không thể kết nối máy chủ kiểm tra cập nhật: ' + err.message
        });
      });
    } catch (err) {
      resolve({
        status: 'error',
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        message: 'Lỗi kiểm tra cập nhật: ' + err.message
      });
    }
  });
}

function cleanupOldPackages() {
  try {
    if (fs.existsSync(UPDATE_TEMP_DIR)) {
      const files = fs.readdirSync(UPDATE_TEMP_DIR);
      files.forEach(file => {
        try {
          fs.unlinkSync(path.join(UPDATE_TEMP_DIR, file));
        } catch (e) {}
      });
    } else {
      fs.mkdirSync(UPDATE_TEMP_DIR, { recursive: true });
    }
    return { success: true, message: 'Đã dọn dẹp các tệp cài đặt cũ.' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function downloadUpdateInBackground(downloadUrl, fileName, onProgress) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(UPDATE_TEMP_DIR)) {
      fs.mkdirSync(UPDATE_TEMP_DIR, { recursive: true });
    }

    const targetPath = path.join(UPDATE_TEMP_DIR, fileName || 'NexusSSH-update.dmg');

    const downloadFile = (url) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, { headers: { 'User-Agent': 'NexusSSH-Updater/1.0' } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFile(res.headers.location);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Tải xuống thất bại với HTTP ${res.statusCode}`));
        }

        const totalBytes = parseInt(res.headers['content-length'], 10) || 0;
        let downloadedBytes = 0;
        const fileStream = fs.createWriteStream(targetPath);

        res.on('data', chunk => {
          downloadedBytes += chunk.length;
          if (totalBytes > 0 && onProgress) {
            const percent = Math.round((downloadedBytes / totalBytes) * 100);
            onProgress({ percent, downloadedBytes, totalBytes });
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve({ success: true, filePath: targetPath });
        });

        fileStream.on('error', err => {
          fs.unlink(targetPath, () => {});
          reject(err);
        });
      }).on('error', reject);
    };

    downloadFile(downloadUrl);
  });
}

function installUpdateAndCleanup(fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(UPDATE_TEMP_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return reject(new Error('Tệp cập nhật không tồn tại hoặc đã bị xóa.'));
    }

    const platform = os.platform();
    let cmd = `open "${filePath}"`;
    if (platform === 'darwin') {
      if (fileName.endsWith('.zip')) {
        cmd = `ditto -x -k "${filePath}" /Applications && rm -f "${filePath}" && open /Applications/NexusSSH.app`;
      } else if (fileName.endsWith('.dmg')) {
        cmd = `MOUNT_OUT=$(hdiutil attach "${filePath}" -nobrowse) && VOL_PATH=$(echo "$MOUNT_OUT" | grep -o '/Volumes/.*' | head -n 1) && if [ -n "$VOL_PATH" ]; then APP_PATH=$(find "$VOL_PATH" -maxdepth 1 -name "*.app" | head -n 1); if [ -n "$APP_PATH" ]; then cp -R "$APP_PATH" /Applications/; fi; hdiutil detach "$VOL_PATH" -quiet; fi && rm -f "${filePath}" && open /Applications/NexusSSH.app`;
      }
    } else if (platform === 'win32') {
      if (fileName.endsWith('.msi')) {
        cmd = `start "" msiexec /i "${filePath}"`;
      } else {
        cmd = `start "" "${filePath}"`;
      }
    } else if (platform === 'linux') {
      cmd = `chmod +x "${filePath}" && "${filePath}" &`;
    }

    exec(cmd, (err) => {
      if (err) {
        return reject(err);
      }

      // Lên lịch tự động dọn dẹp tệp cài đặt (package) sau 90 giây để đảm bảo installer đã copy/chạy xong
      setTimeout(() => {
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Đã tự động xóa tệp cài đặt cập nhật:', filePath);
          }
        } catch (e) {
          // Windows: nếu installer vẫn giữ khóa tệp, cleanupOldPackages() sẽ tự xóa sạch vào lần mở app kế tiếp
        }
      }, 90000);

      resolve({ success: true, message: 'Đang khởi chạy bộ cài đặt và sẽ tự động dọn dẹp tệp package.' });
    });
  });
}

module.exports = {
  CURRENT_VERSION,
  checkLatestRelease,
  compareVersions,
  cleanupOldPackages,
  downloadUpdateInBackground,
  installUpdateAndCleanup
};
