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

  async loginAndSync({ email, password, syncUrl }) {
    try {
      this.email = email;
      this.syncUrl = syncUrl;
      this.socket.emit('sync:status', { message: 'Deriving encryption keys...', type: 'info' });
      
      // 1. Derive key from password
      this.derivedKey = cryptoUtil.deriveKeyFromPassword(password);

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
        const payload = JSON.stringify({ email, password, syncUrl });
        const encPayload = cryptoUtil.encryptPassword(payload);
        fs.writeFileSync(AUTH_FILE, encPayload, 'utf8');
      } catch (e) {
        console.warn('Failed to save auth to disk', e);
      }

      this.socket.emit('sync:auth_success', { email });
      await this.performSync();
      
    } catch (err) {
      console.error('Sync Login Error:', err.response?.data || err.message);
      this.socket.emit('sync:status', { 
        message: err.response?.data?.error || err.message || 'Login failed', 
        type: 'error' 
      });
    }
  }

  async register({ email, password, syncUrl }) {
    try {
      this.email = email;
      this.syncUrl = syncUrl;
      this.socket.emit('sync:status', { message: 'Generating RSA Keypair (2048-bit)...', type: 'info' });
      
      const { publicKey, privateKey } = cryptoUtil.generateRSAKeyPair();
      this.derivedKey = cryptoUtil.deriveKeyFromPassword(password);
      
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
        await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, JSON.stringify({ email, password, syncUrl }));
      } catch (e) {
        console.warn('Failed to save to keychain', e);
      }

      this.socket.emit('sync:auth_success', { email });
      await this.performSync();
      
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
      if (authData && authData.email && authData.password) {
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

  async performSync() {
    try {
      this.socket.emit('sync:status', { message: 'Bắt đầu đồng bộ...', type: 'info' });

      // 1. LOAD LOCAL DATA
      const data = dataStore.loadData();
      const localConns = data.connections || [];
      const localGroups = data.groups || [];
      const localSnippets = data.snippets || [];
      const deletedResourceIds = data.deletedResourceIds || [];

      // 2. FETCH COLLECTIONS METADATA
      const res = await axios.get(`${this.syncUrl}/sync/pull`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      const collections = res.data;
      const personalAccess = collections.find(c => c.collection.type === 'PERSONAL');
      
      let pushCount = 0;

      // 3. PUSH LOCAL CHANGES FIRST (LWW: Local wins over stale cloud)
      if (personalAccess) {
        const hexCollectionKey = cryptoUtil.decryptWithPrivateKey(personalAccess.encryptedKey, this.privateKey);
        const collectionKeyBuffer = Buffer.from(hexCollectionKey, 'hex');
        
        const resourcesToPush = [];
        for (const conn of localConns) {
          if (!conn.collectionId || conn.collectionId === personalAccess.collection.id) {
            const encPayload = cryptoUtil.encryptWithSymmetricKey(JSON.stringify(conn), collectionKeyBuffer);
            resourcesToPush.push({ id: conn.id, type: 'CONNECTION', name: conn.name || 'Unknown Connection', encPayload });
          }
        }
        for (const grp of localGroups) {
          if (!grp.collectionId || grp.collectionId === personalAccess.collection.id) {
            const encPayload = cryptoUtil.encryptWithSymmetricKey(JSON.stringify(grp), collectionKeyBuffer);
            resourcesToPush.push({ id: grp.id, type: 'GROUP', name: grp.name || 'Unknown Group', encPayload });
          }
        }
        for (const snip of localSnippets) {
          if (!snip.collectionId || snip.collectionId === personalAccess.collection.id) {
            const encPayload = cryptoUtil.encryptWithSymmetricKey(JSON.stringify(snip), collectionKeyBuffer);
            resourcesToPush.push({ id: snip.id, type: 'SNIPPET', name: snip.title, encPayload });
            pushCount++;
          }
        }

        if (pushCount > 0 || deletedResourceIds.length > 0) {
          this.socket.emit('sync:status', { message: `Đang đẩy ${pushCount} cập nhật và ${deletedResourceIds.length} xóa lên Cloud...`, type: 'info' });
          try {
            await axios.post(`${this.syncUrl}/sync/push`, {
              collectionId: personalAccess.collection.id,
              resources: resourcesToPush,
              deletedIds: deletedResourceIds
            }, {
              headers: { Authorization: `Bearer ${this.token}` }
            });
            // Clear deletedResourceIds after successful push
            data.deletedResourceIds = [];
            dataStore.saveData(data);
          } catch (e) {
            console.error(`Failed to push resources:`, e.response?.data || e.message);
          }
        }
      }

      // 4. PULL & DECRYPT FROM CLOUD
      // We re-fetch to get the newly pushed state + any other changes
      const pullRes = await axios.get(`${this.syncUrl}/sync/pull`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      const updatedCollections = pullRes.data;
      
      let newConnections = [];
      let newGroups = [];
      let newSnippets = [];

      for (const access of updatedCollections) {
        const hexCollectionKey = cryptoUtil.decryptWithPrivateKey(access.encryptedKey, this.privateKey);
        if (!hexCollectionKey) continue;
        const collectionKeyBuffer = Buffer.from(hexCollectionKey, 'hex');

        for (const resource of access.collection.resources) {
          try {
            const decPayload = cryptoUtil.decryptWithSymmetricKey(resource.encPayload, collectionKeyBuffer);
            if (decPayload && !decPayload.startsWith('ENC:v1:')) {
              const obj = JSON.parse(decPayload);
              obj.collectionId = access.collection.id;
              if (resource.type === 'CONNECTION') newConnections.push(obj);
              else if (resource.type === 'GROUP') newGroups.push(obj);
              else if (resource.type === 'SNIPPET') newSnippets.push(obj);
            }
          } catch (e) {}
        }
      }

      // 5. MERGE CLOUD INTO LOCAL
      const pulledCollectionIds = updatedCollections.map(a => a.collection.id);
      
      // Keep local items if they belong to a collection we didn't pull OR if cloud returned them
      let finalConns = localConns.filter(c => !c.collectionId || !pulledCollectionIds.includes(c.collectionId) || newConnections.some(nc => nc.id === c.id));
      let finalGroups = localGroups.filter(g => !g.collectionId || !pulledCollectionIds.includes(g.collectionId) || newGroups.some(ng => ng.id === g.id));
      let finalSnippets = localSnippets.filter(s => !s.collectionId || !pulledCollectionIds.includes(s.collectionId) || newSnippets.some(ns => ns.id === s.id));

      const mergedMap = new Map();
      finalConns.forEach(c => mergedMap.set(c.id, c));
      newConnections.forEach(c => mergedMap.set(c.id, c)); // Cloud is now guaranteed to have our latest push
      data.connections = Array.from(mergedMap.values());

      const mergedGroupsMap = new Map();
      finalGroups.forEach(c => mergedGroupsMap.set(c.id, c));
      newGroups.forEach(c => mergedGroupsMap.set(c.id, c));
      data.groups = Array.from(mergedGroupsMap.values());

      const mergedSnippetsMap = new Map();
      finalSnippets.forEach(c => mergedSnippetsMap.set(c.id, c));
      newSnippets.forEach(c => mergedSnippetsMap.set(c.id, c));
      data.snippets = Array.from(mergedSnippetsMap.values());

      // 6. SAVE & NOTIFY
      dataStore.saveData(data);
      this.socket.emit('sync:status', { message: `Đồng bộ hoàn tất! (Tải về ${newConnections.length} máy chủ)`, type: 'success' });
      this.socket.emit('data:update', data);

    } catch (err) {
      console.error('Sync Error:', err.response?.data || err.message);
      this.socket.emit('sync:status', { 
        message: err.response?.data?.error || err.message || 'Sync failed', 
        type: 'error' 
      });
    }
  }
}

module.exports = SyncManager;
