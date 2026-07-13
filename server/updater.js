const https = require('https');
const packageJson = require('../package.json');

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
                assets: (release.assets || []).map(a => ({
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

module.exports = {
  CURRENT_VERSION,
  checkLatestRelease,
  compareVersions
};
