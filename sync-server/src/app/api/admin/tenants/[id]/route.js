import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySuperAdmin } from '@/lib/auth';

export async function DELETE(request, context) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;

    await prisma.tenant.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin tenants DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden. Super Admin access required.' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Tenant name is required' }, { status: 400 });
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: { name: body.name }
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (error) {
    console.error('Admin tenants PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
