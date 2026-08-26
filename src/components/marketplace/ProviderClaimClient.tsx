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
      <p className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        {t('claimTaken')}
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Store className="h-4 w-4 text-primary" aria-hidden />
          {t('claimTitle')}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t('claimText')}</p>
        {state === 'error' && <p className="mt-1 text-sm text-error">{t('claimError')}</p>}
      </div>
      <button
        onClick={claim}
        disabled={state === 'claiming'}
        className="shrink-0 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {state === 'claiming' ? t('claiming') : t('claimButton')}
      </button>
    </div>
  );
}
