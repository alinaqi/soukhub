import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CustomersClient } from '@/components/customers/CustomersClient';

export default async function CustomersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <CustomersClient userId={user.id} />;
}
