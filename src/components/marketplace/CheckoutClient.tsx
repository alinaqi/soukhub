'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Banknote, Check, AlertCircle, CreditCard } from 'lucide-react';
import { formatAED } from '@/lib/marketplace/format';

interface CheckoutProduct {
  id: string;
  title: string;
  price: number;
  image: string | null;
  storeName: string | null;
}

const EMIRATE_KEYS = ['dubai', 'abudhabi', 'sharjah', 'ajman', 'rak', 'fujairah', 'uaq'] as const;

export function CheckoutClient({ product }: { product: CheckoutProduct }) {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const [form, setForm] = useState({ name: '', phone: '', emirate: '', address: '', note: '' });
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ ref: string; total: number } | null>(null);

  const submit = async () => {
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, quantity: 1, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'checkout_failed');
        return;
      }
      setSuccess({ ref: data.ref, total: data.total });
    } catch {
      setError('checkout_failed');
    } finally {
      setPlacing(false);
    }
  };

  const errorText = (code: string) => {
    try {
      return t(`errors.${code}`);
    } catch {
      return t('errors.checkout_failed');
    }
  };

  const field =
    'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  if (success) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success">
          <Check className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="mt-4 text-3xl font-bold">{t('successTitle')}</h1>
        <p className="mt-3 text-muted-foreground">{t('successText')}</p>
        <p className="mt-4 rounded-xl border border-border bg-surface-warm px-6 py-4 font-mono text-2xl font-bold tracking-widest">
          {success.ref}
        </p>
        <p className="mt-2 text-sm font-semibold text-accent">
          {formatAED(success.total, locale)}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">{t('trackHint')}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      {/* Order summary */}
      <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.title} className="h-16 w-16 rounded-lg object-contain" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{t('itemLabel')}</p>
          <p className="truncate text-sm font-medium">{product.title}</p>
          {product.storeName && (
            <p className="truncate text-xs text-muted-foreground">{product.storeName}</p>
          )}
        </div>
        <p className="shrink-0 font-bold text-accent">{formatAED(product.price, locale)}</p>
      </div>

      {/* Form */}
      <div className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('nameLabel')}</span>
          <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('phoneLabel')}</span>
          <input className={field} type="tel" placeholder="+971 50 123 4567" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('emirateLabel')}</span>
          <select className={field} value={form.emirate} onChange={(e) => setForm({ ...form, emirate: e.target.value })}>
            <option value="" disabled hidden></option>
            {EMIRATE_KEYS.map((k) => (
              <option key={k} value={t(`emirates.${k}`)}>{t(`emirates.${k}`)}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('addressLabel')}</span>
          <textarea className={field} rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t('noteLabel')}</span>
          <input className={field} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        </label>

        {/* Payment */}
        <div className="text-sm">
          <span className="mb-1 block font-medium">{t('paymentLabel')}</span>
          <div className="rounded-lg border border-primary bg-primary/5 px-4 py-3">
            <span className="flex items-center gap-2 font-semibold">
              <Banknote className="h-4 w-4 text-primary" aria-hidden />
              {t('cod')}
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">{t('codHint')}</p>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-muted-foreground">
            <CreditCard className="h-4 w-4" aria-hidden />
            {t('cardSoon')}
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
            <AlertCircle className="h-4 w-4" aria-hidden />
            {errorText(error)}
          </p>
        )}

        <button
          onClick={submit}
          disabled={placing}
          className="w-full rounded-lg bg-primary px-6 py-3.5 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
        >
          {placing ? t('placing') : `${t('placeOrder')} · ${formatAED(product.price, locale)}`}
        </button>
      </div>
    </main>
  );
}
