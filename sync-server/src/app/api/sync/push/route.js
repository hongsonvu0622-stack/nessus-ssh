import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey-nexusssh');

    const body = await request.json();
    const { collectionId, resources } = body;

    if (!collectionId || !resources || !Array.isArray(resources)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Upsert all resources
    const results = [];
    for (const res of resources) {
      if (!res.id || !res.type || !res.encPayload) continue;
      
      const record = await prisma.resource.upsert({
        where: { id: res.id },
        update: {
          encPayload: res.encPayload,
          type: res.type,
          name: res.name || 'Unknown Resource',
          collectionId
        },
        create: {
          id: res.id,
          collectionId,
          type: res.type,
          name: res.name || 'Unknown Resource',
          encPayload: res.encPayload
        }
      });
      results.push(record.id);
    }

    return NextResponse.json({ success: true, pushed: results.length });
  } catch (error) {
    console.error('Push error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
