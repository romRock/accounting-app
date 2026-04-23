import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

export const generateTokens = (user: any & { role: any; branch?: any }) => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
    ) as JWTPayload;
    
    return decoded;
  } catch (error) {
    return null;
  }
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

  // Apply min/max constraints
  if (minAmount && commission < minAmount) {
    commission = minAmount;
  }
  if (maxAmount && commission > maxAmount) {
    commission = maxAmount;
  }

  return commission;
};
