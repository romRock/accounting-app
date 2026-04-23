import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
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
