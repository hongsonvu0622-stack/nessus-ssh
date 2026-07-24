import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey-nexusssh';

export async function POST(request) {
  try {
    const { email, password, publicKey, encPrivateKey } = await request.json();

    if (!email || !password || !publicKey || !encPrivateKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        publicKey,
        encPrivateKey,
        tenants: {
          create: {
            role: 'OWNER',
            tenant: {
              create: {
                name: 'Personal Workspace',
                collections: {
                  create: {
                    name: 'Personal Collection',
                    type: 'PERSONAL'
                  }
                }
              }
            }
          }
        }
      },
      include: {
        tenants: {
          include: {
            tenant: {
              include: { collections: true }
            }
          }
        }
      }
    });

    const personalCollection = user.tenants[0].tenant.collections[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return NextResponse.json({ token, userId: user.id, personalCollectionId: personalCollection.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
