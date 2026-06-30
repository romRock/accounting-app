const INDIAN_TZ = 'Asia/Kolkata';

function formatYMDInTimeZone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

/** Normalize any stored entry date to YYYY-MM-DD in Indian timezone. */
export function normalizeEntryDateYMD(dateStr?: string | null): string {
  if (!dateStr) return '';

  const trimmed = String(dateStr).trim();
  if (!trimmed) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  if (trimmed.includes('T')) {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return formatYMDInTimeZone(parsed, INDIAN_TZ);
    }
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return '';
  return formatYMDInTimeZone(parsed, INDIAN_TZ);
}

export function getIndianTodayString(): string {
  return formatYMDInTimeZone(new Date(), INDIAN_TZ);
}

export function getEffectiveDateRange(
  filterByDate: boolean,
  dateFilter: string,
  isSelectingRange: boolean,
  startDate: string,
  endDate: string,
): { from: string; to: string } {
  const today = getIndianTodayString();

  if (!filterByDate) {
    return { from: today, to: today };
  }

  if (isSelectingRange) {
    if (startDate && endDate) {
      return startDate <= endDate
        ? { from: startDate, to: endDate }
        : { from: endDate, to: startDate };
    }
    if (startDate) return { from: startDate, to: startDate };
    if (endDate) return { from: endDate, to: endDate };
    return { from: today, to: today };
  }

  return dateFilter ? { from: dateFilter, to: dateFilter } : { from: today, to: today };
}

export function isDateWithinRange(
  dateStr: string | undefined | null,
  range: { from: string; to: string },
): boolean {
  const normalized = normalizeEntryDateYMD(dateStr);
  if (!normalized) return false;
  return normalized >= range.from && normalized <= range.to;
}

export function matchesDateFilter(
  dateStr: string | undefined | null,
  filterByDate: boolean,
  dateFilter: string,
  isSelectingRange: boolean,
  startDate: string,
  endDate: string,
): boolean {
  const range = getEffectiveDateRange(
    filterByDate,
    dateFilter,
    isSelectingRange,
    startDate,
    endDate,
  );
  return isDateWithinRange(dateStr, range);
}

/** API params for module pages: empty when date filter is off (backend defaults to today for transactions). */
export function getFetchDateRange(
  filterByDate: boolean,
  dateFilter: string,
  isSelectingRange: boolean,
  startDate: string,
  endDate: string,
): { dateFrom?: string; dateTo?: string } {
  if (!filterByDate) {
    return {};
  }

  const { from, to } = getEffectiveDateRange(
    true,
    dateFilter,
    isSelectingRange,
    startDate,
    endDate,
  );
  return { dateFrom: from, dateTo: to };
}

/** Reports: always send explicit date range (today when filter is off). */
export function getReportFetchDateRange(
  filterByDate: boolean,
  dateFilter: string,
  isSelectingRange: boolean,
  startDate: string,
  endDate: string,
): { dateFrom: string; dateTo: string } {
  const { from, to } = getEffectiveDateRange(
    filterByDate,
    dateFilter,
    isSelectingRange,
    startDate,
    endDate,
  );
  return { dateFrom: from, dateTo: to };
}
