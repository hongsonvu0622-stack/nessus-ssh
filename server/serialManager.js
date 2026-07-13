const fs = require('fs');

class SerialManager {
  constructor() {
    this.sessions = new Map(); // sessionId -> { portInstance, config }
  }

  async listPorts() {
    // Try using serialport module if available
    try {
      const { SerialPort } = require('serialport');
      const ports = await SerialPort.list();
      if (ports && ports.length > 0) {
        return ports.map(p => ({
          path: p.path,
          manufacturer: p.manufacturer || 'Unknown',
          serialNumber: p.serialNumber || '',
          vendorId: p.vendorId || '',
          productId: p.productId || ''
        }));
      }
    } catch (e) {
      console.warn('serialport native list failed, falling back to OS specific scan:', e.message);
    }

    // Windows fallback: scan COM ports via Windows Registry / PowerShell
    if (process.platform === 'win32') {
      try {
        const { execSync } = require('child_process');
        const output = execSync('reg query HKLM\\HARDWARE\\DEVICEMAP\\SERIALCOMM', { encoding: 'utf8' });
        const lines = output.split('\n');
        const comPorts = [];
        for (const line of lines) {
          const match = line.match(/COM\d+/i);
          if (match) {
            const comName = match[0].toUpperCase();
            if (!comPorts.some(p => p.path === comName)) {
              comPorts.push({
                path: comName,
                manufacturer: 'Windows Serial/USB COM Port',
                serialNumber: '',
                vendorId: '',
                productId: ''
              });
            }
          }
        }
        if (comPorts.length > 0) return comPorts;
      } catch (winErr) {
        console.warn('Windows reg query serial scan error:', winErr.message);
      }
    }

    // macOS/Linux fallback: scan /dev directory for serial ports
    try {
      if (fs.existsSync('/dev')) {
        const devFiles = fs.readdirSync('/dev');
        return devFiles
          .filter(f => f.startsWith('cu.') || f.startsWith('tty.usb') || f.startsWith('tty.serial'))
          .map(f => ({
            path: '/dev/' + f,
            manufacturer: f.includes('usb') ? 'USB Serial Interface' : 'macOS/Linux Serial Device',
            serialNumber: '',
            vendorId: '',
            productId: ''
          }));
      }
    } catch (err) {
      console.error('Error scanning /dev serial ports:', err);
    }
    return [];
  }

  connect(sessionId, config, socket) {
    let SerialPort;
    try {
      const spModule = require('serialport');
      SerialPort = spModule.SerialPort;
    } catch (err) {
      socket.emit('terminal:status', {
        sessionId,
        status: 'error',
        message: 'Lỗi module SerialPort: ' + err.message
      });
      return;
    }

    const serialPath = config.serialPath || config.host;
    const baudRate = parseInt(config.baudRate, 10) || 9600;
    const dataBits = parseInt(config.dataBits, 10) || 8;
    const stopBits = parseInt(config.stopBits, 10) || 1;
    const parity = config.parity || 'none';

    socket.emit('terminal:status', {
      sessionId,
      status: 'connecting',
      message: `Connecting Serial Port ${serialPath} @ ${baudRate} bps...`
    });

    const port = new SerialPort({
      path: serialPath,
      baudRate,
      dataBits,
      stopBits,
      parity,
      autoOpen: false
    });

    port.open((err) => {
      if (err) {
        socket.emit('terminal:status', {
          sessionId,
          status: 'error',
          message: `Serial Error: ${err.message}`
        });
        return;
      }

      socket.emit('terminal:status', {
        sessionId,
        status: 'connected',
        message: `Serial Connected (${serialPath} - ${baudRate} bps)`
      });

      this.sessions.set(sessionId, { portInstance: port, config });

      port.on('data', (data) => {
        socket.emit('terminal:output', { sessionId, data: data.toString('utf-8') });
      });

      port.on('close', () => {
        socket.emit('terminal:status', { sessionId, status: 'closed', message: 'Serial Port Closed' });
        this.disconnect(sessionId);
      });

      port.on('error', (e) => {
        socket.emit('terminal:status', { sessionId, status: 'error', message: `Serial Runtime Error: ${e.message}` });
      });
    });
  }

  write(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (session && session.portInstance) {
      session.portInstance.write(data);
    }
  }

  disconnect(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        if (session.portInstance && session.portInstance.isOpen) {
          session.portInstance.close();
        }
      } catch (e) {}
      this.sessions.delete(sessionId);
    }
  }
}

module.exports = new SerialManager();
