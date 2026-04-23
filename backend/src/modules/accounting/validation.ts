import { z } from 'zod';

export const createLedgerEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  accountId: z.string().min(1, 'Account ID is required'),
  accountType: z.string().min(1, 'Account type is required'),
  description: z.string().min(1, 'Description is required'),
  debitAmount: z.number().nonnegative().optional(),
  creditAmount: z.number().nonnegative().optional(),
  transactionId: z.string().optional(),
});

export const updateLedgerEntrySchema = z.object({
  date: z.string().optional(),
  accountId: z.string().optional(),
  accountType: z.string().optional(),
  description: z.string().optional(),
  debitAmount: z.number().nonnegative().optional(),
  creditAmount: z.number().nonnegative().optional(),
});

export const validateCreateLedgerEntry = (req: any, res: any, next: any) => {
  try {
    createLedgerEntrySchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};

export const validateUpdateLedgerEntry = (req: any, res: any, next: any) => {
  try {
    updateLedgerEntrySchema.parse(req.body);
    next();
  } catch (error) {
    next(error);
  }
};
