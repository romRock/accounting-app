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
  title: `${APP_NAME} — Home`,
  description: APP_DESCRIPTION,
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export default function HomePage() {
  return (
    <div className={`${sora.variable} font-[family-name:var(--font-home-display)]`}>
      <HomeLanding />
    </div>
  );
}
