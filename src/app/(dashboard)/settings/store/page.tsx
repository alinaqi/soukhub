import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getStoreForUser } from '@/lib/marketplace/store-service';
import { StoreSettingsClient } from '@/components/settings/StoreSettingsClient';

export const metadata: Metadata = {
  title: 'Store Settings',
};

export default async function StoreSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const store = await getStoreForUser(user.id);

  return <StoreSettingsClient initialStore={store} />;
}
