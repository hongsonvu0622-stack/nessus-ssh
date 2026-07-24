import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAnyUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await verifyAnyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, name, encryptedKey, type } = await request.json();

    if (!tenantId || !name || !encryptedKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has permission in this tenant (OWNER or ADMIN)
    const membership = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: { tenantId, userId: user.id }
      }
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden. Must be OWNER or ADMIN of the tenant to create a collection.' }, { status: 403 });
    }

    // Create Collection
    const collection = await prisma.collection.create({
      data: {
        tenantId,
        name,
        type: type || 'SHARED',
        users: {
          create: {
            userId: user.id,
            encryptedKey,
            role: 'OWNER' // Creator is OWNER of the collection
          }
        }
      },
      include: {
        users: true
      }
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
