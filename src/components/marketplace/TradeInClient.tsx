'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Camera,
  Sparkles,
  BadgeCheck,
  AlertCircle,
  Banknote,
  X,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { formatAED, productPath } from '@/lib/marketplace/format';
import type { DeviceAssessment, Valuation } from '@/lib/tradein/pricing';

interface ExchangeOptionView {
  id: string;
  name: string;
  title_ar: string | null;
  slug: string;
  short_id: string;
  price: number;
  top_up: number;
  store_name?: string;
}

interface EvaluateResponse {
  assessment: DeviceAssessment;
  valuation: Valuation | null;
  exchange_options: ExchangeOptionView[];
  error?: string;
}

const MAX_IMAGES = 3;

async function fileToBase64(file: File): Promise<{ media_type: string; data: string }> {
  const buf = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 32768) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
  }
  return { media_type: file.type, data: btoa(binary) };
}

export function TradeInClient() {
  const t = useTranslations('tradein');
  const locale = useLocale();
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluateResponse | null>(null);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files, ...Array.from(list)]
      .filter((f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
      .slice(0, MAX_IMAGES);
    setFiles(next);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const images = await Promise.all(files.map(fileToBase64));
      const res = await fetch('/api/trade-in/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, notes, contact_phone: phone }),
      });
      const data = (await res.json()) as EvaluateResponse;
      if (!res.ok) {
        setError(t('errorGeneric'));
        return;
      }
      setResult(data);
    } catch {
      setError(t('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const gradeLabel = (g: string) => {
    const map: Record<string, string> = {
      excellent: locale === 'ar' ? 'ممتازة' : 'Excellent',
      very_good: locale === 'ar' ? 'جيدة جدًا' : 'Very good',
      good: locale === 'ar' ? 'جيدة' : 'Good',
      fair: locale === 'ar' ? 'مقبولة' : 'Fair',
      poor: locale === 'ar' ? 'ضعيفة' : 'Poor',
    };
    return map[g] ?? g;
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-3xl font-bold sm:text-4xl">{t('heroTitle')}</h1>
        <p className="mt-3 text-muted-foreground">{t('heroSubtitle')}</p>
      </div>

      {/* Upload form */}
      {!result && (
        <div className="mt-10 space-y-5 rounded-2xl border border-border bg-card p-6">
          <div>
            <span className="mb-2 block text-sm font-medium">{t('uploadLabel')}</span>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-8 text-center hover:border-primary">
              <Camera className="h-8 w-8 text-muted-foreground" aria-hidden />
              <span className="text-sm text-muted-foreground">{t('uploadHint')}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
            {files.length > 0 && (
              <div className="mt-3 flex gap-3">
                {files.map((f, i) => (
                  <div key={i} className="relative">
                    {/* object URLs for local preview only */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(f)}
                      alt={`upload ${i + 1}`}
                      className="h-20 w-20 rounded-lg border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background"
                      aria-label="remove"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('notesLabel')}</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">{t('phoneLabel')}</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 50 123 4567"
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>

          {error && (
            <p className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
              <AlertCircle className="h-4 w-4" aria-hidden />
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={files.length === 0 || loading}
            className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? t('evaluating') : t('submit')}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-10 space-y-6">
          {!result.assessment.identified || !result.valuation ? (
            <p className="rounded-xl border border-warning/30 bg-warning/5 p-6 text-center">
              {t('notIdentified')}
            </p>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <BadgeCheck className="h-5 w-5 text-primary" aria-hidden />
                  {t('resultTitle')}:{' '}
                  {[result.assessment.brand, result.assessment.model, result.assessment.storage]
                    .filter(Boolean)
                    .join(' ')}
                </h2>
                <p className="mt-2 text-sm">
                  {t('conditionLabel')}:{' '}
                  <span className="font-semibold">
                    {gradeLabel(result.assessment.condition_grade)}
                  </span>
                  <span className="ms-3 text-muted-foreground">
                    {t('confidence')}: {Math.round(result.assessment.confidence * 100)}%
                  </span>
                </p>
                {result.assessment.defects.length > 0 && (
                  <div className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{t('defectsLabel')}:</span>{' '}
                    {result.assessment.defects.join(' · ')}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center">
                <p className="flex items-center justify-center gap-2 text-sm font-medium">
                  <Banknote className="h-4 w-4 text-primary" aria-hidden />
                  {t('valueTitle')}
                </p>
                <p className="mt-2 text-4xl font-bold text-primary">
                  {formatAED(result.valuation.trade_in_value, locale)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{t('valueNote')}</p>
              </div>

              {result.exchange_options.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold">{t('exchangeTitle')}</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {result.exchange_options.map((o) => (
                      <Link
                        key={o.id}
                        href={productPath(o.slug, o.short_id)}
                        className="rounded-xl border border-border bg-card p-4 hover:border-primary"
                      >
                        <p className="line-clamp-2 text-sm font-medium">
                          {locale === 'ar' && o.title_ar ? o.title_ar : o.name}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatAED(o.price, locale)}
                        </p>
                        <p className="mt-2 font-semibold text-accent">
                          {o.top_up >= 0
                            ? t('topUp', { amount: formatAED(o.top_up, locale) })
                            : t('youReceive', { amount: formatAED(Math.abs(o.top_up), locale) })}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}
