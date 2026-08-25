'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, ExternalLink, Check, AlertCircle } from 'lucide-react';
import type { StoreRecord } from '@/lib/marketplace/store-service';

const SLUG_ERRORS: Record<string, string> = {
  slug_invalid: 'Only lowercase letters, numbers and dashes (no leading/trailing dash).',
  slug_reserved: 'That address is reserved — try another.',
  slug_too_short: 'At least 3 characters.',
  slug_too_long: 'At most 40 characters.',
  slug_taken: 'That address is already taken.',
  publish_requires_product: 'Publish at least one listing before publishing the store.',
};

export function StoreSettingsClient({ initialStore }: { initialStore: StoreRecord }) {
  const [store, setStore] = useState(initialStore);
  const [form, setForm] = useState({
    name: initialStore.name ?? '',
    name_ar: initialStore.name_ar ?? '',
    slug: initialStore.slug ?? '',
    bio: initialStore.bio ?? '',
    bio_ar: initialStore.bio_ar ?? '',
    logo_url: initialStore.logo_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const canEdit = store.role === 'owner' || store.role === 'manager';

  const patch = async (body: Record<string, unknown>) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: 'error', text: SLUG_ERRORS[data.error] ?? data.error });
        return false;
      }
      setStore(data.store);
      setMessage({ kind: 'ok', text: 'Saved.' });
      return true;
    } finally {
      setSaving(false);
    }
  };

  const save = () => patch(form);
  const togglePublish = () => patch({ is_published: !store.is_published });

  const field =
    'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Store Settings</h1>
          <p className="text-muted-foreground">Your public storefront on SoukHub.</p>
        </div>
        {store.slug && store.is_published && (
          <Link
            href={`/s/${store.slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            View storefront
          </Link>
        )}
      </div>

      {/* Status card */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Store className="h-6 w-6" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="font-semibold">
            {store.is_published ? 'Your store is live' : 'Your store is not published yet'}
          </p>
          <p className="text-sm text-muted-foreground">
            {store.published_product_count} live listing
            {store.published_product_count === 1 ? '' : 's'} · commission{' '}
            {(store.commission_bps / 100).toFixed(1)}%
          </p>
        </div>
        {canEdit && (
          <button
            onClick={togglePublish}
            disabled={saving}
            className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
              store.is_published
                ? 'border border-border hover:bg-muted'
                : 'bg-primary text-primary-foreground hover:bg-primary-hover'
            }`}
          >
            {store.is_published ? 'Unpublish' : 'Publish store'}
          </button>
        )}
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.kind === 'ok'
              ? 'border-success/30 bg-success/5 text-success'
              : 'border-error/30 bg-error/5 text-error'
          }`}
        >
          {message.kind === 'ok' ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <AlertCircle className="h-4 w-4" aria-hidden />
          )}
          {message.text}
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Store name</span>
            <input
              className={field}
              value={form.name}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="text-sm" dir="rtl">
            <span className="mb-1 block font-medium">اسم المتجر (عربي)</span>
            <input
              className={field}
              value={form.name_ar}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Store address</span>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">soukhub.com/s/</span>
            <input
              className={field}
              value={form.slug}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
            />
          </div>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Logo URL</span>
          <input
            className={field}
            value={form.logo_url}
            disabled={!canEdit}
            placeholder="https://…"
            onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium">About the store</span>
            <textarea
              className={field}
              rows={3}
              value={form.bio}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
          <label className="text-sm" dir="rtl">
            <span className="mb-1 block font-medium">نبذة عن المتجر (عربي)</span>
            <textarea
              className={field}
              rows={3}
              value={form.bio_ar}
              disabled={!canEdit}
              onChange={(e) => setForm({ ...form, bio_ar: e.target.value })}
            />
          </label>
        </div>

        {canEdit ? (
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Only owners and managers can edit store settings.
          </p>
        )}
      </div>
    </div>
  );
}
