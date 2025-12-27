import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import type { Profile } from '@/types/supabase';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = data as Profile | null;

  if (!profile?.onboarding_completed) {
    redirect('/onboarding');
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col">
        <Header profile={profile} />
        <main className="flex-1 p-6 bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
