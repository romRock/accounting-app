/**
 * Client-side input security — mirrors backend checks; does not change API payloads.
 */

const MAX_STRING_LENGTH = 100_000;

const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

const XSS_PATTERNS: RegExp[] = [
  /<script[\s>]/i,
  /<\/script>/i,
  /<iframe[\s>]/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /\bon\w+\s*=/i,
  /\beval\s*\(/i,
];

const SQL_INJECTION_PATTERNS: RegExp[] = [
  /'\s*or\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /\bor\s+1\s*=\s*1\b/i,
  /\bunion\s+select\b/i,
  /\bdrop\s+table\b/i,
  /;\s*--/,
];

function matchesAnyPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

export function containsMaliciousInput(value: string): boolean {
  if (typeof value !== 'string') return true;
  if (value.length > MAX_STRING_LENGTH) return true;
  if (CONTROL_CHAR_PATTERN.test(value)) return true;
  if (matchesAnyPattern(value, XSS_PATTERNS)) return true;
  if (matchesAnyPattern(value, SQL_INJECTION_PATTERNS)) return true;
  return false;
}

function scanValue(value: unknown, depth = 0): boolean {
  if (depth > 16) return true;
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return containsMaliciousInput(value);
  if (typeof value === 'number' || typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.some((item) => scanValue(item, depth + 1));
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((item) =>
      scanValue(item, depth + 1)
    );
  }
  return true;
}

/** Throws if any string in the payload looks malicious. */
export function assertSafePayload(payload: unknown, label = 'input'): void {
  if (scanValue(payload)) {
    throw new Error(`Invalid ${label}. Remove disallowed characters and try again.`);
  }
}

/** Escape text for safe HTML insertion (e.g. print/export). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
