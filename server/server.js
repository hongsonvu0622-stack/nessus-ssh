const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const dataStore = require('./dataStore');
const configImporter = require('./configImporter');
const sshManager = require('./sshManager');
const serialManager = require('./serialManager');
const localPtyManager = require('./localPtyManager');
const sftpManager = require('./sftpManager');
const updater = require('./updater');
const rdpManager = require('./rdpManager');
const SyncManager = require('./syncManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// REST APIs
app.get('/api/data', (req, res) => {
  res.json(dataStore.loadData());
});

app.post('/api/data', (req, res) => {
  const success = dataStore.saveData(req.body);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Could not save data' });
  }
});

app.get('/api/ssh/config-import', (req, res) => {
  const imported = configImporter.parseSshConfig();
  res.json(imported);
});

app.get('/api/ssh/local-keys', (req, res) => {
  const keys = configImporter.scanLocalSshKeys();
  res.json(keys);
});

app.post('/api/ssh/generate-key', async (req, res) => {
  try {
    const { name, type, comment } = req.body;
    const result = await configImporter.generateSshKey({ name, type, comment });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ssh/import-key', (req, res) => {
  try {
    const { name, privateContent, publicContent } = req.body;
    const result = configImporter.importSshKey({ name, privateContent, publicContent });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ssh/delete-key', (req, res) => {
  try {
    const { name } = req.body;
    const result = configImporter.deleteSshKey({ name });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/serial/ports', async (req, res) => {
  try {
    const ports = await serialManager.listPorts();
    res.json(ports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sftp/list', async (req, res) => {
  try {
    const { config, path: remotePath } = req.body;
    const files = await sftpManager.listDirectory(config, remotePath || '.');
    res.json({ files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sftp/read', async (req, res) => {
  try {
    const { config, file } = req.body;
    const content = await sftpManager.readFileContent(config, file);
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sftp/write', async (req, res) => {
  try {
    const { config, file, content } = req.body;
    await sftpManager.writeFileContent(config, file, content);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/updater/check', async (req, res) => {
  try {
    const result = await updater.checkLatestRelease();
    res.json(result);
  } catch (err) {
    res.json({
      status: 'error',
      currentVersion: updater.CURRENT_VERSION,
      latestVersion: updater.CURRENT_VERSION,
      message: err.message
    });
  }
});

// Socket.IO realtime connection for terminal sessions
io.on('connection', (socket) => {
  console.log('Client connected to socket:', socket.id);

  socket.on('updater:check', async () => {
    try {
      socket.emit('updater:status', { status: 'checking', currentVersion: updater.CURRENT_VERSION });
      const result = await updater.checkLatestRelease();
      socket.emit('updater:status', result);
    } catch (err) {
      socket.emit('updater:status', {
        status: 'error',
        currentVersion: updater.CURRENT_VERSION,
        latestVersion: updater.CURRENT_VERSION,
        message: 'Lỗi kiểm tra cập nhật: ' + err.message
      });
    }
  });

  socket.on('updater:download', async ({ downloadUrl, fileName }) => {
    try {
      socket.emit('updater:progress', { percent: 0, downloadedBytes: 0, totalBytes: 0 });
      const result = await updater.downloadUpdateInBackground(downloadUrl, fileName, (progress) => {
        socket.emit('updater:progress', progress);
      });
      socket.emit('updater:ready', { fileName, filePath: result.filePath });
    } catch (err) {
      socket.emit('updater:error', { message: 'Lỗi tải bản cập nhật ngầm: ' + err.message });
    }
  });

  socket.on('updater:install', async ({ fileName }) => {
    try {
      socket.emit('updater:install-progress', { message: 'Đang giải nén & cài đặt bản cập nhật...' });
      await updater.installUpdateAndCleanup(fileName);
      socket.emit('updater:install-success', { message: '✔ Cập nhật thành công! Ứng dụng đang khởi chạy lại...' });

      // Tự động tắt ứng dụng hiện tại sau 3 giây để bản cập nhật/bộ cài mới tiếp quản
      setTimeout(() => {
        try {
          const { app } = require('electron');
          if (app) {
            app.quit();
          } else {
            process.exit(0);
          }
        } catch (e) {
          process.exit(0);
        }
      }, 3000);
    } catch (err) {
      socket.emit('updater:error', { message: 'Lỗi chạy bộ cài đặt: ' + err.message });
    }
  });

  socket.activeSessions = new Map();

  socket.on('terminal:connect', ({ sessionId, config }) => {
    console.log(`Connecting session ${sessionId} [protocol: ${config.protocol || 'ssh'}]`);
    socket.activeSessions.set(sessionId, config.protocol || 'ssh');
    if (config.protocol === 'serial') {
      serialManager.connect(sessionId, config, socket);
    } else if (config.protocol === 'local') {
      localPtyManager.connect(sessionId, config, socket);
    } else {
      sshManager.connect(sessionId, config, socket);
    }
  });

  socket.on('terminal:auth-submit', (payload) => {
    const sessionId = typeof payload === 'object' ? payload.sessionId : payload;
    sshManager.authSubmit(sessionId, payload, socket);
  });

  socket.on('terminal:input', ({ sessionId, data, protocol }) => {
    if (protocol === 'serial') {
      serialManager.write(sessionId, data);
    } else if (protocol === 'local') {
      localPtyManager.write(sessionId, data);
    } else {
      sshManager.write(sessionId, data);
    }
  });

  socket.on('terminal:resize', ({ sessionId, cols, rows, protocol }) => {
    if (protocol === 'local') {
      localPtyManager.resize(sessionId, cols, rows);
    } else if (protocol !== 'serial') {
      sshManager.resize(sessionId, cols, rows);
    }
  });

  socket.on('terminal:disconnect', ({ sessionId, protocol }) => {
    socket.activeSessions.delete(sessionId);
    if (protocol === 'serial') {
      serialManager.disconnect(sessionId);
    } else if (protocol === 'local') {
      localPtyManager.disconnect(sessionId);
    } else {
      sshManager.disconnect(sessionId);
    }
  });

  // RDP
  socket.on('rdp:check-client', () => {
    const info = rdpManager.checkRdpClient();
    socket.emit('rdp:client-status', info);
  });

  socket.on('rdp:connect', async (config) => {
    try {
      socket.emit('rdp:launching', { host: config.host });
      const result = await rdpManager.launch(config);
      socket.emit('rdp:launched', result);
    } catch (err) {
      socket.emit('rdp:error', { message: err.message });
    }
  });

  // Cloud Sync
  const syncManager = new SyncManager(socket);
  syncManager.checkAutoLogin();
  
  socket.on('sync:login', async (payload) => {
    await syncManager.loginAndSync(payload);
  });
  
  socket.on('sync:register', async (payload) => {
    await syncManager.register(payload);
  });

  socket.on('sync:logout', async () => {
    await syncManager.logout();
  });

  socket.on('sync:check_auth', () => {
    if (syncManager.token && syncManager.email) {
      socket.emit('sync:auth_success', { email: syncManager.email });
    }
  });

  socket.on('sync:force', async (options = {}) => {
    if (syncManager.token) {
      await syncManager.performSync(options);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const [sessionId, protocol] of socket.activeSessions.entries()) {
      try {
        if (protocol === 'serial') {
          serialManager.disconnect(sessionId);
        } else if (protocol === 'local') {
          localPtyManager.disconnect(sessionId);
        } else {
          sshManager.disconnect(sessionId);
        }
      } catch (e) {}
    }
    socket.activeSessions.clear();
  });
});

const PORT = process.env.PORT || 4000;

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is already in use. Assuming backend is already running.`);
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, () => {
  updater.cleanupOldPackages();
  console.log(`NexusSSH API & Socket Server running on http://localhost:${PORT}`);
});
