import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { RetailEvent } from '@/lib/marketplace/events-service';

/** Highlights the live retail-calendar event (Back to School, White Friday…)
 * and routes to its category's deals. Server-rendered on the home page.
 * When a Sketch-generated banner image exists for the event, it leads with
 * the artwork; otherwise it falls back to the text strip. */
export function EventBanner({
  event,
  bannerImage,
}: {
  event: RetailEvent;
  bannerImage?: string | null;
}) {
  const t = useTranslations('events');
  const locale = useLocale();
  const name = locale === 'ar' && event.name_ar ? event.name_ar : event.name;
  const href = event.category ? `/search?category=${event.category}` : '/search';

  if (bannerImage) {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link
          href={href}
          className="group block overflow-hidden rounded-2xl border border-border transition hover:border-accent/60"
          aria-label={`${name} — ${t('shopDeals')}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerImage}
            alt={name}
            className="h-auto w-full object-cover transition group-hover:scale-[1.01]"
            loading="eager"
          />
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <Link
        href={href}
        className="group flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-accent/30 bg-accent/5 px-5 py-4 transition hover:border-accent/60"
      >
        <span className="text-3xl" aria-hidden>{event.emoji ?? '🏷️'}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-bold">
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
              {t('liveNow')}
            </span>
            {name}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {event.expected_discount_pct
              ? t('taglineWithDiscount', { pct: event.expected_discount_pct })
              : t('tagline')}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-accent group-hover:underline">
          {t('shopDeals')}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </span>
      </Link>
    </section>
  );
}
