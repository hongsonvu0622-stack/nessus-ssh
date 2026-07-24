const axios = require('axios');
const cryptoUtil = require('./cryptoUtil');
const dataStore = require('./dataStore');
const fs = require('fs');
const path = require('path');
const os = require('os');

const AUTH_FILE = path.join(os.homedir(), '.nexusssh', 'sync_auth.json');

class SyncManager {
  constructor(socket) {
    this.socket = socket;
    this.token = null;
    this.syncUrl = null;
    this.derivedKey = null;
    this.privateKey = null;
    this.userId = null;
    this.email = null;
  }

  async loginAndSync({ email, password, passphrase, syncUrl }) {
    try {
      this.email = email;
      this.syncUrl = syncUrl;
      this.socket.emit('sync:status', { message: 'Deriving encryption keys...', type: 'info' });
      
      // 1. Derive key from passphrase
      this.derivedKey = cryptoUtil.deriveKeyFromPassword(passphrase);

      this.socket.emit('sync:status', { message: 'Authenticating with Sync Server...', type: 'info' });
      
      // 2. Login
      const res = await axios.post(`${syncUrl}/auth/login`, { email, password });
      this.token = res.data.token;
      this.userId = res.data.userId;
      
      this.socket.emit('sync:status', { message: 'Decrypting private key...', type: 'info' });

      // 3. Decrypt Private Key
      const encPrivateKey = res.data.encPrivateKey;
      this.privateKey = cryptoUtil.decryptWithSymmetricKey(encPrivateKey, this.derivedKey);
      
      if (!this.privateKey) {
        throw new Error('Failed to decrypt private key. Incorrect sync password?');
      }

      // Save to encrypted file for auto-login
      try {
        const payload = JSON.stringify({ email, password, passphrase, syncUrl });
        const encPayload = cryptoUtil.encryptPassword(payload);
        fs.writeFileSync(AUTH_FILE, encPayload, 'utf8');
      } catch (e) {
        console.warn('Failed to save auth to disk', e);
      }

      this.socket.emit('sync:auth_success', { email });
      await this.performSync(true); // skip push on startup
      
    } catch (err) {
      console.error('Sync Login Error:', err.response?.data || err.message);
      this.socket.emit('sync:status', { 
        message: err.response?.data?.error || err.message || 'Login failed', 
        type: 'error' 
      });
    }
  }

  async register({ email, password, passphrase, syncUrl }) {
    try {
      this.email = email;
      this.syncUrl = syncUrl;
      this.socket.emit('sync:status', { message: 'Generating RSA Keypair (2048-bit)...', type: 'info' });
      
      const { publicKey, privateKey } = cryptoUtil.generateRSAKeyPair();
      this.derivedKey = cryptoUtil.deriveKeyFromPassword(passphrase);
      
      const encPrivateKey = cryptoUtil.encryptWithSymmetricKey(privateKey, this.derivedKey);

      this.socket.emit('sync:status', { message: 'Registering account on Sync Server...', type: 'info' });
      
      const res = await axios.post(`${syncUrl}/auth/register`, {
        email,
        password,
        publicKey,
        encPrivateKey
      });

      this.token = res.data.token;
      this.userId = res.data.userId;
      this.privateKey = privateKey;
      
      // The server created a Personal Collection for us, but we need to generate its AES key,
      // encrypt it with our public key, and upload it.
      const personalCollectionId = res.data.personalCollectionId;
      
      this.socket.emit('sync:status', { message: 'Initializing Personal Vault E2EE...', type: 'info' });
      
      const collectionKey = require('crypto').randomBytes(32);
      const encryptedCollectionKey = cryptoUtil.encryptWithPublicKey(collectionKey.toString('hex'), publicKey);
      
      await axios.post(`${syncUrl}/collections/${personalCollectionId}/keys`, {
        targetUserId: this.userId,
        encryptedKey: encryptedCollectionKey,
        role: 'MANAGER'
      }, {
        headers: { Authorization: `Bearer ${this.token}` }
      });

      // Save to keychain for auto-login
      try {
        const payload = JSON.stringify({ email, password, passphrase, syncUrl });
        const encPayload = cryptoUtil.encryptPassword(payload);
        fs.writeFileSync(AUTH_FILE, encPayload, 'utf8');
      } catch (e) {
        console.warn('Failed to save to auth file', e);
      }

      this.socket.emit('sync:auth_success', { email });
      await this.performSync(true); // skip push on startup
      
    } catch (err) {
      console.error('Sync Register Error:', err.response?.data || err.message);
      this.socket.emit('sync:status', { 
        message: err.response?.data?.error || err.message || 'Registration failed', 
        type: 'error' 
      });
    }
  }

  async checkAutoLogin() {
    try {
      if (!fs.existsSync(AUTH_FILE)) return false;
      const encPayload = fs.readFileSync(AUTH_FILE, 'utf8');
      const decPayload = cryptoUtil.decryptPassword(encPayload);
      if (!decPayload || decPayload === encPayload) return false;

      const authData = JSON.parse(decPayload);
      if (authData && authData.email && authData.password && authData.passphrase) {
        this.socket.emit('sync:status', { message: 'Auto-logging in...', type: 'info' });
        await this.loginAndSync(authData);
        return true;
      }
    } catch (e) {
      console.warn('Failed to read from auth file', e);
    }
    return false;
  }

  async logout() {
    this.token = null;
    this.userId = null;
    this.email = null;
    this.privateKey = null;
    this.derivedKey = null;
    try {
      if (fs.existsSync(AUTH_FILE)) {
        fs.unlinkSync(AUTH_FILE);
      }
    } catch (e) {
      console.warn('Failed to delete auth file', e);
    }
    this.socket.emit('sync:logged_out');
  }

  async performSync(options = {}) {
    const skipPush = options.skipPush === true;
    const skipPull = options.skipPull === true;
    try {
      this.socket.emit('sync:status', { message: skipPull ? 'Đang cập nhật lên Cloud...' : 'Bắt đầu đồng bộ...', type: 'info' });
      
      let data = dataStore.loadData();

      if (!skipPull || !this.collections) {
        // Pull Collections
      const res = await axios.get(`${this.syncUrl}/sync/pull`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });

        this.collections = res.data;
        const collections = res.data;
      let newConnections = [];
      let newGroups = [];
      let newSnippets = [];

      for (const access of collections) {
        // Decrypt the Collection Key using our RSA Private Key
        const hexCollectionKey = cryptoUtil.decryptWithPrivateKey(access.encryptedKey, this.privateKey);
        if (!hexCollectionKey) {
          console.warn(`Could not decrypt key for collection ${access.collection.name}`);
          continue;
        }
        
        const collectionKeyBuffer = Buffer.from(hexCollectionKey, 'hex');

        // Decrypt all resources in this collection
        for (const resource of access.collection.resources) {
          if (resource.type === 'CONNECTION') {
            const decPayload = cryptoUtil.decryptWithSymmetricKey(resource.encPayload, collectionKeyBuffer);
            if (decPayload && !decPayload.startsWith('ENC:v1:')) {
              try {
                const conn = JSON.parse(decPayload);
                conn.collectionId = access.collection.id; // tag it
                newConnections.push(conn);
              } catch (e) {
                console.error('Failed to parse decrypted resource', e);
              }
            }
          } else if (resource.type === 'GROUP') {
            const decPayload = cryptoUtil.decryptWithSymmetricKey(resource.encPayload, collectionKeyBuffer);
            if (decPayload && !decPayload.startsWith('ENC:v1:')) {
              try {
                const grp = JSON.parse(decPayload);
                grp.collectionId = access.collection.id;
                newGroups.push(grp);
              } catch (e) {}
            }
          } else if (resource.type === 'SNIPPET') {
            const decPayload = cryptoUtil.decryptWithSymmetricKey(resource.encPayload, collectionKeyBuffer);
            if (decPayload && !decPayload.startsWith('ENC:v1:')) {
              try {
                const snip = JSON.parse(decPayload);
                snip.collectionId = access.collection.id;
                newSnippets.push(snip);
              } catch (e) {}
            }
          }
        }
      }

      // Merge with local connections (Simple merge for MVP: overwrite local with same ID)
      const mergedData = dataStore.loadData();
      const localConns = mergedData.connections || [];
      const localGroups = mergedData.groups || [];
      const localSnippets = mergedData.snippets || [];
      const deletedResourceIds = mergedData.deletedResourceIds || [];
      
      const pulledCollectionIds = collections.map(a => a.collection.id);

      // Filter logic: keep local if not in pulled collection, or if pulled from server.
      // Also ignore any pulled item that is in the local deletedResourceIds blacklist.
      let finalConns = localConns.filter(c => !c.collectionId || !pulledCollectionIds.includes(c.collectionId) || newConnections.some(nc => nc.id === c.id));
      let finalGroups = localGroups.filter(g => !g.collectionId || !pulledCollectionIds.includes(g.collectionId) || newGroups.some(ng => ng.id === g.id));
      let finalSnippets = localSnippets.filter(s => !s.collectionId || !pulledCollectionIds.includes(s.collectionId) || newSnippets.some(ns => ns.id === s.id));

      const mergedMap = new Map();
      finalConns.forEach(c => mergedMap.set(c.id, c));
      newConnections.forEach(c => {
        if (!deletedResourceIds.includes(c.id)) {
          const local = mergedMap.get(c.id);
          if (!local) {
            mergedMap.set(c.id, c);
          } else {
            const localTime = local.updatedAt || 0;
            const cloudTime = c.updatedAt || 0;
            if (cloudTime >= localTime) {
              mergedMap.set(c.id, c);
            }
          }
        }
      });
      mergedData.connections = Array.from(mergedMap.values());

      const mergedGroupsMap = new Map();
      finalGroups.forEach(c => mergedGroupsMap.set(c.id, c));
      newGroups.forEach(c => {
        if (!deletedResourceIds.includes(c.id)) {
          const local = mergedGroupsMap.get(c.id);
          if (!local) {
            mergedGroupsMap.set(c.id, c);
          } else {
            const localTime = local.updatedAt || 0;
            const cloudTime = c.updatedAt || 0;
            if (cloudTime >= localTime) {
              mergedGroupsMap.set(c.id, c);
            }
          }
        }
      });
      mergedData.groups = Array.from(mergedGroupsMap.values());

      const mergedSnippetsMap = new Map();
      finalSnippets.forEach(c => mergedSnippetsMap.set(c.id, c));
      newSnippets.forEach(c => {
        if (!deletedResourceIds.includes(c.id)) {
          const local = mergedSnippetsMap.get(c.id);
          if (!local) {
            mergedSnippetsMap.set(c.id, c);
          } else {
            const localTime = local.updatedAt || 0;
            const cloudTime = c.updatedAt || 0;
            if (cloudTime >= localTime) {
              mergedSnippetsMap.set(c.id, c);
            }
          }
        }
      });
      mergedData.snippets = Array.from(mergedSnippetsMap.values());

      dataStore.saveData(mergedData);
      data = mergedData; // Update the outer scope variable so push uses the merged state

      this.socket.emit('sync:status', { message: `Sync Pull complete! Decrypted ${newConnections.length} remote resources. Pushing local updates...`, type: 'info' });
    }

      if (!this.collections) return;

      // Find the Personal Collection to push to
      const personalAccess = this.collections.find(c => c.collection.type === 'PERSONAL');
      // 3. PUSH LOCAL CHANGES FIRST (LWW: Local wins over stale cloud)
      if (!skipPush && personalAccess) {
        const hexCollectionKey = cryptoUtil.decryptWithPrivateKey(personalAccess.encryptedKey, this.privateKey);
        const collectionKeyBuffer = Buffer.from(hexCollectionKey, 'hex');

        const validCollectionIds = this.collections.map(c => c.collection.id);
        let pushCount = 0;
        const resourcesToPush = [];
        
        for (const conn of data.connections) {
          if (conn.collectionId && !validCollectionIds.includes(conn.collectionId)) {
            conn.collectionId = personalAccess.collection.id; // Auto-recover orphaned data
          }
          if (!conn.collectionId || conn.collectionId === personalAccess.collection.id) {
            const encPayload = cryptoUtil.encryptWithSymmetricKey(JSON.stringify(conn), collectionKeyBuffer);
            resourcesToPush.push({
              id: conn.id,
              type: 'CONNECTION',
              name: conn.name || 'Unknown Connection',
              encPayload
            });
            pushCount++;
          }
        }

        for (const grp of data.groups || []) {
          if (grp.collectionId && !validCollectionIds.includes(grp.collectionId)) {
            grp.collectionId = personalAccess.collection.id;
          }
          if (!grp.collectionId || grp.collectionId === personalAccess.collection.id) {
            const encPayload = cryptoUtil.encryptWithSymmetricKey(JSON.stringify(grp), collectionKeyBuffer);
            resourcesToPush.push({
              id: grp.id,
              type: 'GROUP',
              name: grp.name || 'Unknown Group',
              encPayload
            });
            pushCount++;
          }
        }

        for (const snip of data.snippets || []) {
          if (snip.collectionId && !validCollectionIds.includes(snip.collectionId)) {
            snip.collectionId = personalAccess.collection.id;
          }
          if (!snip.collectionId || snip.collectionId === personalAccess.collection.id) {
            const encPayload = cryptoUtil.encryptWithSymmetricKey(JSON.stringify(snip), collectionKeyBuffer);
            resourcesToPush.push({
              id: snip.id,
              name: snip.title,
              type: 'SNIPPET',
              encPayload
            });
            pushCount++;
          }
        }

        const deletedIds = data.deletedResourceIds || [];

        // Execute push
        this.socket.emit('sync:status', { message: `Pushing ${pushCount} local updates and ${deletedIds.length} deletions to server...`, type: 'info' });
        try {
          await axios.post(`${this.syncUrl}/sync/push`, {
            collectionId: personalAccess.collection.id,
            resources: resourcesToPush,
            deletedIds: deletedIds
          }, {
            headers: { Authorization: `Bearer ${this.token}` }
          });
          
          // Clear deletedResourceIds after successful push
          data.deletedResourceIds = [];
          dataStore.saveData(data);
        } catch (e) {
          console.error(`Failed to push resources:`, e.response?.data || e.message);
        }

        this.socket.emit('sync:status', { message: `Sync complete! Pushed ${pushCount} local resources.`, type: 'success' });
      } else {
        this.socket.emit('sync:status', { message: `Sync complete! (No personal vault found to push).`, type: 'success' });
      }
      
      this.socket.emit('sync:success');

      // Trigger UI reload
      this.socket.emit('data:update', data);

    } catch (err) {
      console.error('Sync Error:', err.response?.data || err.message);
      this.socket.emit('sync:status', { 
        message: err.response?.data?.error || err.message || 'Sync failed', 
        type: 'error' 
      });
      this.socket.emit('sync:error');
    }
  }
}

module.exports = SyncManager;
