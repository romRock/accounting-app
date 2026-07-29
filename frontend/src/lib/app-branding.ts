export const APP_NAME = 'Client Credit Tracker';
export const APP_TAGLINE = 'Transaction & Bookkeeping';
export const APP_DESCRIPTION =
  'Transaction & Bookkeeping Web Application for client credit tracking';
/** Shown in the browser tab (title + short tagline). */
export const APP_TAB_TITLE = `${APP_NAME} — ${APP_TAGLINE}`;

/** Sidebar / UI logo */
export const LOGO_PATH = '/images/logo.png';

/**
 * Public landing / support contact.
 * Override via NEXT_PUBLIC_SUPPORT_PHONE / NEXT_PUBLIC_WHATSAPP_NUMBER (digits only for WhatsApp).
 */
export const SUPPORT_PHONE_DISPLAY =
  process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+91 87806 70096';
export const SUPPORT_PHONE_TEL = (
  process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+918780670096'
).replace(/[^\d+]/g, '');
export const WHATSAPP_NUMBER = (
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  process.env.NEXT_PUBLIC_SUPPORT_PHONE ||
  '918780670096'
).replace(/\D/g, '');
export const WHATSAPP_TRIAL_MESSAGE =
  'Hi, I want to start a 15-day trial of Client Credit Tracker.';
export const WHATSAPP_CHAT_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TRIAL_MESSAGE)}`;
export const WHATSAPP_CONTACT_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

/** Public downloads (frontend/public/resources) */
export const RESOURCE_MANUAL_PDF = '/resources/cct-learning-manual.pdf';
export const RESOURCE_ANDROID_APK = '/resources/cct.apk';

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
