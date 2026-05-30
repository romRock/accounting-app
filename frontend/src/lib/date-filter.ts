export function getFetchDateRange(
  filterByDate: boolean,
  dateFilter: string,
  isSelectingRange: boolean,
  startDate: string,
  endDate: string
): { dateFrom?: string; dateTo?: string } {
  if (!filterByDate) {
    return {};
  }

  if (isSelectingRange && startDate && endDate) {
    return { dateFrom: startDate, dateTo: endDate };
  }

  if (dateFilter) {
    return { dateFrom: dateFilter, dateTo: dateFilter };
  }

  return {};
}

export function getIndianTodayString(): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}
