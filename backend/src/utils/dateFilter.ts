/**
 * Build a Prisma date filter for an inclusive YYYY-MM-DD range.
 * Uses gte start-of-day and lt day-after-end (mirrors default "today" filter).
 */
export function buildInclusiveDateRangeFilter(
  dateFrom?: string,
  dateTo?: string
): { gte?: Date; lt?: Date } | null {
  if (!dateFrom && !dateTo) return null;

  const filter: { gte?: Date; lt?: Date } = {};

  if (dateFrom) {
    filter.gte = new Date(dateFrom);
  }

  const endDateStr = dateTo || dateFrom;
  if (endDateStr) {
    const endExclusive = new Date(endDateStr);
    endExclusive.setDate(endExclusive.getDate() + 1);
    filter.lt = endExclusive;
  }

  return filter;
}
