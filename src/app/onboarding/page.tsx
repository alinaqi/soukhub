'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  Store,
  Package,
  ShoppingBag,
  Upload,
  Copy,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { suggestStoreSlug, validateStoreSlug } from '@/lib/marketplace/store-slug';
import type { MarketplaceType, Profile } from '@/types/supabase';

const STEPS = [
  { id: 0, title: 'Welcome' },
  { id: 1, title: 'Your store' },
  { id: 2, title: 'Marketplaces' },
  { id: 3, title: 'Ready!' },
];

const MARKETPLACES: { id: MarketplaceType; name: string; description: string }[] = [
  { id: 'amazon', name: 'Amazon', description: 'Amazon UAE, KSA, and more' },
  { id: 'cartlow', name: 'Cartlow', description: 'Refurbished marketplace' },
  { id: 'revibe', name: 'Revibe', description: 'Pre-owned electronics' },
  { id: 'noon', name: 'Noon', description: 'Middle East marketplace' },
];

const SLUG_ERRORS: Record<string, string> = {
  slug_invalid: 'Only lowercase letters, numbers and dashes.',
  slug_reserved: 'That address is reserved — try another.',
  slug_too_short: 'At least 3 characters.',
  slug_too_long: 'At most 40 characters.',
  slug_taken: 'That address is already taken — try another.',
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('AE');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<MarketplaceType[]>([]);
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [storeError, setStoreError] = useState<string | null>(null);
  const [storefrontPath, setStorefrontPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const profile = data as Profile | null;
      if (profile) {
        setStep(Math.min(profile.onboarding_step || 0, 3));
        setBusinessName(profile.business_name || '');
        setPhone(profile.phone || '');
        setCountry(profile.country || 'AE');
        if (profile.onboarding_completed) {
          router.push('/dashboard');
        }
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [supabase, router]);

  // Entering the store step: provision + prefill from the API
  const loadStore = useCallback(async () => {
    const res = await fetch('/api/store');
    if (!res.ok) return;
    const { store } = await res.json();
    setStoreName((prev) => prev || store.name || businessName);
    setStoreSlug((prev) => prev || store.slug || suggestStoreSlug(businessName || store.name));
    if (store.slug) setStorefrontPath(`/s/${store.slug}`);
  }, [businessName]);

  const toggleMarketplace = (id: MarketplaceType) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const saveProfileProgress = async (nextStep: number) => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('profiles')
      .update({
        business_name: businessName,
        phone,
        country,
        onboarding_step: nextStep,
      } as never)
      .eq('id', user.id);
    setLoading(false);
    setStep(nextStep);
    if (nextStep === 1) void loadStore();
  };

  const saveStore = async () => {
    setStoreError(null);
    const valid = validateStoreSlug(storeSlug);
    if (!valid.ok) {
      setStoreError(SLUG_ERRORS[`slug_${valid.error}`]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/store', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: storeName.trim(), slug: storeSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStoreError(SLUG_ERRORS[data.error] ?? data.error);
        return;
      }
      setStorefrontPath(`/s/${data.store.slug}`);
      await saveProfileProgress(2);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    for (const marketplace of selectedMarketplaces) {
      await supabase.from('marketplace_connections').insert({
        user_id: user.id,
        marketplace,
        display_name: MARKETPLACES.find((m) => m.id === marketplace)?.name || marketplace,
        status: 'pending',
      } as never);
    }

    await supabase
      .from('profiles')
      .update({ onboarding_completed: true, onboarding_step: 3 } as never)
      .eq('id', user.id);

    setLoading(false);
    setStep(3);
  };

  const storefrontUrl =
    typeof window !== 'undefined' && storefrontPath
      ? `${window.location.origin}${storefrontPath}`
      : storefrontPath ?? '';

  const copyLink = async () => {
    if (!storefrontUrl) return;
    await navigator.clipboard.writeText(storefrontUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass =
    'w-full rounded-lg border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s.id ? <Check className="h-4 w-4" aria-hidden /> : s.id + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-1 mx-2 ${step > s.id ? 'bg-primary' : 'bg-muted'}`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Step {step + 1} of {STEPS.length}: {STEPS[step].title}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Step 0: Business Info */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold">Welcome to SoukHub!</h1>
                <p className="mt-2 text-muted-foreground">
                  Let&apos;s set up your account. This takes about two minutes.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Business / Shop Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={inputClass}
                    placeholder="Ali Phones Trading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClass}
                    placeholder="+971 50 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className={inputClass}
                  >
                    <option value="AE">United Arab Emirates</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="KW">Kuwait</option>
                    <option value="QA">Qatar</option>
                    <option value="BH">Bahrain</option>
                    <option value="OM">Oman</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => saveProfileProgress(1)}
                disabled={!businessName.trim() || loading}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 1: Your store */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Store className="h-7 w-7" aria-hidden />
                </span>
                <h1 className="text-3xl font-bold">Name your store</h1>
                <p className="mt-2 text-muted-foreground">
                  This is what buyers see. Your storefront goes live as soon as you
                  publish your first listing.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Store name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => {
                      setStoreName(e.target.value);
                      if (!slugTouched) setStoreSlug(suggestStoreSlug(e.target.value));
                    }}
                    className={inputClass}
                    placeholder={businessName || 'Ali Phones'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Store address</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">soukhub.com/s/</span>
                    <input
                      type="text"
                      value={storeSlug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setStoreSlug(e.target.value.toLowerCase());
                      }}
                      className={inputClass}
                    />
                  </div>
                  {storeError && <p className="mt-2 text-sm text-error">{storeError}</p>}
                </div>
              </div>

              <button
                onClick={saveStore}
                disabled={!storeName.trim() || !storeSlug || loading}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 2: Marketplaces */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold">Where else do you sell?</h1>
                <p className="mt-2 text-muted-foreground">
                  SoukHub also manages your orders from these platforms. Optional — skip
                  if you only sell on SoukHub.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {MARKETPLACES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => toggleMarketplace(m.id)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      selectedMarketplaces.includes(m.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ShoppingBag className="h-5 w-5" aria-hidden />
                    </span>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.description}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={completeOnboarding}
                disabled={loading}
                className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                {loading ? 'Finishing…' : 'Finish setup'}
              </button>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10 text-success">
                <Check className="h-8 w-8" aria-hidden />
              </span>
              <div>
                <h1 className="text-3xl font-bold">Your store is ready</h1>
                <p className="mt-2 text-muted-foreground">
                  Add your first listing and publish it — your storefront goes live the
                  moment you do.
                </p>
              </div>

              {storefrontPath && (
                <div className="rounded-xl border border-border bg-surface-warm p-4">
                  <p className="text-sm text-muted-foreground">Your storefront</p>
                  <p className="mt-1 truncate font-mono text-sm font-semibold">{storefrontUrl}</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <Copy className="h-4 w-4" aria-hidden />
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Check out my store on SoukHub: ${storefrontUrl}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      Share on WhatsApp
                    </a>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                <button
                  onClick={() => router.push('/products')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
                >
                  <Package className="h-5 w-5" aria-hidden />
                  Add your first product
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <button
                  onClick={() => router.push('/import')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 font-medium hover:bg-muted"
                >
                  <Upload className="h-5 w-5" aria-hidden />
                  Import existing orders
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  Skip for now — go to dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
