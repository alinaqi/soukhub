import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false },
};

/** Served by the service worker when the network is gone. */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">
        SoukHub needs a connection to load fresh listings. Check your internet and try again.
      </p>
      <a
        href="/"
        className="mt-6 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground"
      >
        Try again
      </a>
    </main>
  );
}
