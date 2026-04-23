import { z } from 'zod';

export const createTransactionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['INWARD', 'OUTWARD']),
  fromCityId: z.string().min(1, 'From city is required'),
  toCityId: z.string().min(1, 'To city is required'),
  partyId: z.string().min(1, 'Party is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentType: z.enum(['CASH', 'CREDIT']),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateTransactionSchema = z.object({
  date: z.string().optional(),
  type: z.enum(['INWARD', 'OUTWARD']).optional(),
  fromCityId: z.string().optional(),
  toCityId: z.string().optional(),
  partyId: z.string().optional(),
  amount: z.number().positive().optional(),
  paymentType: z.enum(['CASH', 'CREDIT']).optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
});

export const validateCreateTransaction = (req: any, res: any, next: any) => {
  try {
    createTransactionSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateTransaction = (req: any, res: any, next: any) => {
  try {
    updateTransactionSchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
