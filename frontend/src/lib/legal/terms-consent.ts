/**
 * Terms & Conditions — versioned consent + metadata.
 *
 * Future:
 * - Cookie Consent Banner
 * - Analytics Consent
 * - Marketing Consent
 */

export const TERMS_VERSION = '1.0.0';
export const TERMS_EFFECTIVE_DATE = '29 July 2026';
export const TERMS_LAST_UPDATED = '29 July 2026';

/** LocalStorage keys — bump TERMS_VERSION to re-prompt acceptance */
export const TERMS_CONSENT_STORAGE_KEY = 'cct_terms_consent_v1';

export const TERMS_JURISDICTION_PLACEHOLDER =
  process.env.NEXT_PUBLIC_TERMS_JURISDICTION ||
  '[Appropriate courts as specified by the Software Owner]';

export const SOFTWARE_OWNER_NAME =
  process.env.NEXT_PUBLIC_SOFTWARE_OWNER || 'Romil Hingrajiya';

export type TermsConsentRecord = {
  version: string;
  acceptedAt: string;
  accepted: true;
};

export function getStoredTermsConsent(): TermsConsentRecord | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(TERMS_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TermsConsentRecord;
    if (!parsed?.accepted || !parsed.version) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasAcceptedCurrentTerms(): boolean {
  const stored = getStoredTermsConsent();
  return Boolean(stored && stored.version === TERMS_VERSION && stored.accepted);
}

export function saveTermsConsent(): TermsConsentRecord {
  const record: TermsConsentRecord = {
    version: TERMS_VERSION,
    acceptedAt: new Date().toISOString(),
    accepted: true,
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TERMS_CONSENT_STORAGE_KEY, JSON.stringify(record));
  }
  return record;
}
