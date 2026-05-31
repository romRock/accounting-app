// Centralized API configuration
// Single backend source of truth (VPS in production, localhost in development).
// Both environments talk to the same backend/database via NEXT_PUBLIC_API_URL.
import { assertSafePayload } from './security';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** JSON.stringify after rejecting XSS/SQLi patterns — same payload shape when input is valid. */
export function safeJsonStringify(payload: unknown): string {
  assertSafePayload(payload);
  return JSON.stringify(payload);
}

export default API_BASE_URL;
