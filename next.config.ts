import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude whatsapp-web.js and puppeteer from server-side bundling
  // These need to run in Node.js directly, not bundled
  serverExternalPackages: [
    'whatsapp-web.js',
    'puppeteer',
    'puppeteer-core',
  ],
};

export default nextConfig;
