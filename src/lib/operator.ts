import { createClient } from '@/lib/supabase/server';

/**
 * Platform-operator gate for cross-tenant surfaces (marketplace requests,
 * trade-ins). Allowlist via OPERATOR_EMAILS (comma-separated). These flows
 * belong to the platform, not to any one seller org.
 */
export async function isOperator(): Promise<{ ok: boolean; email: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? null;
  if (!email) return { ok: false, email: null };
  const allow = (process.env.OPERATOR_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return { ok: allow.includes(email.toLowerCase()), email };
}
