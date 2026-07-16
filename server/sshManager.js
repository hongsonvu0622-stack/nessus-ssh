const { Client } = require('ssh2');
const fs = require('fs');
const cryptoUtil = require('./cryptoUtil');

class SshManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> { client, stream, config }
    this.pendingAuth = new Map(); // sessionId -> finish callback for keyboard-interactive
    this.pendingConfigs = new Map(); // sessionId -> config
  }

  connect(sessionId, config, socket) {
    if (this.sessions.has(sessionId)) {
      socket.emit('terminal:status', { sessionId, status: 'connected', message: 'SSH Connection Established' });
      return;
    }

    const realPassword = cryptoUtil.decryptPassword(config.password || '');
    const realPassphrase = cryptoUtil.decryptPassword(config.passphrase || '');
    const decryptedConfig = {
      ...config,
      password: realPassword,
      passphrase: realPassphrase
    };

    this.pendingConfigs.set(sessionId, decryptedConfig);

    const authType = decryptedConfig.authType || 'password';
    // If password or key auth is selected but required credentials are missing yet, ask immediately
    if (
      (authType === 'password' && (!decryptedConfig.password || decryptedConfig.password.trim() === '')) ||
      (authType === 'key' && !decryptedConfig.keyPath)
    ) {
      socket.emit('terminal:auth-required', {
        sessionId,
        host: decryptedConfig.host,
        username: decryptedConfig.username || 'root',
        failedAuthType: authType,
        message: authType === 'key'
          ? `Vui lòng chọn Khóa SSH cho ${decryptedConfig.username || 'root'}@${decryptedConfig.host}:`
          : `Vui lòng nhập mật khẩu SSH cho ${decryptedConfig.username || 'root'}@${decryptedConfig.host}:`
      });
      return;
    }

    const conn = new Client();

    conn.on('ready', () => {
      this.pendingAuth.delete(sessionId);
      socket.emit('terminal:status', { sessionId, status: 'connected', message: 'SSH Connection Established' });

      conn.shell({ term: 'xterm-256color', cols: decryptedConfig.cols || 80, rows: decryptedConfig.rows || 24 }, (err, stream) => {
        if (err) {
          socket.emit('terminal:status', { sessionId, status: 'error', message: err.message });
          conn.end();
          return;
        }

        this.sessions.set(sessionId, { client: conn, stream, config: decryptedConfig });

        stream.on('data', (data) => {
          socket.emit('terminal:output', { sessionId, data: data.toString('utf-8') });
        }).on('close', () => {
          socket.emit('terminal:status', { sessionId, status: 'closed', message: 'SSH Session Closed by Remote' });
          this.disconnect(sessionId);
        });
      });
    });

    conn.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
      if (decryptedConfig.password && decryptedConfig.password.trim() !== '') {
        finish([decryptedConfig.password]);
      } else {
        this.pendingAuth.set(sessionId, finish);
        socket.emit('terminal:auth-required', {
          sessionId,
          host: decryptedConfig.host,
          username: decryptedConfig.username || 'root',
          message: prompts[0]?.prompt || `Vui lòng nhập mật khẩu cho ${decryptedConfig.username || 'root'}@${decryptedConfig.host}:`
        });
      }
    });

    const handleAuthFailure = (errMsg) => {
      const isKeyAuth = decryptedConfig.authType === 'key' && decryptedConfig.keyPath;
      const isKeyErr = errMsg.includes('Cannot parse privateKey') || errMsg.includes('Encrypted private OpenSSH key detected') || errMsg.includes('passphrase') || errMsg.includes('mã hóa');
      socket.emit('terminal:auth-required', {
        sessionId,
        host: decryptedConfig.host,
        username: decryptedConfig.username || 'root',
        failedAuthType: (isKeyAuth || isKeyErr) ? 'key' : 'password',
        message: (isKeyAuth || isKeyErr)
          ? `Khóa SSH (${decryptedConfig.keyPath || 'Private Key'}) yêu cầu Passphrase mở khóa hoặc bị từ chối. Vui lòng nhập Passphrase, chọn Khóa khác hoặc chuyển sang Mật khẩu:`
          : `Xác thực thất bại (${decryptedConfig.username || 'root'}@${decryptedConfig.host}). Vui lòng nhập mật khẩu hoặc chuyển sang Khóa SSH:`
      });
    };

    conn.on('error', (err) => {
      const msg = err.message || '';
      if (
        msg.includes('All configured authentication methods failed') ||
        msg.includes('Cannot parse privateKey') ||
        msg.includes('Encrypted private OpenSSH key detected') ||
        msg.includes('bad passphrase') ||
        msg.includes('Permission denied')
      ) {
        handleAuthFailure(msg);
      } else {
        socket.emit('terminal:status', { sessionId, status: 'error', message: 'SSH Error: ' + msg });
      }
      this.disconnect(sessionId);
    });

    const connectConfig = {
      host: decryptedConfig.host,
      port: decryptedConfig.port || 22,
      username: decryptedConfig.username || 'root',
      readyTimeout: 15000,
      tryKeyboard: true
    };

    if (decryptedConfig.authType === 'key' && decryptedConfig.keyPath) {
      try {
        const keyContent = fs.readFileSync(decryptedConfig.keyPath, 'utf8');
        connectConfig.privateKey = keyContent;
        if (decryptedConfig.passphrase && decryptedConfig.passphrase.trim() !== '') {
          connectConfig.passphrase = decryptedConfig.passphrase;
        } else if (keyContent.includes('ENCRYPTED')) {
          handleAuthFailure('Khóa SSH được mã hóa (Passphrase Protected). Vui lòng nhập Passphrase mở khóa:');
          return;
        }
      } catch (err) {
        socket.emit('terminal:status', { sessionId, status: 'error', message: `Cannot read SSH key: ${err.message}` });
        return;
      }
    } else {
      connectConfig.password = decryptedConfig.password || '';
    }

    try {
      socket.emit('terminal:status', { sessionId, status: 'connecting', message: `Connecting to ${decryptedConfig.host}:${decryptedConfig.port || 22}...` });
      conn.connect(connectConfig);
    } catch (err) {
      const msg = err.message || '';
      if (
        msg.includes('Cannot parse privateKey') ||
        msg.includes('Encrypted private OpenSSH key detected') ||
        msg.includes('passphrase')
      ) {
        handleAuthFailure(msg);
      } else {
        socket.emit('terminal:status', { sessionId, status: 'error', message: msg });
      }
    }
  }

  authSubmit(sessionId, payload, socket) {
    const config = this.pendingConfigs.get(sessionId) || {};
    let updatedConfig;
    if (typeof payload === 'string') {
      updatedConfig = { ...config, password: payload, authType: 'password', keyPath: '' };
    } else if (payload && payload.authType === 'key') {
      updatedConfig = {
        ...config,
        authType: 'key',
        keyPath: payload.keyPath || '',
        passphrase: payload.passphrase || ''
      };
    } else {
      updatedConfig = {
        ...config,
        authType: 'password',
        password: (payload && payload.password) || '',
        keyPath: ''
      };
    }
    this.pendingConfigs.set(sessionId, updatedConfig);

    const finish = this.pendingAuth.get(sessionId);
    const isKeyChoice = updatedConfig.authType === 'key';

    if (finish && !isKeyChoice) {
      this.pendingAuth.delete(sessionId);
      finish([updatedConfig.password || '']);
      return;
    }

    // If there is any active or pending keyboard-interactive connection, disconnect before retrying with new auth choice / SSH Key
    if (finish || this.sessions.has(sessionId)) {
      this.disconnect(sessionId);
    }

    this.connect(sessionId, updatedConfig, socket);
  }

  write(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (session && session.stream) {
      session.stream.write(data);
    }
  }

  resize(sessionId, cols, rows) {
    const session = this.sessions.get(sessionId);
    if (session && session.stream && session.stream.setWindow) {
      try {
        session.stream.setWindow(rows, cols, 0, 0);
      } catch (e) {}
    }
    const pending = this.pendingConfigs.get(sessionId);
    if (pending) {
      pending.cols = cols;
      pending.rows = rows;
    }
  }

  disconnect(sessionId) {
    this.pendingAuth.delete(sessionId);
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        if (session.stream) session.stream.end();
        if (session.client) session.client.end();
      } catch (e) {}
      this.sessions.delete(sessionId);
    }
  }
}

module.exports = new SshManager();
