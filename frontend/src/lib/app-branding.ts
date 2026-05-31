export const APP_NAME = 'Client Credit Tracker';
export const APP_TAGLINE = 'Transaction & Bookkeeping';
export const APP_DESCRIPTION =
  'Transaction & Bookkeeping Web Application for client credit tracking';
/** Shown in the browser tab (title + short tagline). */
export const APP_TAB_TITLE = `${APP_NAME} — ${APP_TAGLINE}`;

/** Sidebar / UI logo */
export const LOGO_PATH = '/images/logo.png';

/** Favicon pack: frontend/public/images/favicon_io */
export const FAVICON = {
  ico: '/images/favicon_io/favicon.ico',
  icon16: '/images/favicon_io/favicon-16x16.png',
  icon32: '/images/favicon_io/favicon-32x32.png',
  apple: '/images/favicon_io/apple-touch-icon.png',
  android192: '/images/favicon_io/android-chrome-192x192.png',
  android512: '/images/favicon_io/android-chrome-512x512.png',
  manifest: '/images/favicon_io/site.webmanifest',
} as const;
