import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin, verifyAnyUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await verifyAnyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const whereClause = user.isSuperAdmin ? {} : {
      users: {
        some: { userId: user.id }
      }
    };

    const tenants = await prisma.tenant.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { users: true, collections: true }
        },
        users: {
          include: {
            user: { select: { email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Admin tenants error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const { name } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Tenant name is required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.create({
      data: { name }
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error) {
    console.error('Admin tenants POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
