const INDIAN_TZ = 'Asia/Kolkata';

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
    timeZone: INDIAN_TZ,
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

/** Normalize any stored/API date to YYYY-MM-DD in Indian timezone. */
export function toIndianDateString(dateInput?: string | Date | null): string {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const isoPrefix = dateInput.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoPrefix && !dateInput.includes('T') && !dateInput.includes(':')) {
      return isoPrefix[1];
    }
  }

  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      return dateInput.slice(0, 10);
    }
    return '';
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: INDIAN_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/** Client-side date filter — when filterByDate is false, entries pass (API already scoped to today). */
export function matchesIndianDateFilter(
  dateInput: string | Date | undefined | null,
  filterByDate: boolean,
  dateFilter: string,
  isSelectingRange: boolean,
  startDate: string,
  endDate: string
): boolean {
  if (!filterByDate) {
    return true;
  }

  const entryDate = toIndianDateString(dateInput);
  if (!entryDate) return false;

  if (isSelectingRange && startDate && endDate) {
    return entryDate >= startDate && entryDate <= endDate;
  }

  return dateFilter ? entryDate === dateFilter : true;
}

/** Check if a date falls within an inclusive from/to range (YYYY-MM-DD). */
export function isIndianDateInRange(
  dateInput: string | Date | undefined | null,
  dateFrom: string,
  dateTo: string
): boolean {
  const entryDate = toIndianDateString(dateInput);
  if (!entryDate) return false;
  return entryDate >= dateFrom && entryDate <= dateTo;
}
