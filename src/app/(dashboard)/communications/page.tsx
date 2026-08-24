import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CommunicationsClient } from '@/components/communications/CommunicationsClient';

export default async function CommunicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <CommunicationsClient userId={user.id} />;
}
