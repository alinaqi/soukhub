import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Kept for safety: these must never be bundled server-side
  serverExternalPackages: ["whatsapp-web.js", "puppeteer", "puppeteer-core"],
  images: {
    remotePatterns: [
      // Supabase storage (local + hosted) for product/store images
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default withNextIntl(nextConfig);
