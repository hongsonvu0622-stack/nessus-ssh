const { Client } = require('ssh2');
const fs = require('fs');
const cryptoUtil = require('./cryptoUtil');

class SftpManager {
  connectSftp(config) {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          resolve({ conn, sftp });
        });
      }).on('error', (err) => {
        reject(err);
      });

      const connectConfig = {
        host: config.host,
        port: config.port || 22,
        username: config.username || 'root',
        readyTimeout: 15000
      };

      if (config.authType === 'key' || config.keyPath) {
        try {
          connectConfig.privateKey = fs.readFileSync(config.keyPath);
          const pass = cryptoUtil.decryptPassword(config.passphrase || '');
          if (pass) connectConfig.passphrase = pass;
        } catch (err) {
          return reject(err);
        }
      } else {
        connectConfig.password = cryptoUtil.decryptPassword(config.password || '');
      }

      conn.connect(connectConfig);
    });
  }

  async listDirectory(config, remotePath = '.') {
    const { conn, sftp } = await this.connectSftp(config);
    return new Promise((resolve, reject) => {
      sftp.readdir(remotePath, (err, list) => {
        conn.end();
        if (err) return reject(err);
        const files = list.map(item => ({
          filename: item.filename,
          isDirectory: (item.attrs.mode & 0o170000) === 0o040000,
          size: item.attrs.size,
          mtime: item.attrs.mtime * 1000,
          permissions: item.attrs.mode
        }));
        resolve(files);
      });
    });
  }

  async readFileContent(config, remoteFile) {
    const { conn, sftp } = await this.connectSftp(config);
    return new Promise((resolve, reject) => {
      const chunks = [];
      const readStream = sftp.createReadStream(remoteFile);
      readStream.on('data', chunk => chunks.push(chunk));
      readStream.on('end', () => {
        conn.end();
        resolve(Buffer.concat(chunks).toString('utf-8'));
      });
      readStream.on('error', err => {
        conn.end();
        reject(err);
      });
    });
  }

  async writeFileContent(config, remoteFile, content) {
    const { conn, sftp } = await this.connectSftp(config);
    return new Promise((resolve, reject) => {
      const writeStream = sftp.createWriteStream(remoteFile);
      writeStream.on('finish', () => {
        conn.end();
        resolve(true);
      });
      writeStream.on('error', err => {
        conn.end();
        reject(err);
      });
      writeStream.end(content, 'utf-8');
    });
  }
}

module.exports = new SftpManager();
