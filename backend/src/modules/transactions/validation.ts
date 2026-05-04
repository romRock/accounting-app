import { z } from 'zod';

export const createTransactionSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().optional(),
  centerId: z.string().min(1, 'Center is required'),
  amount: z.number().positive('Amount must be positive'),
  amountType: z.enum(['CASH', 'CREDIT']),
  autoCommission: z.boolean().default(true),
  commission: z.number().min(0).optional(),
  bookingCommission: z.number().min(0).optional(),
  centerCommission: z.number().min(0).optional(),
  receiverName: z.string().min(1, 'Receiver name is required'),
  receiverNumber: z.string().optional(),
  senderName: z.string().min(1, 'Sender name is required'),
  senderNumber: z.string().optional(),
  receiverClientId: z.string().optional(),
  senderClientId: z.string().optional(),
  remark: z.string().optional(),
  type: z.enum(['INWARD', 'OUTWARD']).default('OUTWARD'),
});

export const updateTransactionSchema = z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  centerId: z.string().optional(),
  amount: z.number().positive().optional(),
  amountType: z.enum(['CASH', 'CREDIT']).optional(),
  autoCommission: z.boolean().optional(),
  commission: z.number().min(0).optional(),
  bookingCommission: z.number().min(0).optional(),
  centerCommission: z.number().min(0).optional(),
  receiverName: z.string().optional(),
  receiverNumber: z.string().optional(),
  senderName: z.string().optional(),
  senderNumber: z.string().optional(),
  receiverClientId: z.string().optional(),
  senderClientId: z.string().optional(),
  remark: z.string().optional(),
  status: z.boolean().optional(),
  type: z.enum(['INWARD', 'OUTWARD']).optional(),
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
