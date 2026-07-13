const os = require('os');
const { spawn } = require('child_process');

class LocalPtyManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> { ptyProcess }
  }

  connect(sessionId, config, socket) {
    if (this.sessions.has(sessionId)) {
      socket.emit('terminal:status', { sessionId, status: 'connected', message: `macOS Shell Connected` });
      return;
    }

    const isWin = os.platform() === 'win32';
    const isMac = os.platform() === 'darwin';

    let shell;
    if (isWin) {
      if (config.shellType === 'cmd' || config.shell === 'cmd.exe') {
        shell = 'cmd.exe';
      } else {
        shell = 'powershell.exe';
      }
    } else {
      shell = config.shell || process.env.SHELL || (isMac ? '/bin/zsh' : '/bin/bash');
    }

    const cwd = os.homedir();

    socket.emit('terminal:status', {
      sessionId,
      status: 'connecting',
      message: `Starting local shell (${shell})...`
    });

    try {
      // Try node-pty first for full PTY control
      let pty;
      try {
        const nodePty = require('node-pty');
        pty = nodePty.spawn(shell, [], {
          name: 'xterm-256color',
          cols: config.cols || 80,
          rows: config.rows || 24,
          cwd,
          env: process.env
        });

        pty.onData((data) => {
          socket.emit('terminal:output', { sessionId, data });
        });

        pty.onExit(() => {
          socket.emit('terminal:status', { sessionId, status: 'closed', message: 'Local Shell Exited' });
          this.disconnect(sessionId);
        });

        this.sessions.set(sessionId, { ptyProcess: pty, type: 'node-pty' });
        socket.emit('terminal:status', { sessionId, status: 'connected', message: `Local Terminal (${shell})` });
        return;
      } catch (errPty) {
        // Fallback spawn per OS platform
        let proc;
        if (isWin) {
          proc = spawn(shell, shell === 'powershell.exe' ? ['-NoLogo'] : [], {
            cwd,
            env: process.env
          });
        } else if (isMac) {
          const pyScript = 'import pty, sys, os; os.environ["TERM"]="xterm-256color"; pty.spawn(sys.argv[1:])';
          proc = spawn('python3', ['-c', pyScript, shell, '-l'], {
            cwd,
            env: { ...process.env, TERM: 'xterm-256color' }
          });
        } else {
          proc = spawn(shell, ['-i', '-l'], {
            cwd,
            env: { ...process.env, TERM: 'xterm-256color' }
          });
        }

        proc.stdout.on('data', (data) => {
          socket.emit('terminal:output', { sessionId, data: data.toString('utf-8') });
        });

        proc.stderr.on('data', (data) => {
          socket.emit('terminal:output', { sessionId, data: data.toString('utf-8') });
        });

        proc.on('close', () => {
          socket.emit('terminal:status', { sessionId, status: 'closed', message: 'Local Shell Closed' });
          this.disconnect(sessionId);
        });

        this.sessions.set(sessionId, { ptyProcess: proc, type: 'spawn' });
        socket.emit('terminal:status', { sessionId, status: 'connected', message: `Local Terminal (${shell})` });
      }
    } catch (err) {
      socket.emit('terminal:status', { sessionId, status: 'error', message: err.message });
    }
  }

  write(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (session.type === 'node-pty') {
      session.ptyProcess.write(data);
    } else if (session.type === 'spawn' && session.ptyProcess.stdin) {
      session.ptyProcess.stdin.write(data);
    }
  }

  resize(sessionId, cols, rows) {
    const session = this.sessions.get(sessionId);
    if (session && session.type === 'node-pty' && session.ptyProcess.resize) {
      session.ptyProcess.resize(cols, rows);
    }
  }

  disconnect(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        if (session.type === 'node-pty') {
          session.ptyProcess.kill();
        } else if (session.type === 'spawn') {
          session.ptyProcess.kill();
        }
      } catch (e) {}
      this.sessions.delete(sessionId);
    }
  }
}

module.exports = new LocalPtyManager();
