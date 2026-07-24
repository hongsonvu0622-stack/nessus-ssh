import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAnyUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await verifyAnyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all collections where the user is an OWNER or MANAGER or ADMIN (they have the keys and authority to share)
    // Actually, any user who HAS the collection key could theoretically share it. 
    // Let's find collections where this user is OWNER or MANAGER.
    const myAccess = await prisma.collectionUser.findMany({
      where: { 
        userId: user.id,
        role: { in: ['OWNER', 'MANAGER', 'ADMIN'] }
      },
      include: {
        collection: {
          include: {
            tenant: {
              include: {
                users: {
                  include: {
                    user: {
                      select: { id: true, publicKey: true }
                    }
                  }
                }
              }
            },
            users: true
          }
        }
      }
    });

    const pendingShares = [];
    
    // 2. Find any Tenant Users who do NOT have a CollectionUser record for these collections
    for (const access of myAccess) {
      const collection = access.collection;
      const tenantUsers = collection.tenant.users;
      
      const collectionUserIds = new Set(collection.users.map(cu => cu.userId));

      for (const tu of tenantUsers) {
        if (!collectionUserIds.has(tu.user.id)) {
          // This tenant member doesn't have access to this collection yet.
          pendingShares.push({
            collectionId: collection.id,
            targetUserId: tu.user.id,
            targetPublicKey: tu.user.publicKey,
            role: tu.role === 'ADMIN' ? 'MANAGER' : 'VIEWER' // Admin of tenant becomes Manager of vault, Member becomes Viewer
          });
        }
      }
    }

    return NextResponse.json(pendingShares);
  } catch (error) {
    console.error('Pending keys error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
