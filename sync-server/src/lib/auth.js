import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey-nexusssh';

export function verifyAuth(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function verifySuperAdmin(request) {
  const decoded = verifyAuth(request);
  if (!decoded) return null;

  try {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    if (!user || !user.isSuperAdmin) return null;
    return user;
  } catch (err) {
    console.error('verifySuperAdmin error:', err);
    return null;
  }
}

export async function verifyAnyUser(request) {
  const decoded = verifyAuth(request);
  if (!decoded) return null;

  try {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    if (!user) return null;
    return user;
  } catch (err) {
    console.error('verifyAnyUser error:', err);
    return null;
  }
}
