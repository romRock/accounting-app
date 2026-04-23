import { z } from 'zod';

export const reportFiltersSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  fromCityId: z.string().optional(),
  toCityId: z.string().optional(),
  partyId: z.string().optional(),
  userId: z.string().optional(),
  branchId: z.string().optional(),
  accountType: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export const validateReportFilters = (req: any, res: any, next: any) => {
  try {
    reportFiltersSchema.parse(req.query);
    next();
  } catch (error) {
    next(error);
  }
};
