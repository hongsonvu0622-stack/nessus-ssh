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
      
      // Xoá sạch dữ liệu cục bộ khi logout để tránh rò rỉ dữ liệu và chống ID collision
      dataStore.saveData({
        connections: [],
        groups: [],
        snippets: [],
        deletedResourceIds: []
      });

      // Gửi event để client (App.jsx) reset giao diện
      this.socket.emit('data:update', {
        connections: [],
        groups: [],
        snippets: [],
        deletedResourceIds: []
      });

    } catch (e) {
      console.warn('Failed to delete auth file or clear local data', e);
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
        // 1. Ensure all my Tenants have a Shared Collection
        await this.autoInitializeTenantCollections();

        // 2. Pull Collections
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
                conn.isShared = access.collection.type === 'SHARED';
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
                grp.isShared = access.collection.type === 'SHARED';
                newGroups.push(grp);
              } catch (e) {}
            }
          } else if (resource.type === 'SNIPPET') {
            const decPayload = cryptoUtil.decryptWithSymmetricKey(resource.encPayload, collectionKeyBuffer);
            if (decPayload && !decPayload.startsWith('ENC:v1:')) {
              try {
                const snip = JSON.parse(decPayload);
                snip.collectionId = access.collection.id;
                snip.isShared = access.collection.type === 'SHARED';
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

      // Filter logic: 
      // - Keep local if it doesn't have a collectionId yet (newly created offline).
      // - Keep local if its collectionId is still in pulledCollectionIds (we still have access).
      // - If collectionId is present but NOT in pulledCollectionIds, we lost access to this Tenant/Vault -> DELETE IT locally.
      let finalConns = localConns.filter(c => !c.collectionId || pulledCollectionIds.includes(c.collectionId));
      let finalGroups = localGroups.filter(g => !g.collectionId || pulledCollectionIds.includes(g.collectionId));
      let finalSnippets = localSnippets.filter(s => !s.collectionId || pulledCollectionIds.includes(s.collectionId));

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
            } else {
              local.collectionId = c.collectionId;
              local.isShared = c.isShared;
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
            } else {
              local.collectionId = c.collectionId;
              local.isShared = c.isShared;
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
            } else {
              local.collectionId = c.collectionId;
              local.isShared = c.isShared;
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

      // 3. PUSH LOCAL CHANGES
      if (!skipPush) {
        const validCollections = this.collections || [];
        const personalAccess = validCollections.find(c => c.collection.type === 'PERSONAL');
        const personalCollectionId = personalAccess?.collection.id;
        
        // Build maps for routing and encryption
        const keyBuffers = new Map();
        const nameToId = new Map();
        
        for (const access of validCollections) {
          const hexCollectionKey = cryptoUtil.decryptWithPrivateKey(access.encryptedKey, this.privateKey);
          if (hexCollectionKey) {
            keyBuffers.set(access.collection.id, Buffer.from(hexCollectionKey, 'hex'));
            if (access.collection.type === 'SHARED') {
              nameToId.set(access.collection.name, access.collection.id); // Auto-routing map (Group Name -> Shared Vault ID)
            }
          }
        }
        
        const pushPayloads = {};
        for (const cid of keyBuffers.keys()) {
          pushPayloads[cid] = { resourcesToPush: [], deletedIds: [] };
        }
        
        // Broadcast hard-deleted items to all vaults (server will ignore if not found)
        const hardDeletedIds = data.deletedResourceIds || [];
        for (const cid of keyBuffers.keys()) {
          pushPayloads[cid].deletedIds.push(...hardDeletedIds);
        }

        let pushCount = 0;

        const processResource = (item, type) => {
          let currentId = item.collectionId;
          let targetId = personalCollectionId;
          
          // Auto-route based on Group Name matching Tenant Name
          if (type === 'CONNECTION') {
             const mappedId = nameToId.get(item.group);
             if (mappedId) {
                targetId = mappedId;
             } else if (currentId && keyBuffers.has(currentId)) {
                targetId = currentId; // keep current if valid
             }
          } else if (type === 'GROUP') {
             const mappedId = nameToId.get(item.name);
             if (mappedId) {
                targetId = mappedId;
             } else if (currentId && keyBuffers.has(currentId)) {
                targetId = currentId;
             }
          } else {
             if (currentId && keyBuffers.has(currentId)) {
                targetId = currentId;
             }
          }

          if (!targetId) targetId = personalCollectionId; // Absolute fallback to Personal Vault
          if (!targetId) return; // Skip if no target available

          // If the resource is moving from an old vault to a new one, we must issue a DELETE to the old vault
          if (currentId && currentId !== targetId && keyBuffers.has(currentId)) {
             pushPayloads[currentId].deletedIds.push(item.id);
          }
          
          item.collectionId = targetId; // Update local metadata
          item.isShared = validCollections.find(c => c.collection.id === targetId)?.collection.type === 'SHARED';

          const keyBuffer = keyBuffers.get(targetId);
          const encPayload = cryptoUtil.encryptWithSymmetricKey(JSON.stringify(item), keyBuffer);
          
          pushPayloads[targetId].resourcesToPush.push({
            id: item.id,
            type: type,
            name: item.name || item.title || 'Unknown',
            encPayload
          });
          pushCount++;
        };

        for (const conn of data.connections || []) processResource(conn, 'CONNECTION');
        for (const grp of data.groups || []) processResource(grp, 'GROUP');
        for (const snip of data.snippets || []) processResource(snip, 'SNIPPET');

        // Execute pushes for all affected vaults
        this.socket.emit('sync:status', { message: `Pushing ${pushCount} updates to ${Object.keys(pushPayloads).length} vaults...`, type: 'info' });
        
        let successCount = 0;
        for (const [cid, payload] of Object.entries(pushPayloads)) {
          if (payload.resourcesToPush.length === 0 && payload.deletedIds.length === 0) continue;
          
          try {
            await axios.post(`${this.syncUrl}/sync/push`, {
              collectionId: cid,
              resources: payload.resourcesToPush,
              deletedIds: payload.deletedIds
            }, {
              headers: { Authorization: `Bearer ${this.token}` }
            });
            successCount++;
          } catch (e) {
            console.error(`Failed to push to collection ${cid}:`, e.response?.data || e.message);
          }
        }
        
        if (successCount > 0) {
          data.deletedResourceIds = []; // Clear local deleted IDs only if we pushed successfully
          dataStore.saveData(data);
        }

        this.socket.emit('sync:status', { message: `Sync complete! Pushed to ${successCount} vaults.`, type: 'success' });
      }
      
      // E2EE Auto-Key Distribution for new members
      await this.distributePendingKeys();

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
  async distributePendingKeys() {
    try {
      const res = await axios.get(`${this.syncUrl}/sync/pending-keys`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      const pendingShares = res.data;
      
      if (!pendingShares || pendingShares.length === 0) return;
      
      this.socket.emit('sync:status', { message: `Đang cấp phát khoá E2EE cho ${pendingShares.length} thành viên mới...`, type: 'info' });

      for (const share of pendingShares) {
        // Find the collection locally from this.collections to get its encryptedKey
        const localColl = this.collections?.find(c => c.collection.id === share.collectionId);
        if (!localColl) continue;

        // Decrypt the AES key using my Private Key
        const hexCollectionKey = cryptoUtil.decryptWithPrivateKey(localColl.encryptedKey, this.privateKey);
        if (!hexCollectionKey) continue;

        // Encrypt the AES key using the Target's Public Key
        const newEncryptedKey = cryptoUtil.encryptWithPublicKey(hexCollectionKey, share.targetPublicKey);

        // Upload the new key for the target user
        await axios.post(`${this.syncUrl}/collections/${share.collectionId}/keys`, {
          targetUserId: share.targetUserId,
          encryptedKey: newEncryptedKey,
          role: share.role
        }, {
          headers: { Authorization: `Bearer ${this.token}` }
        });
      }
      this.socket.emit('sync:status', { message: `Đã cấp khoá thành công.`, type: 'success' });
    } catch (e) {
      console.error('Failed to distribute pending keys:', e.response?.data || e.message);
    }
  }
  async autoInitializeTenantCollections() {
    try {
      // Fetch all tenants the user belongs to
      const res = await axios.get(`${this.syncUrl}/admin/tenants`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      const tenants = res.data;
      if (!Array.isArray(tenants)) return;

      for (const tenant of tenants) {
        // Only initialize if the tenant has 0 collections
        if (tenant._count && tenant._count.collections === 0) {
          // Check if I am OWNER or ADMIN of this tenant
          const myMembership = tenant.users?.find(tu => tu.user?.email === this.userId || tu.userId === this.userId); // userId is stored in JWT, wait, GET /admin/tenants returns users which includes userId! 
          // Let's just try to create it. If we don't have permission, the server will reject it (403).
          
          this.socket.emit('sync:status', { message: `Đang khởi tạo Shared Vault cho Tenant: ${tenant.name}...`, type: 'info' });
          
          // Generate a new random AES key for this Shared Collection
          const crypto = require('crypto');
          const sharedCollectionKeyHex = crypto.randomBytes(32).toString('hex');
          const encryptedSharedKey = cryptoUtil.encryptWithPublicKey(sharedCollectionKeyHex, this.publicKey);
          
          try {
            await axios.post(`${this.syncUrl}/sync/collections`, {
              tenantId: tenant.id,
              name: tenant.name,
              encryptedKey: encryptedSharedKey,
              type: 'SHARED'
            }, {
              headers: { Authorization: `Bearer ${this.token}` }
            });
            this.socket.emit('sync:status', { message: `Khởi tạo Shared Vault thành công cho Tenant: ${tenant.name}`, type: 'success' });
          } catch (err) {
            if (err.response?.status !== 403) {
              console.error(`Failed to init collection for tenant ${tenant.name}:`, err.response?.data || err.message);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to auto-init tenant collections:', e.response?.data || e.message);
    }
  }
}

module.exports = SyncManager;
