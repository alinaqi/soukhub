'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, AlertCircle, Truck } from 'lucide-react';

/** Nearest-shop fulfilment: buyer says what they want; we arrange with the
 * shop and a local courier. Lands in the operator Requests inbox. */
export function ProviderRequestClient({ providerId }: { providerId: string }) {
  const t = useTranslations('providers');
  const [form, setForm] = useState({ item: '', name: '', phone: '', address: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (form.item.trim().length < 3) {
      setError(t('itemRequired'));
      return;
    }
    if (form.phone.replace(/\D/g, '').length < 8) {
      setError(t('phoneInvalid'));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/providers/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_id: providerId,
          item_wanted: form.item,
          name: form.name,
          contact_phone: form.phone,
          delivery_address: form.address,
        }),
      });
      if (!res.ok) {
        setError(t('phoneInvalid'));
        return;
      }
      setDone(true);
    } catch {
      setError(t('phoneInvalid'));
    } finally {
      setSending(false);
    }
  };

  const field =
    'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  if (done) {
    return (
      <div className="mt-8 rounded-xl border border-success/30 bg-success/5 p-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
          <Check className="h-6 w-6" aria-hidden />
        </span>
        <h2 className="mt-3 font-semibold">{t('successTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('successText')}</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-xl border border-border bg-surface-warm p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <Truck className="h-4 w-4 text-primary" aria-hidden />
        {t('requestTitle')}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t('requestText')}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          className={`${field} sm:col-span-2`}
          placeholder={t('itemPlaceholder')}
          value={form.item}
          onChange={(e) => setForm({ ...form, item: e.target.value })}
        />
        <input className={field} placeholder={t('nameLabel')} value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={field} type="tel" placeholder={`${t('phoneLabel')} — +971 50 123 4567`} value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input className={`${field} sm:col-span-2`} placeholder={t('addressLabel')} value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-error">
          <AlertCircle className="h-4 w-4" aria-hidden />
          {error}
        </p>
      )}
      <button
        onClick={submit}
        disabled={sending}
        className="mt-4 w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
      >
        {sending ? t('submitting') : t('submit')}
      </button>
    </div>
  );
}
