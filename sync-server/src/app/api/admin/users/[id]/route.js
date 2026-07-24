import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

export async function PUT(request, context) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    
    // Prevent changing your own admin status
    if (admin.id === id && body.isSuperAdmin === false) {
      return NextResponse.json({ error: 'You cannot remove your own admin privileges.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isSuperAdmin: body.isSuperAdmin }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Admin users PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;

    if (admin.id === id) {
      return NextResponse.json({ error: 'You cannot delete yourself.' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
