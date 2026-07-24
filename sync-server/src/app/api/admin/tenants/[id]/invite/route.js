import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAnyUser } from '@/lib/auth';

export async function POST(request, context) {
  try {
    const user = await verifyAnyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tenantId } = await context.params;
    const body = await request.json();
    const { email, role } = body;

    if (!email || !role || !['ADMIN', 'MEMBER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid email or role (ADMIN or MEMBER required)' }, { status: 400 });
    }

    // Check permissions: Must be SUPER_ADMIN, or OWNER/ADMIN in this tenant
    let hasPermission = false;
    if (user.isSuperAdmin) {
      hasPermission = true;
    } else {
      const membership = await prisma.tenantUser.findUnique({
        where: {
          tenantId_userId: { tenantId, userId: user.id }
        }
      });
      if (membership && (membership.role === 'OWNER' || membership.role === 'ADMIN')) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to invite members to this tenant.' }, { status: 403 });
    }

    // Find the user by email
    const invitedUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!invitedUser) {
      return NextResponse.json({ error: 'Người dùng này chưa đăng ký tài khoản trên hệ thống.' }, { status: 404 });
    }

    // Check if the user is already in the tenant
    const existingMembership = await prisma.tenantUser.findUnique({
      where: {
        tenantId_userId: { tenantId, userId: invitedUser.id }
      }
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'Người dùng này đã là thành viên của Tenant.' }, { status: 400 });
    }

    // Add user to the tenant
    const newMembership = await prisma.tenantUser.create({
      data: {
        tenantId,
        userId: invitedUser.id,
        role
      }
    });

    return NextResponse.json({ success: true, message: 'Invited successfully', membership: newMembership });
  } catch (error) {
    console.error('Invite to tenant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
