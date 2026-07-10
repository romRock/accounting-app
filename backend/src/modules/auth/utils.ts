import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { getJwtSecret, getJwtRefreshSecret } from '../../config/secrets';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  sessionId: string;
}

export const generateTokens = (
  user: any & { role: any; branch?: any },
  sessionId: string
) => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    sessionId,
  };

  const accessToken = jwt.sign(payload, getJwtSecret(), { expiresIn: '3h' });

  const refreshToken = jwt.sign(payload, getJwtRefreshSecret(), { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, getJwtRefreshSecret()) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * True when this exact session is still active for this user.
 * Other users' sessions are never affected — only this userId + sessionId pair.
 * Re-login for the same user deletes their older sessions (see auth login).
 */
export const isCurrentUserSession = async (
  userId: string,
  sessionId: string
): Promise<boolean> => {
  if (!userId || !sessionId) return false;

  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId,
      isActive: true,
      isDeleted: false,
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });

  return session !== null;
};

export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8);
  return `TXN${timestamp}${random}`.toUpperCase();
};

export const calculateCommission = (
  amount: number,
  rate: number,
  rateType: 'PERCENTAGE' | 'FIXED',
  minAmount?: number,
  maxAmount?: number
): number => {
  let commission = 0;

  if (rateType === 'PERCENTAGE') {
    commission = (amount * rate) / 100;
  } else {
    commission = rate;
  }

  if (minAmount && commission < minAmount) {
    commission = minAmount;
  }
  if (maxAmount && commission > maxAmount) {
    commission = maxAmount;
  }

  return commission;
};
