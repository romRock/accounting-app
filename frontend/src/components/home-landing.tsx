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
  CheckCircle,
  Users,
  TrendingUp,
  Shield,
  Zap,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight as ArrowRightIcon,
} from 'lucide-react';
import { useState } from 'react';

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

const HOW_IT_WORKS_STEPS = [
  {
    step: '1',
    title: 'Add Clients',
    description: 'Add and organize client information with contact details and account setup.',
  },
  {
    step: '2',
    title: 'Record Credit Transactions',
    description: 'Record credit transactions when you provide goods or services to clients.',
  },
  {
    step: '3',
    title: 'Record Payments',
    description: 'Track payments made by clients to update their outstanding balances.',
  },
  {
    step: '4',
    title: 'Monitor Outstanding Balances',
    description: 'View real-time outstanding amounts for each client across all transaction types.',
  },
  {
    step: '5',
    title: 'Review Transaction History',
    description: 'Access complete historical account activity for accurate record-keeping.',
  },
] as const;

const WHY_CHOOSE_US = [
  {
    icon: CheckCircle,
    title: 'Organized Client Records',
    description: 'Centralized client information with easy access to account details and transaction history.',
  },
  {
    icon: TrendingUp,
    title: 'Easier Credit Tracking',
    description: 'Real-time outstanding balance tracking across booking, accounting, hawala, and special entries.',
  },
  {
    icon: Shield,
    title: 'Centralized Transaction History',
    description: 'Complete transaction records with proper categorization and easy search functionality.',
  },
  {
    icon: Zap,
    title: 'Simple Workflow',
    description: 'Intuitive interface designed for daily credit work with minimal training required.',
  },
] as const;

const USE_CASES = [
  {
    title: 'Small Businesses',
    description: 'Local shops and service providers who offer credit to regular customers.',
  },
  {
    title: 'Traders & Wholesalers',
    description: 'Businesses that sell products on credit to retailers and other businesses.',
  },
  {
    title: 'Retail Businesses',
    description: 'Stores that maintain customer accounts for credit purchases and payments.',
  },
  {
    title: 'Service Businesses',
    description: 'Service providers who track client credit for ongoing work and projects.',
  },
] as const;

const SEO_RESOURCES = [
  {
    title: 'Client Credit Management Guide',
    description: 'Learn the fundamentals of managing client credit effectively.',
    keyword: 'Client Credit Management',
  },
  {
    title: 'Credit Tracking Best Practices',
    description: 'Discover proven methods for accurate client credit tracking.',
    keyword: 'Client Credit Tracker',
  },
  {
    title: 'Customer Payment Tracking',
    description: 'Tools and techniques for tracking customer payments efficiently.',
    keyword: 'Customer Credit Tracking',
  },
  {
    title: 'Outstanding Payment Management',
    description: 'Strategies for managing and collecting outstanding payments.',
    keyword: 'Outstanding Payment Tracking',
  },
  {
    title: 'Business Credit Solutions',
    description: 'Comprehensive credit management for growing businesses.',
    keyword: 'Business Credit Management',
  },
  {
    title: 'Balance Tracking Systems',
    description: 'How to track customer outstanding balances accurately.',
    keyword: 'Customer Outstanding Balance',
  },
  {
    title: 'Transaction Recording',
    description: 'Best practices for recording credit transactions properly.',
    keyword: 'Credit Transaction Tracking',
  },
  {
    title: 'Client Account Organization',
    description: 'Methods for organizing and maintaining client accounts.',
    keyword: 'Client Account Management',
  },
  {
    title: 'Small Business Credit Tools',
    description: 'Essential tools for small business credit management.',
    keyword: 'Small Business Credit Tracking',
  },
  {
    title: 'Payment Monitoring',
    description: 'Effective systems for monitoring client payment tracking.',
    keyword: 'Client Payment Tracking',
  },
] as const;

const FAQ_ITEMS = [
  {
    question: 'What is Client Credit Tracker?',
    answer: 'Client Credit Tracker is a transaction and bookkeeping web application designed to help businesses manage client credit, track outstanding balances, record payments, and maintain organized transaction history across multiple branches.',
  },
  {
    question: 'Who can use Client Credit Tracker?',
    answer: 'Client Credit Tracker is suitable for small businesses, traders, wholesalers, retail businesses, and service providers who offer credit to their customers and need to track client balances and payments.',
  },
  {
    question: 'What can I track with Client Credit Tracker?',
    answer: 'You can track client credit transactions, payments, outstanding balances, transaction history, and manage multiple client accounts with comprehensive reporting capabilities.',
  },
  {
    question: 'Can I track client payments?',
    answer: 'Yes, Client Credit Tracker allows you to record and track payments made by clients, automatically updating their outstanding balances across all transaction types.',
  },
  {
    question: 'Can I view outstanding client balances?',
    answer: 'Yes, you can view real-time outstanding balances for each client, with consolidated views across booking, accounting, hawala, and special entries.',
  },
  {
    question: 'Can I view transaction history?',
    answer: 'Yes, Client Credit Tracker provides complete transaction history for each client, allowing you to review all past transactions and payments.',
  },
  {
    question: 'How does Client Credit Tracker work?',
    answer: 'Simply add clients, record credit transactions when you provide goods or services, track payments, and monitor outstanding balances. The system consolidates all data for easy reporting and analysis.',
  },
  {
    question: 'Is Client Credit Tracker suitable for small businesses?',
    answer: 'Yes, Client Credit Tracker is specifically designed for small businesses that need to manage client credit without complex accounting systems.',
  },
  {
    question: 'How can I get started?',
    answer: 'You can start a 15-day trial by contacting us via WhatsApp or phone. We will help you set up your account and guide you through the initial setup process.',
  },
  {
    question: 'How does pricing work?',
    answer: 'For the first 10 clients, the first payment is ₹25,000, then ₹15,000 yearly. After 10 clients, it will be ₹45,000 per user login.',
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

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border-b border-slate-700/50 last:border-0">
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between py-4 text-left transition hover:bg-slate-800/30 px-4 sm:px-6"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-white sm:text-base">{question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-slate-400" aria-hidden />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 sm:px-6">
          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HomeLanding() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

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

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-4 pb-28 pt-5 sm:px-6 sm:pb-24 sm:pt-8">
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

        {/* Product Introduction */}
        <section className="mt-16 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-20 sm:px-8 sm:py-10" aria-labelledby="product-intro-heading">
          <h2 id="product-intro-heading" className="mb-4 text-xl font-semibold text-white sm:mb-6 sm:text-2xl">
            What is Client Credit Tracker?
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            <p>
              Client Credit Tracker is a comprehensive transaction and bookkeeping web application designed specifically for businesses that manage client credit accounts. It provides a centralized platform to track client credit, record transactions, monitor outstanding balances, and maintain organized payment history.
            </p>
            <p>
              The application helps businesses streamline their credit management process by digitizing manual record-keeping, reducing errors, and providing real-time visibility into client accounts. Whether you run a small retail shop, a wholesale business, or a service-based company, Client Credit Tracker adapts to your credit tracking needs.
            </p>
            <p>
              With features like multi-branch support, comprehensive transaction history, and detailed reporting, Client Credit Tracker serves as a complete solution for businesses that need to maintain accurate client credit records without the complexity of traditional accounting software.
            </p>
          </div>
        </section>

        {/* What Is Client Credit Management */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="credit-mgmt-heading">
          <h2 id="credit-mgmt-heading" className="mb-4 text-xl font-semibold text-white sm:mb-6 sm:text-2xl">
            What Is Client Credit Management?
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            <p>
              Client credit management is the process of tracking and managing credit extended to customers or clients. When a business provides goods or services on credit, it creates a receivable that needs to be tracked until payment is received. Proper credit management ensures that businesses maintain accurate records of who owes them money, how much they owe, and when payments are due.
            </p>
            <p>
              For example, if a business provides ₹50,000 worth of goods on credit to a client, this amount becomes an outstanding balance. When the client later pays ₹20,000, the outstanding balance reduces to ₹30,000. Maintaining accurate transaction records for each credit transaction and payment is essential for financial clarity and business relationships.
            </p>
            <p>
              Manual credit records can become difficult to maintain as the number of clients and transactions grows. Paper-based systems or spreadsheets may lead to errors, lost records, and time-consuming reconciliation. Digital tools like Client Credit Tracker simplify this process by automating calculations, providing instant balance updates, and maintaining a complete audit trail of all transactions.
            </p>
            <p>
              Effective client credit management helps businesses maintain healthy cash flow, reduce payment delays, and build stronger relationships with clients through transparent and accurate record-keeping.
            </p>
          </div>
        </section>

        {/* Why Businesses Need Client Credit Tracking */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="why-credit-tracking-heading">
          <h2 id="why-credit-tracking-heading" className="mb-4 text-xl font-semibold text-white sm:mb-6 sm:text-2xl">
            Why Businesses Need Client Credit Tracking
          </h2>
          <div className="space-y-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            <p>
              Businesses that offer credit to clients face the ongoing challenge of tracking who owes them money and ensuring timely payments. Without proper credit tracking, businesses risk losing track of outstanding balances, forgetting payment due dates, and damaging client relationships due to billing errors or disputes.
            </p>
            <p>
              Client credit tracking provides several key benefits. It helps businesses maintain accurate financial records, which is essential for cash flow management and financial planning. By knowing exactly who owes what and when payments are due, businesses can follow up appropriately and maintain healthy receivables.
            </p>
            <p>
              Transaction history is particularly important in credit management. Each credit transaction and payment should be recorded with details such as date, amount, and description. This historical record helps resolve disputes, provides clarity during audits, and ensures that both the business and the client have a shared understanding of the account status.
            </p>
            <p>
              Outstanding balance tracking is another critical aspect. Businesses need to know at any given time the total amount owed by each client. This information helps in decision-making regarding credit limits, payment follow-ups, and overall business strategy. Digital credit tracking systems provide real-time balance updates, eliminating the need for manual calculations.
            </p>
            <p>
              Ultimately, client credit tracking transforms a potentially messy and error-prone process into a systematic, reliable operation that supports business growth and financial stability.
            </p>
          </div>
        </section>

        {/* Features / use cases */}
        <section className="home-anim-3 mt-12 sm:mt-16" aria-labelledby="home-features-heading">
          <h2 id="home-features-heading" className="mb-6 text-xl font-semibold text-white sm:mb-8 sm:text-2xl">
            Key Features
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

        {/* How It Works */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" className="mb-6 text-xl font-semibold text-white sm:mb-8 sm:text-2xl">
            How It Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS_STEPS.map(({ step, title, description }) => (
              <div key={step} className="relative">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {step}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PDF User Guide Section */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="user-guide-heading">
          <h2 id="user-guide-heading" className="mb-4 text-xl font-semibold text-white sm:mb-6 sm:text-2xl">
            Complete User Guide
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-300 sm:text-base">
            Our comprehensive PDF manual covers everything you need to know about using Client Credit Tracker effectively. From basic setup to advanced features, the guide provides step-by-step instructions with visual examples.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <a
              href={RESOURCE_MANUAL_PDF}
              download="CCT-Learning-Manual.pdf"
              className="inline-flex items-center justify-center gap-3 rounded-xl border border-red-400/40 bg-red-950/40 px-6 py-4 text-sm font-semibold text-red-100 backdrop-blur-md transition hover:border-red-300/60 hover:bg-red-900/50 sm:px-8 sm:py-5"
            >
              <PdfFileIcon className="h-8 w-8" />
              <div className="text-left">
                <div className="font-semibold">Download Learning Manual</div>
                <div className="text-xs text-red-200/70">Complete PDF Guide</div>
              </div>
            </a>
            <div className="text-xs text-slate-400 sm:text-sm">
              <p>Includes setup instructions, feature walkthroughs, and best practices for managing client credit effectively.</p>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="why-choose-heading">
          <h2 id="why-choose-heading" className="mb-6 text-xl font-semibold text-white sm:mb-8 sm:text-2xl">
            Why Choose Client Credit Tracker?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {WHY_CHOOSE_US.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-400/30 bg-blue-500/10 text-blue-300">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">{title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Real-World Use Cases */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="use-cases-heading">
          <h2 id="use-cases-heading" className="mb-6 text-xl font-semibold text-white sm:mb-8 sm:text-2xl">
            Who Can Benefit?
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {USE_CASES.map(({ title, description }) => (
              <div key={title} className="rounded-xl border border-slate-600/30 bg-slate-950/40 px-5 py-4">
                <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SEO Educational Resources */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="resources-heading">
          <h2 id="resources-heading" className="mb-6 text-xl font-semibold text-white sm:mb-8 sm:text-2xl">
            Helpful Guides & Resources
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SEO_RESOURCES.map(({ title, description, keyword }) => (
              <div key={title} className="rounded-xl border border-slate-600/30 bg-slate-950/40 px-5 py-4 transition hover:border-blue-400/40">
                <div className="mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" aria-hidden />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-blue-300/80">{keyword}</span>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-white sm:text-base">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="pricing-heading">
          <h2 id="pricing-heading" className="mb-6 text-xl font-semibold text-white sm:mb-8 sm:text-2xl">
            Pricing
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* First 10 Clients */}
            <div className="relative rounded-2xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-950/60 to-slate-950/80 px-6 py-8 backdrop-blur-md">
              <div className="mb-2 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
                Introductory Offer
              </div>
              <h3 className="mb-4 text-lg font-semibold text-white sm:text-xl">First 10 Clients</h3>
              <div className="mb-4">
                <div className="mb-1 text-3xl font-bold text-white sm:text-4xl">₹25,000</div>
                <div className="text-sm text-slate-300">First Payment</div>
              </div>
              <div className="mb-6 rounded-lg bg-slate-900/50 px-4 py-3">
                <div className="text-lg font-semibold text-white">Then ₹15,000 / Year</div>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-slate-300">
                For the first 10 clients, the first payment is ₹25,000, then ₹15,000 yearly.
              </p>
              <Link
                href={WHATSAPP_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl border border-blue-400/40 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-3 text-center text-sm font-semibold text-white transition hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600"
              >
                Get Started
              </Link>
            </div>

            {/* After 10 Clients */}
            <div className="rounded-2xl border border-slate-500/30 bg-gradient-to-br from-slate-950/80 to-slate-900/60 px-6 py-8 backdrop-blur-md">
              <h3 className="mb-4 text-lg font-semibold text-white sm:text-xl">After 10 Clients</h3>
              <div className="mb-4">
                <div className="mb-1 text-3xl font-bold text-white sm:text-4xl">₹45,000</div>
                <div className="text-sm text-slate-300">Per User Login</div>
              </div>
              <div className="mb-6 h-12 rounded-lg bg-slate-900/50 px-4 py-3">
                <div className="text-sm text-slate-400">Standard pricing for additional users</div>
              </div>
              <p className="mb-6 text-sm leading-relaxed text-slate-300">
                After 10 clients, it will be ₹45,000 per user login.
              </p>
              <Link
                href={WHATSAPP_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-xl border border-slate-400/30 bg-slate-800/50 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700/50"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="mb-6 text-xl font-semibold text-white sm:mb-8 sm:text-2xl">
            Frequently Asked Questions
          </h2>
          <div className="rounded-xl border border-slate-700/50 bg-slate-950/40">
            {FAQ_ITEMS.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
                isOpen={openFAQ === index}
                onClick={() => toggleFAQ(index)}
              />
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-12 rounded-2xl border border-slate-500/25 bg-gradient-to-br from-slate-950/80 via-slate-900/55 to-blue-950/40 px-6 py-8 text-center backdrop-blur-md sm:mt-16 sm:px-8 sm:py-10" aria-labelledby="final-cta-heading">
          <h2 id="final-cta-heading" className="mb-4 text-xl font-semibold text-white sm:mb-6 sm:text-2xl">
            Keep Your Client Credit Records Organized
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-300 sm:text-base">
            Start managing client credit more efficiently with Client Credit Tracker. Simple, reliable, and designed for daily credit work.
          </p>
          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
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
