import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAnyUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await verifyAnyUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessRecords = await prisma.collectionUser.findMany({
      where: { userId: user.id },
      include: {
        collection: {
          include: { 
            resources: true,
            tenant: true
          }
        }
      }
    });

    return NextResponse.json(accessRecords);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
