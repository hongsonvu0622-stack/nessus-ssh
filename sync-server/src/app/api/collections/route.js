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
    const { tenantId, name, type } = body;

    if (!tenantId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const collection = await prisma.collection.create({
      data: {
        tenantId,
        name,
        type: type || 'SHARED'
      }
    });

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Create collection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
