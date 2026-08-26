'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, LocateFixed, MapPin } from 'lucide-react';
import {
  loadStoredLocation,
  reverseGeocode,
  storeLocation,
  type DeliveryLocation,
} from '@/lib/delivery-location';

/**
 * Talabat/Careem-style "Deliver to: <area>" strip. Per-device choice
 * (localStorage); geolocation + OSM reverse geocode, or a typed address.
 */
export function DeliveryLocationBar() {
  const t = useTranslations('delivery');
  const locale = useLocale();
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState('');
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocation(loadStoredLocation());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const save = (next: DeliveryLocation) => {
    storeLocation(next);
    setLocation(next);
    setOpen(false);
    setError(false);
    setManual('');
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError(true);
      return;
    }
    setLocating(true);
    setError(false);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const label = await reverseGeocode(coords.latitude, coords.longitude, locale);
          save({
            label: label ?? t('nearYou'),
            lat: coords.latitude,
            lng: coords.longitude,
          });
        } catch {
          setError(true);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setError(true);
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  const saveManual = () => {
    const label = manual.trim().slice(0, 80);
    if (label.length < 2) return;
    save({ label, lat: null, lng: null });
  };

  return (
    <div className="relative border-b border-border bg-surface-warm" ref={panelRef}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 items-center gap-1.5 text-sm"
          aria-expanded={open}
        >
          <MapPin className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-muted-foreground">{t('deliverTo')}</span>
          <span className="max-w-[16rem] truncate font-semibold text-foreground">
            {location ? location.label : t('chooseLocation')}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-b border-border bg-card shadow-lg">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex max-w-xl flex-col gap-3">
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                <LocateFixed className="h-4 w-4" aria-hidden />
                {locating ? t('locating') : t('useMyLocation')}
              </button>
              <div className="flex gap-2">
                <input
                  value={manual}
                  onChange={(e) => setManual(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveManual()}
                  placeholder={t('manualPlaceholder')}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={saveManual}
                  className="shrink-0 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  {t('saveAddress')}
                </button>
              </div>
              {error && <p className="text-sm text-warning">{t('locationFailed')}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
