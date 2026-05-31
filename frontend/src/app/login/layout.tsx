import type { Metadata } from 'next';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/app-branding';

export const metadata: Metadata = {
  title: 'Sign In',
  description: APP_DESCRIPTION,
  openGraph: {
    title: `Sign In · ${APP_NAME}`,
    description: APP_DESCRIPTION,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
