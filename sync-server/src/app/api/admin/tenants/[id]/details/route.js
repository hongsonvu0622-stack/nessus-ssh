import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin, verifyAnyUser } from '@/lib/auth';

export async function GET(request, context) {
  try {
    const user = await verifyAnyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const userMembership = tenant.users.find(u => u.user.id === user.id);
    if (!user.isSuperAdmin && !userMembership) {
      return NextResponse.json({ error: 'Forbidden. You do not have access to this tenant.' }, { status: 403 });
    }

    const responseData = {
      ...tenant,
      currentUserRole: userMembership ? userMembership.role : (user.isSuperAdmin ? 'SUPER_ADMIN' : null)
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Admin tenant details GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
