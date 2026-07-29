'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Printer,
  Scale,
  Search,
} from 'lucide-react';
import { APP_NAME } from '@/lib/app-branding';
import {
  TERMS_BY_LANG,
  TERMS_META,
  type TermsLang,
} from '@/lib/legal/terms-content';
import { hasAcceptedCurrentTerms, saveTermsConsent } from '@/lib/legal/terms-consent';

const LANGS: TermsLang[] = ['en', 'hi', 'gu'];

export default function TermsPageView() {
  const [lang, setLang] = useState<TermsLang>('en');
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeId, setActiveId] = useState('acceptance');
  const [accepted, setAccepted] = useState(false);
  const doc = TERMS_BY_LANG[lang];

  useEffect(() => {
    setAccepted(hasAcceptedCurrentTerms());
  }, []);

  useEffect(() => {
    const ids = doc.sections.map((s) => s.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0.1, 0.25, 0.5] }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [doc.sections, lang]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return doc.sections;
    return doc.sections.filter((s) => {
      const blob = [s.title, ...s.paragraphs, ...(s.bullets || [])].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [doc.sections, query]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="terms-page min-h-[100dvh] bg-[#FAFAF8] text-slate-800 antialiased dark:bg-slate-950 dark:text-slate-100">
      <a
        href="#terms-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#FAFAF8]/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 print:static print:border-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-amber-300 hover:text-amber-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 print:hidden"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Home
            </Link>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800/80 dark:text-amber-400/90">
                {APP_NAME}
              </p>
              <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                Terms &amp; Conditions
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <div className="flex rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
              {LANGS.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition sm:px-3 sm:text-xs ${
                    lang === code
                      ? 'bg-slate-900 text-white dark:bg-amber-600'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                  }`}
                >
                  {TERMS_BY_LANG[code].langLabel}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-amber-300 sm:inline-flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              title={doc.printHint}
            >
              <Printer className="h-3.5 w-3.5" aria-hidden />
              Print
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* Sticky TOC */}
        <aside className="hidden print:hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {doc.tocTitle}
              </p>
              <nav className="mt-3 max-h-[60vh] space-y-1 overflow-y-auto pr-1 text-sm" aria-label="Table of contents">
                {doc.sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={`block w-full rounded-lg px-2.5 py-1.5 text-left transition ${
                      activeId === s.id
                        ? 'bg-amber-50 font-medium text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </nav>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              <p>
                {doc.versionLabel}: <span className="font-semibold text-slate-800 dark:text-slate-200">{TERMS_META.version}</span>
              </p>
              <p className="mt-1">
                {doc.effectiveLabel}: {TERMS_META.effectiveDate}
              </p>
              <p className="mt-1">{doc.readingTime}</p>
            </div>
          </div>
        </aside>

        <main id="terms-main" className="min-w-0 space-y-6">
          {/* Meta strip */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-7">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                <Scale className="h-3 w-3" aria-hidden />
                Legal
              </span>
              <span>
                {doc.versionLabel} {TERMS_META.version}
              </span>
              <span aria-hidden>·</span>
              <span>
                {doc.updatedLabel}: {TERMS_META.lastUpdated}
              </span>
              <span aria-hidden>·</span>
              <span>{doc.readingTime}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[15px]">
              {doc.intro}
            </p>

            <div className="relative mt-5 print:hidden">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={doc.searchPlaceholder}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none ring-amber-500/30 placeholder:text-slate-400 focus:border-amber-300 focus:bg-white focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </section>

          {/* Warning */}
          <section className="rounded-2xl border border-amber-300/70 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 p-5 shadow-sm dark:border-amber-800 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 sm:p-6">
            <div className="flex gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <h2 className="text-base font-semibold text-amber-950 dark:text-amber-100">
                  {doc.warningTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-amber-950/80 dark:text-amber-100/85">
                  {doc.warningBody}
                </p>
              </div>
            </div>
          </section>

          {/* Sections */}
          <div className="space-y-4">
            {filteredSections.map((section) => (
              <section
                key={section.id}
                id={section.id}
                className={`scroll-mt-28 rounded-2xl border bg-white p-5 shadow-sm shadow-slate-200/30 dark:bg-slate-900 dark:shadow-none sm:p-6 ${
                  section.highlight
                    ? 'border-amber-300/80 dark:border-amber-800'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-[15px]">
                  {section.paragraphs.map((p) => (
                    <p key={p.slice(0, 48)}>{p}</p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2 border-l-2 border-amber-200 pl-4 dark:border-amber-800">
                    {section.bullets.map((b) => (
                      <li key={b} className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
            {filteredSections.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">
                No matching sections.
              </p>
            )}
          </div>

          {/* FAQ accordion */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{doc.faqTitle}</h2>
            <div className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
              {doc.faq.map((item, idx) => {
                const open = openFaq === idx;
                return (
                  <div key={item.q} className="py-3">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : idx)}
                      className="flex w-full items-center justify-between gap-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100"
                      aria-expanded={open}
                    >
                      {item.q}
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                    {open && (
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bottom accept */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 print:hidden">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {accepted
                ? `You have accepted Terms version ${TERMS_META.version}.`
                : 'Accepting confirms you have read these Terms.'}
            </p>
            <button
              type="button"
              onClick={() => {
                saveTermsConsent();
                setAccepted(true);
              }}
              disabled={accepted}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition enabled:hover:bg-slate-800 disabled:cursor-default disabled:opacity-50 dark:bg-amber-600 dark:enabled:hover:bg-amber-500"
            >
              {accepted ? 'Accepted' : doc.acceptCta}
            </button>
          </section>

          <div className="flex justify-center pb-8 print:hidden">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-amber-800 hover:underline"
            >
              {doc.backToTop}
            </button>
          </div>
        </main>
      </div>

      <style jsx global>{`
        @media print {
          .terms-page header a,
          .terms-page .print\\:hidden {
            display: none !important;
          }
          .terms-page {
            background: white !important;
            color: black !important;
          }
          .terms-page section {
            break-inside: avoid;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}
