import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TeamClient } from '@/components/team/TeamClient';
import { getTable } from '@/lib/supabase/tables';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Team Management',
};

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch team members
  const { data: members } = await getTable(supabase, 'team_members')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false });

  // Remove PIN from response for security
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeMembers = members?.map((member: any) => {
    const { pin_code, ...rest } = member;
    return {
      ...rest,
      has_pin: !!pin_code,
    };
  }) || [];

  return <TeamClient members={safeMembers} />;
}
