const fs = require('fs');
const path = require('path');
const os = require('os');
const cryptoUtil = require('./cryptoUtil');

const DATA_DIR = path.join(os.homedir(), '.nexusssh');
const DATA_FILE = path.join(DATA_DIR, 'connections.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_DATA = {
  connections: [],
  groups: [
    { id: 'Local', name: 'Local', color: '#10B981' },
    { id: 'Production', name: 'Production', color: '#F43F5E' },
    { id: 'Network Devices', name: 'Network Devices', color: '#3B82F6' },
    { id: 'Staging', name: 'Staging', color: '#F59E0B' },
    { id: 'Embedded & IoT', name: 'Embedded & IoT', color: '#8B5CF6' }
  ],
  snippets: [
    {
      id: 'snip-1',
      title: 'Kiểm tra tải hệ thống (htop)',
      command: 'htop || top',
      category: 'System monitoring',
      protocol: 'ssh'
    },
    {
      id: 'snip-2',
      title: 'Danh sách Docker Containers',
      command: 'docker ps -a --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"',
      category: 'DevOps',
      protocol: 'ssh'
    },
    {
      id: 'snip-3',
      title: 'Dung lượng ổ cứng (df -h)',
      command: 'df -h',
      category: 'System monitoring',
      protocol: 'ssh'
    },
    {
      id: 'snip-4',
      title: 'Cisco: Show Interface Status',
      command: 'show ip interface brief',
      category: 'Network',
      protocol: 'serial'
    },
    {
      id: 'snip-5',
      title: 'Cisco: Show Running Config',
      command: 'show running-config',
      category: 'Network',
      protocol: 'serial'
    }
  ],
  identities: [],
  deletedResourceIds: [],
  settings: {
    theme: 'nexus-cyber-dark',
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    cursorStyle: 'block',
    scrollback: 5000
  }
};

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      saveData(DEFAULT_DATA);
      return DEFAULT_DATA;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.connections)) {
      parsed.connections = parsed.connections.map(c => ({
        ...c,
        password: c.password ? cryptoUtil.decryptPassword(c.password) : '',
        passphrase: c.passphrase ? cryptoUtil.decryptPassword(c.passphrase) : '',
        rdpPassword: c.rdpPassword ? cryptoUtil.decryptPassword(c.rdpPassword) : ''
      }));
    }
    return parsed;
  } catch (err) {
    console.error('Error loading data store, resetting to default:', err);
    return DEFAULT_DATA;
  }
}

function saveData(data) {
  try {
    const toSave = { ...data };
    if (Array.isArray(toSave.connections)) {
      toSave.connections = toSave.connections.map(c => ({
        ...c,
        password: c.password ? cryptoUtil.encryptPassword(c.password) : '',
        passphrase: c.passphrase ? cryptoUtil.encryptPassword(c.passphrase) : '',
        rdpPassword: c.rdpPassword ? cryptoUtil.encryptPassword(c.rdpPassword) : ''
      }));
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(toSave, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving data store:', err);
    return false;
  }
}

module.exports = {
  loadData,
  saveData,
  DATA_FILE
};
