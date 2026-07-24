import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request, context) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey-nexusssh');
    const uploaderUserId = decoded.userId; // Not strictly used for checking right now, but for Auth

    const { id: collectionId } = await context.params;
    const body = await request.json();
    const { targetUserId, encryptedKey, role } = body;

    if (!targetUserId || !encryptedKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert the CollectionUser to ensure the user has access with this key
    const collectionUser = await prisma.collectionUser.upsert({
      where: {
        collectionId_userId: {
          collectionId,
          userId: targetUserId
        }
      },
      update: {
        encryptedKey,
        role: role || 'MANAGER'
      },
      create: {
        collectionId,
        userId: targetUserId,
        encryptedKey,
        role: role || 'MANAGER'
      }
    });

    return NextResponse.json(collectionUser);
  } catch (error) {
    console.error('Add Collection Key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
