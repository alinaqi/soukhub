import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { isOperator } from '@/lib/operator';
import { RequestsClient, type CatalogRequestRow, type TradeInRow, type ProviderRequestRow } from '@/components/dashboard/RequestsClient';

export const metadata: Metadata = {
  title: 'Marketplace Requests',
};

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function RequestsPage() {
  const gate = await isOperator();
  if (!gate.ok) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Marketplace Requests</h1>
        <p className="mt-2 text-muted-foreground">
          This inbox is for platform operators. Ask the SoukHub team to add your email to
          OPERATOR_EMAILS if you should have access.
        </p>
      </div>
    );
  }

  const db = svc();
  const [{ data: catalogRequests }, { data: tradeIns }, { data: providerRequests }] = await Promise.all([
    db
      .from('catalog_requests')
      .select('id, name, contact_phone, note, status, created_at, catalog_products(title, price, currency, source, url)')
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('trade_in_requests')
      .select('id, contact_phone, notes, status, estimated_value, currency, ai_assessment, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('provider_requests')
      .select('id, name, contact_phone, item_wanted, delivery_address, status, created_at, providers(name, area, emirate, phone, whatsapp)')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  return (
    <RequestsClient
      catalogRequests={(catalogRequests ?? []) as unknown as CatalogRequestRow[]}
      tradeIns={(tradeIns ?? []) as unknown as TradeInRow[]}
      providerRequests={(providerRequests ?? []) as unknown as ProviderRequestRow[]}
    />
  );
}
