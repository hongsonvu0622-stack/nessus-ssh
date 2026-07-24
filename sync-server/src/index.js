const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey-nexusssh';

app.use(cors());
app.use(express.json());

// Authentication Middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// ==========================================
// AUTHENTICATION APIs
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { email, password, publicKey, encPrivateKey } = req.body;
  if (!email || !password || !publicKey || !encPrivateKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create User, a Personal Tenant, and a Personal Collection automatically
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        publicKey,
        encPrivateKey,
        tenants: {
          create: {
            role: 'OWNER',
            tenant: {
              create: {
                name: 'Personal Workspace',
                collections: {
                  create: {
                    name: 'Personal Collection',
                    type: 'PERSONAL'
                  }
                }
              }
            }
          }
        }
      },
      include: {
        tenants: {
          include: {
            tenant: {
              include: { collections: true }
            }
          }
        }
      }
    });

    // We must assign the CollectionUser key for this personal collection!
    // Since the client must encrypt the CollectionKey with their own public key,
    // we'll let the client do this right after registration via a separate endpoint,
    // or return the collection ID so the client can upload the key immediately.
    
    const personalCollection = user.tenants[0].tenant.collections[0];

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id, personalCollectionId: personalCollection.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user.id, encPrivateKey: user.encPrivateKey });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==========================================
// SYNC & KEY MANAGEMENT APIs
// ==========================================

// Get a user's public key (for sharing)
app.get('/api/users/:email/public-key', auth, async (req, res) => {
  try {
    const targetUser = await prisma.user.findUnique({ where: { email: req.params.email } });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    res.json({ userId: targetUser.id, publicKey: targetUser.publicKey });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload/Assign encrypted Collection Key for a User
app.post('/api/collections/:id/keys', auth, async (req, res) => {
  const collectionId = req.params.id;
  const { targetUserId, encryptedKey, role } = req.body; // role: MANAGER, EDITOR, VIEWER

  try {
    // Basic auth check: Can req.user.userId share this? 
    // In production, we'd check if req.user is a MANAGER of this collection.
    
    const record = await prisma.collectionUser.upsert({
      where: {
        collectionId_userId: { collectionId, userId: targetUserId }
      },
      update: { encryptedKey, role: role || 'VIEWER' },
      create: {
        collectionId,
        userId: targetUserId,
        encryptedKey,
        role: role || 'VIEWER'
      }
    });
    res.json(record);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pull all sync data (Collections, Keys, Resources)
app.get('/api/sync/pull', auth, async (req, res) => {
  try {
    // Get all collections the user has access to
    const accessRecords = await prisma.collectionUser.findMany({
      where: { userId: req.user.userId },
      include: {
        collection: {
          include: { resources: true }
        }
      }
    });

    res.json(accessRecords);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Push (upsert) a resource (Connection/Snippet/SSH Key)
app.post('/api/sync/push', auth, async (req, res) => {
  const { resourceId, collectionId, type, encPayload } = req.body;
  try {
    // Check access
    const access = await prisma.collectionUser.findUnique({
      where: { collectionId_userId: { collectionId, userId: req.user.userId } }
    });

    if (!access || access.role === 'VIEWER') {
      return res.status(403).json({ error: 'No write access to this collection' });
    }

    const resource = await prisma.resource.upsert({
      where: { id: resourceId },
      update: { encPayload, type },
      create: { id: resourceId, collectionId, type, encPayload }
    });

    res.json(resource);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`E2EE Sync Server running on port ${PORT}`);
});
