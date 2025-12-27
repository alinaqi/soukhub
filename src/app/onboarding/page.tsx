'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { MarketplaceType, Profile } from '@/types/supabase';

const STEPS = [
  { id: 0, title: 'Welcome', description: 'Tell us about your business' },
  { id: 1, title: 'Marketplaces', description: 'Where do you sell?' },
  { id: 2, title: 'Import Data', description: 'Bring in your existing orders' },
  { id: 3, title: 'Ready!', description: "You're all set" },
];

const MARKETPLACES = [
  {
    id: 'amazon' as MarketplaceType,
    name: 'Amazon',
    description: 'Amazon UAE, KSA, and more',
    icon: '📦',
  },
  {
    id: 'cartlow' as MarketplaceType,
    name: 'Cartlow',
    description: 'Refurbished marketplace',
    icon: '🛒',
  },
  {
    id: 'revibe' as MarketplaceType,
    name: 'Revibe',
    description: 'Pre-owned electronics',
    icon: '📱',
  },
  {
    id: 'noon' as MarketplaceType,
    name: 'Noon',
    description: 'Middle East marketplace',
    icon: '🌙',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('AE');
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<MarketplaceType[]>([]);
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
        setStep(profile.onboarding_step || 0);
        setBusinessName(profile.business_name || '');
        setPhone(profile.phone || '');
        setCountry(profile.country || 'AE');

        if (profile.onboarding_completed) {
          router.push('/dashboard');
        }
      }
    }
    loadProfile();
  }, [supabase, router]);

  const toggleMarketplace = (id: MarketplaceType) => {
    setSelectedMarketplaces((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const saveProgress = async (nextStep: number) => {
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
  };

  const completeOnboarding = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Save marketplace connections
    for (const marketplace of selectedMarketplaces) {
      await supabase.from('marketplace_connections').insert({
        user_id: user.id,
        marketplace,
        display_name: MARKETPLACES.find((m) => m.id === marketplace)?.name || marketplace,
        status: 'pending',
      } as never);
    }

    // Mark onboarding complete
    await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_step: 3,
      } as never)
      .eq('id', user.id);

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s.id ? '✓' : s.id + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-1 mx-2 ${
                      step > s.id ? 'bg-primary' : 'bg-muted'
                    }`}
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
                  Let&apos;s set up your account. This will only take a minute.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Business / Shop Name
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="My Awesome Shop"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="AE">United Arab Emirates</option>
                    <option value="SA">Saudi Arabia</option>
                    <option value="ZA">South Africa</option>
                    <option value="EG">Egypt</option>
                    <option value="KW">Kuwait</option>
                    <option value="QA">Qatar</option>
                    <option value="BH">Bahrain</option>
                    <option value="OM">Oman</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => saveProgress(1)}
                disabled={loading || !businessName}
                className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Continue'}
              </button>
            </div>
          )}

          {/* Step 1: Marketplaces */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold">Where do you sell?</h1>
                <p className="mt-2 text-muted-foreground">
                  Select the marketplaces you&apos;re currently selling on
                </p>
              </div>

              <div className="grid gap-3">
                {MARKETPLACES.map((mp) => (
                  <button
                    key={mp.id}
                    onClick={() => toggleMarketplace(mp.id)}
                    className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-colors ${
                      selectedMarketplaces.includes(mp.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-3xl">{mp.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{mp.name}</div>
                      <div className="text-sm text-muted-foreground">{mp.description}</div>
                    </div>
                    {selectedMarketplaces.includes(mp.id) && (
                      <span className="text-primary text-xl">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 rounded-lg border border-border px-4 py-3 font-medium transition-colors hover:bg-muted"
                >
                  Back
                </button>
                <button
                  onClick={() => saveProgress(2)}
                  disabled={loading || selectedMarketplaces.length === 0}
                  className="flex-1 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Import Data */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl font-bold">Import your data</h1>
                <p className="mt-2 text-muted-foreground">
                  Bring in your existing orders and products
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border border-dashed border-border p-8 text-center">
                  <div className="text-4xl mb-3">📄</div>
                  <h3 className="font-medium mb-1">Upload CSV/Excel files</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Export your orders from Amazon, Cartlow, or Revibe and upload them here
                  </p>
                  <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                    Choose Files
                  </button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  or
                </div>

                <button className="w-full rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔗</span>
                    <div>
                      <div className="font-medium">Connect API (Coming Soon)</div>
                      <div className="text-sm text-muted-foreground">
                        Automatically sync orders from your marketplaces
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-lg border border-border px-4 py-3 font-medium transition-colors hover:bg-muted"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="text-6xl">🎉</div>
              <div>
                <h1 className="text-3xl font-bold">You&apos;re all set!</h1>
                <p className="mt-2 text-muted-foreground">
                  Your SoukHub account is ready. Start managing your marketplace orders.
                </p>
              </div>

              <div className="bg-muted rounded-lg p-6 text-left space-y-3">
                <h3 className="font-medium">What&apos;s next?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Import your existing orders from CSV files
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    View all your marketplace orders in one dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Get AI-powered insights and recommendations
                  </li>
                </ul>
              </div>

              <button
                onClick={completeOnboarding}
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Go to Dashboard'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
