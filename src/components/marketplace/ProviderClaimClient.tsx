'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Store } from 'lucide-react';

/**
 * Claim-my-store CTA (ADR 0017): the shop owner claims their directory entry
 * and lands in a ready-to-manage seller account. Guests round-trip through
 * /login?next=<this page>?claim=1, which auto-resumes the claim on return.
 */
export function ProviderClaimClient({ providerId, slug }: { providerId: string; slug: string }) {
  const t = useTranslations('providers');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<'idle' | 'claiming' | 'taken' | 'error'>('idle');
  const resumed = useRef(false);

  const claim = async () => {
    setState('claiming');
    try {
      const res = await fetch('/api/providers/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: providerId }),
      });
      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/providers/${slug}?claim=1`)}`);
        return;
      }
      if (res.status === 409) {
        setState('taken');
        return;
      }
      if (!res.ok) {
        setState('error');
        return;
      }
      const data = await res.json();
      router.push(data.store_path ?? '/settings/store');
    } catch {
      setState('error');
    }
  };

  // Returning from login with ?claim=1 → finish the claim automatically
  useEffect(() => {
    if (searchParams.get('claim') === '1' && !resumed.current) {
      resumed.current = true;
      void claim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (state === 'taken') {
    return (
      <div className="fixed bottom-20 end-5 z-40 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-lg">
        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        {t('claimTaken')}
      </div>
    );
  }

  // Floating CTA, stacked above the Souky launcher (which sits at bottom-5).
  return (
    <div className="fixed bottom-20 end-5 z-40 flex flex-col items-end gap-2">
      {state === 'error' && (
        <span className="rounded-lg bg-card px-3 py-1.5 text-xs text-error shadow">{t('claimError')}</span>
      )}
      <button
        onClick={claim}
        disabled={state === 'claiming'}
        title={t('claimText')}
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card px-5 py-3 text-sm font-semibold text-primary shadow-lg transition-transform hover:scale-105 hover:bg-primary/5 disabled:opacity-60"
      >
        <Store className="h-4 w-4" aria-hidden />
        {state === 'claiming' ? t('claiming') : t('claimTitle')}
      </button>
    </div>
  );
}
