const { exec, execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const cryptoUtil = require('./cryptoUtil');

const TEMP_DIR = path.join(os.tmpdir(), 'nexusssh-rdp');

/**
 * Check if an RDP client is available on the system
 */
function checkRdpClient() {
  const platform = os.platform();
  const result = { available: false, client: null, installHint: '' };

  try {
    if (platform === 'win32') {
      // mstsc is always available on Windows
      result.available = true;
      result.client = 'mstsc';
    } else if (platform === 'darwin') {
      // Check for Microsoft Remote Desktop / Windows App
      const msrdPath = '/Applications/Microsoft Remote Desktop.app';
      const winAppPath = '/Applications/Windows App.app';

      if (fs.existsSync(msrdPath)) {
        result.available = true;
        result.client = 'msrd';
      } else if (fs.existsSync(winAppPath)) {
        result.available = true;
        result.client = 'winapp';
      } else {
        // Fallback available to use macOS default handler for .rdp files
        result.available = true;
        result.client = 'mac-default';
        result.installHint = 'Nếu chưa mở được, vui lòng tải "Microsoft Remote Desktop" (hoặc Windows App) từ Mac App Store.';
      }
    } else {
      // Linux
      const hasXfreerdp = commandExists('xfreerdp') || commandExists('xfreerdp3');
      const hasRemmina = commandExists('remmina');

      if (hasXfreerdp) {
        result.available = true;
        result.client = commandExists('xfreerdp3') ? 'xfreerdp3' : 'xfreerdp';
      } else if (hasRemmina) {
        result.available = true;
        result.client = 'remmina';
      } else {
        result.installHint = 'Install xfreerdp: sudo apt install freerdp2-x11 (Debian/Ubuntu) or sudo dnf install freerdp (Fedora)';
      }
    }
  } catch (err) {
    result.installHint = 'Error detecting RDP client: ' + err.message;
  }

  return result;
}

/**
 * Check if a command exists on the system PATH
 */
function commandExists(cmd) {
  try {
    const check = os.platform() === 'win32' ? `where ${cmd}` : `which ${cmd}`;
    execSync(check, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a .rdp file content
 */
function generateRdpFile(config) {
  const host = config.host || '127.0.0.1';
  const port = config.rdpPort || 3389;
  const username = config.rdpUsername || '';
  const fullscreen = config.rdpFullscreen !== false;
  const resolution = config.rdpResolution || '1920x1080';
  const [w, h] = resolution.split('x').map(Number);

  let content = `full address:s:${host}:${port}\r\n`;
  if (username) {
    content += `username:s:${username}\r\n`;
  }
  content += `screen mode id:i:${fullscreen ? 2 : 1}\r\n`;
  content += `desktopwidth:i:${w || 1920}\r\n`;
  content += `desktopheight:i:${h || 1080}\r\n`;
  content += `session bpp:i:32\r\n`;
  content += `compression:i:1\r\n`;
  content += `keyboardhook:i:2\r\n`;
  content += `audiocapturemode:i:0\r\n`;
  content += `videoplaybackmode:i:1\r\n`;
  content += `connection type:i:7\r\n`;
  content += `networkautodetect:i:1\r\n`;
  content += `bandwidthautodetect:i:1\r\n`;
  content += `displayconnectionbar:i:1\r\n`;
  content += `enableworkspacereconnect:i:0\r\n`;
  content += `disable wallpaper:i:0\r\n`;
  content += `allow font smoothing:i:1\r\n`;
  content += `allow desktop composition:i:1\r\n`;
  content += `redirectclipboard:i:1\r\n`;
  content += `redirectprinters:i:0\r\n`;
  content += `autoreconnection enabled:i:1\r\n`;
  content += `authentication level:i:2\r\n`;
  content += `prompt for credentials:i:0\r\n`;
  content += `negotiate security layer:i:1\r\n`;

  return content;
}

/**
 * Launch RDP connection using the system's RDP client
 */
function launch(config) {
  return new Promise((resolve, reject) => {
    const clientInfo = checkRdpClient();

    if (!clientInfo.available) {
      return reject(new Error(clientInfo.installHint || 'No RDP client found on this system.'));
    }

    const platform = os.platform();
    const host = config.host || '127.0.0.1';
    const port = config.rdpPort || 3389;
    const username = config.rdpUsername || '';
    const password = cryptoUtil.decryptPassword(config.rdpPassword || '');

    // Ensure temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    let cmd = '';

    if (platform === 'win32') {
      // Windows: optionally register credential via cmdkey then open with mstsc
      if (username && password) {
        try {
          execSync(`cmdkey /generic:TERMSRV/${host} /user:"${username}" /pass:"${password}"`, { stdio: 'ignore' });
        } catch {}
      }

      const rdpContent = generateRdpFile(config);
      const rdpFile = path.join(TEMP_DIR, `nexus-${Date.now()}.rdp`);
      fs.writeFileSync(rdpFile, rdpContent, 'utf8');

      cmd = `start "" mstsc "${rdpFile}"`;

      // Clean up .rdp file after 5 seconds
      setTimeout(() => {
        try { fs.unlinkSync(rdpFile); } catch {}
      }, 5000);

    } else if (platform === 'darwin') {
      // macOS: Microsoft Remote Desktop / Windows App ignores plaintext password in .rdp file for security.
      // Auto-copy password to clipboard so user can press Cmd+V to paste instantly!
      if (password) {
        try {
          spawnSync('pbcopy', [], { input: password });
        } catch {}
      }

      const rdpContent = generateRdpFile(config);
      const rdpFile = path.join(TEMP_DIR, `nexus-${Date.now()}.rdp`);
      fs.writeFileSync(rdpFile, rdpContent, 'utf8');

      const msrdPath = '/Applications/Microsoft Remote Desktop.app';
      const winAppPath = '/Applications/Windows App.app';

      if (fs.existsSync(msrdPath)) {
        cmd = `open -a "Microsoft Remote Desktop" "${rdpFile}"`;
      } else if (fs.existsSync(winAppPath)) {
        cmd = `open -a "Windows App" "${rdpFile}"`;
      } else {
        cmd = `open "${rdpFile}"`;
      }

      setTimeout(() => {
        try { fs.unlinkSync(rdpFile); } catch {}
      }, 5000);
    } else {
      // Linux: xfreerdp or remmina
      if (clientInfo.client === 'remmina') {
        cmd = `remmina -c rdp://${username ? username + '@' : ''}${host}:${port}`;
      } else {
        cmd = buildXfreerdpCmd(host, port, username, password, config);
      }
    }

    if (!cmd) {
      return reject(new Error('Could not build RDP launch command.'));
    }

    exec(cmd, { timeout: 10000 }, (err) => {
      if (err && err.killed) {
        // Timeout is expected — RDP client stays open
        return resolve({ success: true, client: clientInfo.client, copiedPassword: platform === 'darwin' && !!password });
      }
      if (err && !err.message.includes('SIGTERM')) {
        return reject(err);
      }
      resolve({ success: true, client: clientInfo.client, copiedPassword: platform === 'darwin' && !!password });
    });
  });
}

/**
 * Build xfreerdp command string
 */
function buildXfreerdpCmd(host, port, username, password, config) {
  const fullscreen = config.rdpFullscreen !== false;
  const resolution = config.rdpResolution || '1920x1080';
  const [w, h] = resolution.split('x').map(Number);

  const bin = commandExists('xfreerdp3') ? 'xfreerdp3' : 'xfreerdp';
  let cmd = `${bin} /v:${host}:${port}`;
  if (username) cmd += ` /u:"${username}"`;
  if (password) cmd += ` /p:"${password}"`;
  if (fullscreen) {
    cmd += ' /f';
  } else {
    cmd += ` /w:${w || 1920} /h:${h || 1080}`;
  }
  cmd += ' /cert:ignore /clipboard /sound /dynamic-resolution';
  cmd += ' &'; // Run in background

  return cmd;
}

module.exports = {
  checkRdpClient,
  launch
};
