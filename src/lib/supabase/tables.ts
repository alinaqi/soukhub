import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Helper to access tables that aren't yet in the generated Supabase types.
 * These tables were added in the workflow_suppliers_team migration.
 *
 * Once the migration is applied and types regenerated, this helper can be removed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTable(supabase: SupabaseClient, table: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

/**
 * New table names added in the workflow_suppliers_team migration.
 * Use these constants to avoid typos.
 */
export const NEW_TABLES = {
  ORGANIZATIONS: 'organizations',
  TEAM_MEMBERS: 'team_members',
  TEAM_SESSIONS: 'team_sessions',
  WORKFLOW_CONFIG: 'workflow_config',
  SUPPLIERS: 'suppliers',
  SUPPLIER_BRAND_RULES: 'supplier_brand_rules',
  SUPPLIER_ORDERS: 'supplier_orders',
  WHATSAPP_CONNECTIONS: 'whatsapp_connections',
  MESSAGE_TEMPLATES: 'message_templates',
  WHATSAPP_MESSAGES: 'whatsapp_messages',
  CUSTOMERS: 'customers',
  CUSTOMER_MATCH_RULES: 'customer_match_rules',
  REFERRAL_CODES: 'referral_codes',
  PERSONALIZED_MESSAGES: 'personalized_messages',
  WORKFLOW_RULES: 'workflow_rules',
  INVENTORY_MOVEMENTS: 'inventory_movements',
  SUPPLIER_PRODUCT_AVAILABILITY: 'supplier_product_availability',
} as const;
