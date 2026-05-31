import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LayoutWrapper from "./layout-wrapper";
import {
  APP_NAME,
  APP_DESCRIPTION,
  APP_TAB_TITLE,
  FAVICON,
} from "@/lib/app-branding";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: {
    default: APP_TAB_TITLE,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: FAVICON.manifest,
  icons: {
    icon: [
      { url: FAVICON.icon16, sizes: "16x16", type: "image/png" },
      { url: FAVICON.icon32, sizes: "32x32", type: "image/png" },
    ],
    shortcut: FAVICON.ico,
    apple: FAVICON.apple,
    other: [
      {
        rel: "android-chrome-192x192",
        url: FAVICON.android192,
      },
      {
        rel: "android-chrome-512x512",
        url: FAVICON.android512,
      },
    ],
  },
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
    siteName: APP_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning={true}>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
