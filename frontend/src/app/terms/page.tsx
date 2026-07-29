import type { Metadata } from 'next';
import TermsPageView from '@/components/legal/terms-page-view';
import { APP_NAME } from '@/lib/app-branding';
import { TERMS_BY_LANG } from '@/lib/legal/terms-content';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: TERMS_BY_LANG.en.metaDescription,
  openGraph: {
    title: `Terms & Conditions · ${APP_NAME}`,
    description: TERMS_BY_LANG.en.metaDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return <TermsPageView />;
}
