'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/supabase';

interface HeaderProps {
  profile: Profile;
}

export function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div>
        <h2 className="font-medium">
          Welcome back, {profile.full_name || 'there'}!
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
        </button>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
            {(profile.full_name || profile.email)?.[0]?.toUpperCase() || 'U'}
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
