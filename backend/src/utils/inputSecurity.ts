/**
 * Input security utilities — detection only; does not mutate request payloads.
 */

const MAX_STRING_LENGTH = 100_000;

/** Dangerous object keys (prototype pollution). */
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/** Control / null bytes that should not appear in user text. */
const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

const XSS_PATTERNS: RegExp[] = [
  /<script[\s>]/i,
  /<\/script>/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon\w+\s*=/i,
  /document\.(cookie|write)/i,
  /window\.location/i,
  /\.innerHTML\s*=/i,
  /\beval\s*\(/i,
  /expression\s*\(/i,
];

const SQL_INJECTION_PATTERNS: RegExp[] = [
  /'\s*or\s+['"]?\d+['"]?\s*=\s*['"]?\d+/i,
  /'\s*or\s+['"]?1['"]?\s*=\s*['"]?1/i,
  /\bor\s+1\s*=\s*1\b/i,
  /\bunion\s+all\s+select\b/i,
  /\bunion\s+select\b/i,
  /\bselect\s+.+\s+from\b/i,
  /\binsert\s+into\b/i,
  /\bupdate\s+.+\s+set\b/i,
  /\bdelete\s+from\b/i,
  /\bdrop\s+(table|database|schema)\b/i,
  /\btruncate\s+table\b/i,
  /\bexec(\s|ute\b|\()/i,
  /\bxp_\w+/i,
  /;\s*--/,
  /\/\*[\s\S]*?\*\//,
];

const PATH_TRAVERSAL_PATTERN = /(?:\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e%5c)/i;

function matchesAnyPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

/**
 * Returns true when the string looks safe for storage/display (no mutation).
 */
export function isSafeInputString(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length > MAX_STRING_LENGTH) return false;
  if (CONTROL_CHAR_PATTERN.test(value)) return false;
  if (matchesAnyPattern(value, XSS_PATTERNS)) return false;
  if (matchesAnyPattern(value, SQL_INJECTION_PATTERNS)) return false;
  return true;
}

export function isSafePathSegment(value: string): boolean {
  if (typeof value !== 'string' || value.length > 512) return false;
  if (CONTROL_CHAR_PATTERN.test(value)) return false;
  if (PATH_TRAVERSAL_PATTERN.test(value)) return false;
  if (matchesAnyPattern(value, XSS_PATTERNS)) return false;
  if (matchesAnyPattern(value, SQL_INJECTION_PATTERNS)) return false;
  return true;
}

export type InputScanResult = { location: string } | null;

function scanString(
  value: string,
  location: string,
  options?: { checkPathTraversal?: boolean }
): InputScanResult {
  if (value.length > MAX_STRING_LENGTH) {
    return { location };
  }
  if (CONTROL_CHAR_PATTERN.test(value)) {
    return { location };
  }
  if (options?.checkPathTraversal && PATH_TRAVERSAL_PATTERN.test(value)) {
    return { location };
  }
  if (matchesAnyPattern(value, XSS_PATTERNS)) {
    return { location };
  }
  if (matchesAnyPattern(value, SQL_INJECTION_PATTERNS)) {
    return { location };
  }
  return null;
}

/**
 * Recursively scan request data without modifying it.
 */
export function scanInput(
  value: unknown,
  location = 'body',
  depth = 0
): InputScanResult {
  if (depth > 16) {
    return { location };
  }

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const checkPath = location.startsWith('params') || location.startsWith('query');
    return scanString(value, location, { checkPathTraversal: checkPath });
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return null;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = scanInput(value[i], `${location}[${i}]`, depth + 1);
      if (hit) return hit;
    }
    return null;
  }

  if (typeof value === 'object') {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (FORBIDDEN_KEYS.has(key)) {
        return { location: `${location}.${key}` };
      }
      const hit = scanInput(
        (value as Record<string, unknown>)[key],
        `${location}.${key}`,
        depth + 1
      );
      if (hit) return hit;
    }
    return null;
  }

  return { location };
}
