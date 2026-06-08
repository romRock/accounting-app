import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number | string,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(num);
  return formatted.replace(/^₹(?!\s)/, '₹ ');
}

export function formatDate(date: string | Date | null | undefined, fallback = '-'): string {
  if (date == null || date === '') return fallback;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(date: string | Date | null | undefined, fallback = '-'): string {
  if (date == null || date === '') return fallback;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatTime(time: string | Date): string {
  const d = typeof time === 'string' ? new Date(time) : time;
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata'
  }).format(d);
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/** Match search term against any table cell value (same behavior as transactions page). */
export function matchesTableSearch(
  searchTerm: string,
  ...values: Array<string | number | null | undefined | boolean>
): boolean {
  if (!searchTerm) return true;
  const searchLower = searchTerm.toLowerCase();
  return values.some((value) => {
    if (value == null || value === '') return false;
    return String(value).toLowerCase().includes(searchLower);
  });
}

/** True when a record was edited after initial creation (uses timestamps from API). */
export function isEntryUpdated(
  createdAt?: string | null,
  updatedAt?: string | null,
  thresholdMs = 5000,
): boolean {
  if (!createdAt || !updatedAt) return false;
  const created = new Date(createdAt).getTime();
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(created) || Number.isNaN(updated)) return false;
  return updated - created > thresholdMs;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
