import { z } from 'zod';
import { isSafeInputString } from '../../utils/inputSecurity';

const safeString = (message: string) =>
  z.string().refine(isSafeInputString, { message });

export const loginSchema = z.object({
  email: safeString('Invalid email address')
    .max(254, 'Invalid email address')
    .pipe(z.string().email('Invalid email address')),
  password: safeString('Password must be at least 6 characters')
    .min(6, 'Password must be at least 6 characters')
    .max(256, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: safeString('Refresh token is required')
    .min(1, 'Refresh token is required')
    .max(4096, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export const validateLogin = (req: any, res: any, next: any) => {
  try {
    loginSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateRefreshToken = (req: any, res: any, next: any) => {
  try {
    refreshTokenSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
