import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google";
import { getLocale } from "next-intl/server";
import { getDir } from "@/i18n/routing";
import { ServiceWorkerRegistrar } from "@/components/marketplace/ServiceWorkerRegistrar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export const metadata: Metadata = {
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SoukHub",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  title: {
    default: "SoukHub — Buy & Sell Phones and Electronics in the UAE",
    template: "%s | SoukHub",
  },
  description:
    "The AI-first marketplace for phones and electronics in the UAE. Open a store in minutes, shop with confidence — English and Arabic, cards or cash on delivery.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Locale is set by the next-intl middleware on public routes;
  // console/auth routes fall back to English.
  const locale = await getLocale();

  return (
    <html lang={locale} dir={getDir(locale)}>
      <body
        className={`${inter.variable} ${plexArabic.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
