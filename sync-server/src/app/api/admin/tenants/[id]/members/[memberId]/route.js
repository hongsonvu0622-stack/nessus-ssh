import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAnyUser } from '@/lib/auth';

export async function DELETE(request, context) {
  try {
    const user = await verifyAnyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: tenantId, memberId } = await context.params;

    // Check permissions: Must be SUPER_ADMIN, or OWNER/ADMIN in this tenant
    let hasPermission = false;
    let currentUserRole = null;

    if (user.isSuperAdmin) {
      hasPermission = true;
      currentUserRole = 'SUPER_ADMIN';
    } else {
      const currentMembership = await prisma.tenantUser.findUnique({
        where: {
          tenantId_userId: { tenantId, userId: user.id }
        }
      });
      if (currentMembership && (currentMembership.role === 'OWNER' || currentMembership.role === 'ADMIN')) {
        hasPermission = true;
        currentUserRole = currentMembership.role;
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden. You do not have permission to remove members from this tenant.' }, { status: 403 });
    }

    // Find the membership to delete
    const targetMembership = await prisma.tenantUser.findUnique({
      where: { id: memberId }
    });

    if (!targetMembership) {
      return NextResponse.json({ error: 'Membership not found.' }, { status: 404 });
    }

    if (targetMembership.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Membership does not belong to this tenant.' }, { status: 400 });
    }

    if (targetMembership.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove the OWNER of the tenant.' }, { status: 400 });
    }

    // Only OWNER or SUPER_ADMIN can remove ADMINs
    if (targetMembership.role === 'ADMIN' && currentUserRole === 'ADMIN') {
      return NextResponse.json({ error: 'Admins cannot remove other Admins. Only the Owner can do this.' }, { status: 403 });
    }

    // Remove user from the tenant
    await prisma.tenantUser.delete({
      where: { id: memberId }
    });

    // We should also remove them from any Collections in this tenant, but Prisma Cascade might not handle that automatically since CollectionUser is linked to user and collection, not TenantUser.
    // Let's manually remove them from all collections in this tenant
    const collectionsInTenant = await prisma.collection.findMany({
      where: { tenantId },
      select: { id: true }
    });
    const collectionIds = collectionsInTenant.map(c => c.id);

    if (collectionIds.length > 0) {
      await prisma.collectionUser.deleteMany({
        where: {
          userId: targetMembership.userId,
          collectionId: { in: collectionIds }
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
