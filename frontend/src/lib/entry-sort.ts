export function getEntryTimeMs(date?: string, time?: string): number {
  if (time) {
    const parsedTime = new Date(time);
    if (!isNaN(parsedTime.getTime())) return parsedTime.getTime();
  }

  if (date) {
    const parsedDate = new Date(date);
    if (!isNaN(parsedDate.getTime())) return parsedDate.getTime();
  }

  return 0;
}

export function compareEntriesByTimeAsc(
  a: { date?: string; time?: string },
  b: { date?: string; time?: string }
): number {
  return getEntryTimeMs(a.date, a.time) - getEntryTimeMs(b.date, b.time);
}

export function compareEntriesByTimeDesc(
  a: { date?: string; time?: string },
  b: { date?: string; time?: string }
): number {
  return getEntryTimeMs(b.date, b.time) - getEntryTimeMs(a.date, a.time);
}
