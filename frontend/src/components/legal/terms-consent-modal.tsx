'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { hasAcceptedCurrentTerms, saveTermsConsent } from '@/lib/legal/terms-consent';
import { APP_NAME } from '@/lib/app-branding';

/**
 * One-time Terms consent gate.
 * Re-prompts only when TERMS_VERSION changes.
 *
 * Future:
 * - Cookie Consent Banner
 * - Analytics Consent
 * - Marketing Consent
 */
export default function TermsConsentModal() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setOpen(!hasAcceptedCurrentTerms());
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200000] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-consent-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-amber-200/60 bg-white p-6 shadow-2xl shadow-amber-900/10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700/80">
          {APP_NAME}
        </p>
        <h2 id="terms-consent-title" className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
          Terms &amp; Conditions
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Before using this software you must read and accept the Terms &amp; Conditions.
        </p>

        <Link
          href="/terms"
          className="mt-3 inline-flex text-sm font-medium text-amber-800 underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read Terms &amp; Conditions
        </Link>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-amber-700 focus:ring-amber-500"
          />
          <span className="text-sm text-slate-700">
            I have read and agree to the Terms &amp; Conditions.
          </span>
        </label>

        <button
          type="button"
          disabled={!checked}
          onClick={() => {
            saveTermsConsent();
            setOpen(false);
          }}
          className="mt-5 flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white transition enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Agree &amp; Continue
        </button>
      </div>
    </div>
  );
}
