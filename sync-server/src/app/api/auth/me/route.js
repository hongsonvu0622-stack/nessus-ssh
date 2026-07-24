import { NextResponse } from 'next/server';
import { verifyAnyUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await verifyAnyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    });
  } catch (error) {
    console.error('Auth ME error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
