'use client';

import { useEffect } from 'react';

/** Registers the PWA service worker (production only — dev caching confuses HMR). */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' &&
      'serviceWorker' in navigator
    ) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // offline support is progressive enhancement — never break the page
      });
    }
  }, []);
  return null;
}
