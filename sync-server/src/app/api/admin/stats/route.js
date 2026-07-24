import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin, verifyAnyUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await verifyAnyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    if (user.isSuperAdmin) {
      const [users, tenants, collections, resources] = await Promise.all([
        prisma.user.count(),
        prisma.tenant.count(),
        prisma.collection.count(),
        prisma.resource.count()
      ]);

      return NextResponse.json({ users, tenants, collections, resources });
    } else {
      // Normal user stats
      const tenantUsers = await prisma.tenantUser.findMany({
        where: { userId: user.id },
        select: { tenantId: true }
      });
      const tenantIds = tenantUsers.map(tu => tu.tenantId);

      const tenants = tenantIds.length;
      
      const collectionsCount = await prisma.collection.count({
        where: { tenantId: { in: tenantIds } }
      });

      const resourcesCount = await prisma.resource.count({
        where: { collection: { tenantId: { in: tenantIds } } }
      });

      return NextResponse.json({
        users: 1, // Just themselves
        tenants,
        collections: collectionsCount,
        resources: resourcesCount
      });
    }
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
