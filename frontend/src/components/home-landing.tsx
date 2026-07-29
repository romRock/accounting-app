'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AppLogo } from '@/components/app-logo';
import {
  APP_NAME,
  APP_TAGLINE,
  RESOURCE_ANDROID_APK,
  RESOURCE_MANUAL_PDF,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_PHONE_TEL,
  WHATSAPP_CHAT_URL,
  WHATSAPP_CONTACT_URL,
} from '@/lib/app-branding';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  MessageCircle,
  Phone,
  Scale,
} from 'lucide-react';

const FEATURES = [
  {
    icon: BookOpenCheck,
    title: 'Client ledgers & credit',
    text: 'Live balances across booking, accounting, hawala, and special entries — one clear client view.',
  },
  {
    icon: Building2,
    title: 'Multi-branch teams',
    text: 'Branch-scoped users work together; Super Admin sees everything in one place.',
  },
  {
    icon: Scale,
    title: 'Reports that match the books',
    text: 'Customer report, day totals, and balance sheet stay aligned with ledger rules you already use.',
  },
] as const;

/** Classic red PDF document mark */
function PdfFileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path
        fill="#ffffff"
        d="M10 4h20l10 10v30a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
      />
      <path fill="#fecaca" d="M30 4v8a2 2 0 0 0 2 2h8L30 4z" />
      <rect x="8" y="28" width="32" height="12" rx="2" fill="#DC2626" />
      <text
        x="24"
        y="37"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="9"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        PDF
      </text>
      <path
        fill="none"
        stroke="#f87171"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M14 14h12M14 19h16M14 24h10"
      />
    </svg>
  );
}

/** Android APK-style mark (robot head) */
function ApkFileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="20" fill="#111827" />
      <path
        fill="#F97316"
        d="M16.2 18.5 13 13.2a1.2 1.2 0 0 1 2-1.3l3.4 5.5a11.5 11.5 0 0 1 11.2 0l3.4-5.5a1.2 1.2 0 1 1 2 1.3l-3.2 5.3A11.8 11.8 0 0 1 35.8 28H12.2a11.8 11.8 0 0 1 4-9.5Z"
      />
      <circle cx="18.5" cy="23.5" r="1.7" fill="#111827" />
      <circle cx="29.5" cy="23.5" r="1.7" fill="#111827" />
      <rect x="10" y="29.5" width="4.2" height="8" rx="2.1" fill="#F97316" />
      <rect x="33.8" y="29.5" width="4.2" height="8" rx="2.1" fill="#F97316" />
      <text
        x="24"
        y="40.5"
        textAnchor="middle"
        fill="#F97316"
        fontSize="6.5"
        fontWeight="800"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="0.5"
      >
        APK
      </text>
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-1.24.241a1.54.54 0 01-1.745-1.335l-.016-.1.241-1.24-.214-.361a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FabShell({
  ringClass,
  animated = false,
  children,
}: {
  ringClass: string;
  animated?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center sm:h-[5.25rem] sm:w-[5.25rem]">
      {animated && (
        <>
          <span
            className={`home-wa-ring pointer-events-none absolute inset-0 rounded-full border-2 ${ringClass}`}
            aria-hidden
          />
          <span
            className={`home-wa-ring-delay pointer-events-none absolute inset-0 rounded-full border-2 ${ringClass} opacity-70`}
            aria-hidden
          />
        </>
      )}
      {children}
    </div>
  );
}

export default function HomeLanding() {
  return (
    <div className="home-page-root relative overflow-x-hidden">
      <div className="home-page-bg pointer-events-none fixed inset-0" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-black/75 via-slate-950/80 to-black/90"
        aria-hidden
      />
      <div
        className="home-glow-orb pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-600/25 blur-3xl"
        aria-hidden
      />
      <div
        className="home-glow-orb pointer-events-none absolute -right-16 bottom-32 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-4 pb-28 pt-5 sm:px-6 sm:pb-24 sm:pt-8">
        {/* Top bar */}
        <header className="home-anim-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="text-sm font-bold uppercase tracking-wider text-blue-50 sm:text-lg">
              {APP_NAME}
            </span>
          </div>
          <Link
            href="/login"
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-5 text-sm font-semibold text-white shadow-[0_14px_40px_-14px_rgba(37,99,235,0.7)] transition hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600 sm:min-w-[140px]"
          >
            Login
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </header>

        {/* Hero — brand first */}
        <section className="mt-10 flex flex-1 flex-col justify-center sm:mt-14">
          <div className="home-anim-1 home-float mx-auto mb-5 flex justify-center sm:mb-6">
            <AppLogo
              width={220}
              height={220}
              className="h-20 w-40 object-cover drop-shadow-[0_12px_36px_rgba(37,99,235,0.35)] sm:h-40 sm:w-60"
              priority
            />
          </div>

          <div className="home-anim-1 text-center">
            <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
              {APP_TAGLINE}
              <span className="block text-blue-200/90">built for daily credit work</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Track client credit, bookings, and branch books in one calm workspace — fast entry,
              clear ledgers, reports you can trust.
            </p>
          </div>

          <div className="home-anim-2 mt-7 flex flex-col items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-blue-400/40 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 text-sm font-semibold text-white shadow-[0_14px_40px_-14px_rgba(37,99,235,0.7)] transition hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600 sm:min-w-[160px]"
            >
              Login
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <a
              href={WHATSAPP_CHAT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-950/45 px-6 text-sm font-semibold text-emerald-100 backdrop-blur-md transition hover:border-emerald-300/55 hover:bg-emerald-900/55 sm:min-w-[200px]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Start your 15-day trial
            </a>
          </div>
        </section>

        {/* Features / use cases */}
        <section className="home-anim-3 mt-12 sm:mt-16" aria-labelledby="home-features-heading">
          <h2 id="home-features-heading" className="sr-only">
            Product features
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-4 py-4 backdrop-blur-md"
              >
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-500/10 text-blue-300">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400 sm:text-[13px]">{text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section
          className="home-anim-3 mt-10 rounded-2xl border border-slate-500/25 bg-black/35 px-4 py-5 backdrop-blur-md sm:mt-12 sm:px-6"
          aria-labelledby="home-contact-heading"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="home-contact-heading" className="text-sm font-semibold text-white sm:text-base">
                Talk to us
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Questions or trial setup — call or WhatsApp directly.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={`tel:${SUPPORT_PHONE_TEL}`}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-950/40 px-3.5 py-2.5 text-sm font-medium text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-900/50"
              >
                <Phone className="h-4 w-4" aria-hidden />
                {SUPPORT_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </section>

        <footer className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-medium text-slate-500 sm:text-xs">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <Link
            href="/terms"
            className="text-[10px] font-medium text-slate-400 underline-offset-4 transition hover:text-amber-200 hover:underline sm:text-xs"
          >
            Terms &amp; Conditions
          </Link>
        </footer>
      </div>

      {/* Floating resources — bottom left (static) */}
      <div className="fixed bottom-5 left-4 z-50 flex flex-col-reverse items-center gap-4 sm:bottom-7 sm:left-6 sm:gap-5">
        <FabShell ringClass="border-red-500/80">
          <a
            href={RESOURCE_MANUAL_PDF}
            download="CCT-Learning-Manual.pdf"
            title="Download PDF learning manual — how to use Client Credit Tracker"
            aria-label="Download PDF learning manual"
            className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white ring-2 ring-red-300/50 transition hover:bg-red-500 sm:h-[4.5rem] sm:w-[4.5rem]"
          >
            <PdfFileIcon className="h-9 w-9 drop-shadow-sm sm:h-10 sm:w-10" />
            <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden w-max max-w-[200px] -translate-y-1/2 rounded-lg border border-white/15 bg-slate-950/95 px-2.5 py-1.5 text-[11px] text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100 sm:block">
              Learning Manual (PDF)
            </span>
          </a>
        </FabShell>

        <FabShell ringClass="border-orange-500/85">
          <a
            href={RESOURCE_ANDROID_APK}
            download="CCT.apk"
            title="Download Android APK — mobile-friendly Client Credit Tracker"
            aria-label="Download Android APK"
            className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-black text-orange-400 ring-[3px] ring-orange-500 transition hover:bg-zinc-900 hover:ring-orange-400 sm:h-[4.5rem] sm:w-[4.5rem]"
          >
            <ApkFileIcon className="h-10 w-10 sm:h-11 sm:w-11" />
            <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 hidden w-max max-w-[200px] -translate-y-1/2 rounded-lg border border-white/15 bg-slate-950/95 px-2.5 py-1.5 text-[11px] text-slate-100 opacity-0 shadow-lg transition group-hover:opacity-100 sm:block">
              Android App (APK)
            </span>
          </a>
        </FabShell>
      </div>

      {/* Floating WhatsApp — bottom right (animated highlight) */}
      <div className="fixed bottom-5 right-4 z-50 sm:bottom-7 sm:right-6">
        <FabShell ringClass="border-emerald-400/70" animated>
          <a
            href={WHATSAPP_CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Chat on WhatsApp — get help or start your trial"
            aria-label="Chat on WhatsApp"
            className="home-wa-fab relative flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white transition hover:bg-[#1ebe57] sm:h-[4.5rem] sm:w-[4.5rem]"
          >
            <WhatsAppIcon className="h-8 w-8 sm:h-9 sm:w-9" />
          </a>
        </FabShell>
      </div>
    </div>
  );
}
