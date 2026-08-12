import type { Metadata } from 'next';
import { Sora } from 'next/font/google';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/app-branding';
import HomeLanding from '@/components/home-landing';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-home-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `Client Credit Tracker | Client Credit & Payment Management`,
  description: 'Client Credit Tracker helps businesses manage client credit, track outstanding balances, record payments, and maintain organized transaction history. Simple, reliable credit management for small businesses.',
  openGraph: {
    title: 'Client Credit Tracker | Client Credit & Payment Management',
    description: 'Client Credit Tracker helps businesses manage client credit, track outstanding balances, record payments, and maintain organized transaction history.',
    url: 'https://client-credit-tracker.in/',
    siteName: APP_NAME,
    type: 'website',
  },
  alternates: {
    canonical: 'https://client-credit-tracker.in/',
  },
};

export default function HomePage() {
  return (
    <div className={`${sora.variable} font-[family-name:var(--font-home-display)]`}>
      <HomeLanding />
    </div>
  );
}
