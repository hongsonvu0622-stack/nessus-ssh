import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

export async function GET(request) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const [users, tenants, collections, resources] = await Promise.all([
      prisma.user.count(),
      prisma.tenant.count(),
      prisma.collection.count(),
      prisma.resource.count()
    ]);

    return NextResponse.json({
      users,
      tenants,
      collections,
      resources
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
