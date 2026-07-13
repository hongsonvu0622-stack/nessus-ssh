const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec, execFile } = require('child_process');

function parseSshConfig() {
  const configPath = path.join(os.homedir(), '.ssh', 'config');
  if (!fs.existsSync(configPath)) {
    return [];
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const lines = content.split('\n');
    const hosts = [];
    let currentHost = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const parts = trimmed.split(/\s+/);
      const key = parts[0].toLowerCase();
      const value = parts.slice(1).join(' ');

      if (key === 'host') {
        if (value !== '*') {
          currentHost = {
            id: 'import-' + Math.random().toString(36).substring(2, 9),
            name: value,
            protocol: 'ssh',
            host: value,
            port: 22,
            username: os.userInfo().username,
            authType: 'key',
            keyPath: path.join(os.homedir(), '.ssh', 'id_rsa'),
            group: 'Imported (~/.ssh/config)',
            tags: ['macOS', 'Imported'],
            status: 'offline',
            favorite: false
          };
          hosts.push(currentHost);
        } else {
          currentHost = null;
        }
      } else if (currentHost) {
        if (key === 'hostname') {
          currentHost.host = value;
        } else if (key === 'user') {
          currentHost.username = value;
        } else if (key === 'port') {
          currentHost.port = parseInt(value, 10) || 22;
        } else if (key === 'identityfile') {
          let identityPath = value;
          if (identityPath.startsWith('~')) {
            identityPath = path.join(os.homedir(), identityPath.slice(1));
          }
          currentHost.keyPath = identityPath;
        }
      }
    });

    return hosts;
  } catch (err) {
    console.error('Error parsing ~/.ssh/config:', err);
    return [];
  }
}

function scanLocalSshKeys() {
  const sshDir = path.join(os.homedir(), '.ssh');
  if (!fs.existsSync(sshDir)) return [];

  try {
    const files = fs.readdirSync(sshDir);
    const keys = [];
    files.forEach(file => {
      // Exclude public keys (.pub), known_hosts, config
      if (!file.endsWith('.pub') && file !== 'known_hosts' && file !== 'known_hosts.old' && file !== 'config' && !file.startsWith('.')) {
        const fullPath = path.join(sshDir, file);
        try {
          const stats = fs.statSync(fullPath);
          if (stats.isFile()) {
            let pubContent = '';
            const pubPath = fullPath + '.pub';
            if (fs.existsSync(pubPath)) {
              pubContent = fs.readFileSync(pubPath, 'utf-8').trim();
            }
            keys.push({
              name: file,
              path: fullPath,
              pubContent
            });
          }
        } catch (e) {}
      }
    });
    return keys;
  } catch (err) {
    console.error('Error scanning ~/.ssh keys:', err);
    return [];
  }
}

function generateSshKey({ name, type = 'ed25519', comment = 'nexusssh@macos' }) {
  return new Promise((resolve, reject) => {
    const sshDir = path.join(os.homedir(), '.ssh');
    if (!fs.existsSync(sshDir)) {
      fs.mkdirSync(sshDir, { recursive: true, mode: 0o700 });
    }

    const fileName = name || `id_${type}_nexus`;
    const fullPath = path.join(sshDir, fileName);

    if (fs.existsSync(fullPath)) {
      return reject(new Error(`Tệp khóa ${fullPath} đã tồn tại!`));
    }

    const args = type.toLowerCase() === 'rsa'
      ? ['-t', 'rsa', '-b', '4096', '-f', fullPath, '-N', '', '-C', comment]
      : ['-t', 'ed25519', '-f', fullPath, '-N', '', '-C', comment];

    execFile('ssh-keygen', args, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || err.message));
      }

      let pubContent = '';
      const pubPath = fullPath + '.pub';
      if (fs.existsSync(pubPath)) {
        pubContent = fs.readFileSync(pubPath, 'utf-8').trim();
      }

      // Ensure strict permissions on macOS
      try {
        fs.chmodSync(fullPath, 0o600);
      } catch (e) {}

      resolve({
        success: true,
        name: fileName,
        path: fullPath,
        pubContent
      });
    });
  });
}

function importSshKey({ name, privateContent, publicContent }) {
  const sshDir = path.join(os.homedir(), '.ssh');
  if (!fs.existsSync(sshDir)) {
    fs.mkdirSync(sshDir, { recursive: true, mode: 0o700 });
  }

  const fileName = name || 'id_imported_' + Date.now();
  const fullPath = path.join(sshDir, fileName);

  fs.writeFileSync(fullPath, privateContent, { mode: 0o600 });
  if (publicContent) {
    fs.writeFileSync(fullPath + '.pub', publicContent, { mode: 0o644 });
  }

  return {
    success: true,
    name: fileName,
    path: fullPath
  };
}

function deleteSshKey({ name }) {
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
    throw new Error('Tên tệp khóa không hợp lệ.');
  }

  const sshDir = path.join(os.homedir(), '.ssh');
  const fullPath = path.join(sshDir, name);
  const pubPath = fullPath + '.pub';

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
  if (fs.existsSync(pubPath)) {
    fs.unlinkSync(pubPath);
  }

  return { success: true, deleted: name };
}

module.exports = {
  parseSshConfig,
  scanLocalSshKeys,
  generateSshKey,
  importSshKey,
  deleteSshKey
};
