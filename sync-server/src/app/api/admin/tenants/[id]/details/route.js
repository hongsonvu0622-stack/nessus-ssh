import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

export async function GET(request, context) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, email: true, isSuperAdmin: true }
            }
          }
        },
        collections: {
          include: {
            resources: {
              select: {
                id: true,
                type: true,
                name: true,
                createdAt: true,
                updatedAt: true
                // Note: encPayload is intentionally omitted, we only send metadata to the admin portal
              }
            },
            users: {
              include: {
                user: {
                  select: { id: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Admin tenant details GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
