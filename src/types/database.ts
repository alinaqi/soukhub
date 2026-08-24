// Database types for SoukHub
// These types match the Supabase schema

// ============================================
// ENUMS
// ============================================

export type MarketplaceType = 'amazon' | 'cartlow' | 'revibe' | 'noon' | 'other';
export type ConnectionStatus = 'pending' | 'active' | 'error' | 'disconnected';
export type ProductCondition = 'new' | 'excellent' | 'very_good' | 'good' | 'fair' | 'renewed';
export type ListingStatus = 'draft' | 'active' | 'paused' | 'out_of_stock' | 'error';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';
export type FulfillmentType = 'fbs' | 'fbc' | 'fbm' | 'easy_ship' | 'self_ship';
export type PaymentMethod = 'card' | 'cod' | 'tabby' | 'tamara' | 'payjustnow' | 'payflex' | 'bank_transfer' | 'other';
export type TeamRole = 'owner' | 'manager' | 'packer' | 'viewer';
export type FulfillmentModel = 'self_fulfilled' | 'supplier_fulfilled' | 'hybrid';
export type ProductAvailability = 'in_stock' | 'available_on_demand' | 'discontinued';
export type SupplierOrderStatus =
  | 'pending_send'
  | 'sent'
  | 'confirmed'
  | 'unavailable'
  | 'alternative_offered'
  | 'delivered_to_seller'
  | 'packed'
  | 'shipped';
export type WhatsAppStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type TemplateType = 'supplier_order' | 'supplier_batch' | 'customer_update' | 'thank_you' | 'referral';
export type MessageDirection = 'outgoing' | 'incoming';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
export type PersonalizedMessageType = 'thank_you' | 'birthday' | 'referral' | 'custom';
export type WorkflowRuleType = 'packing' | 'shipping' | 'receiving' | 'order_priority';
export type InventoryLocation =
  | 'at_supplier'
  | 'ordered'
  | 'in_transit'
  | 'at_warehouse'
  | 'reserved'
  | 'packed'
  | 'shipped';
export type PreferredContact = 'whatsapp' | 'email' | 'both';

// ============================================
// BASE TABLES
// ============================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  business_name: string | null;
  phone: string | null;
  country: string;
  currency: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  owner_user_id: string;
  name: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string | null;
  organization_id: string;
  owner_user_id: string;
  role: TeamRole;
  name: string;
  email: string | null;
  phone: string | null;
  pin_code: string | null;
  is_active: boolean;
  permissions: Record<string, boolean>;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamSession {
  id: string;
  team_member_id: string;
  device_id: string | null;
  started_at: string;
  ended_at: string | null;
}

// ============================================
// WORKFLOW & SUPPLIERS
// ============================================

export interface WorkflowConfig {
  id: string;
  user_id: string;
  organization_id: string | null;
  fulfillment_model: FulfillmentModel;
  packing_location: string | null;
  delivery_schedule: Record<string, string[]>;
  auto_route_orders: boolean;
  auto_send_supplier_messages: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  whatsapp_number: string;
  secondary_whatsapp: string | null;
  email: string | null;
  secondary_email: string | null;
  preferred_contact: PreferredContact;
  contact_notes: string | null;
  delivery_times: string[];
  notes: string | null;
  is_active: boolean;
  avg_response_minutes: number | null;
  avg_fulfillment_hours: number | null;
  created_at: string;
  updated_at: string;
}

export interface SupplierBrandRule {
  id: string;
  user_id: string;
  supplier_id: string;
  brand: string;
  category: string | null;
  priority: number;
  created_at: string;
}

export interface SupplierOrder {
  id: string;
  user_id: string;
  organization_id: string | null;
  supplier_id: string;
  order_id: string;
  status: SupplierOrderStatus;
  sent_at: string | null;
  sent_via: 'whatsapp' | 'email' | 'both' | null;
  supplier_response: string | null;
  alternative_product: string | null;
  response_confidence: number | null;
  requires_manual_review: boolean;
  expected_delivery_at: string | null;
  delivered_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// WHATSAPP & MESSAGING
// ============================================

export interface WhatsAppConnection {
  id: string;
  user_id: string;
  organization_id: string | null;
  status: WhatsAppStatus;
  phone_number: string | null;
  last_connected_at: string | null;
  session_data: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  template_type: TemplateType;
  content: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  user_id: string;
  organization_id: string | null;
  supplier_order_id: string | null;
  supplier_id: string | null;
  direction: MessageDirection;
  phone_number: string;
  message_content: string;
  status: MessageStatus;
  whatsapp_message_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  parsed_intent: string | null;
  parsed_data: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// CUSTOMERS & CRM
// ============================================

export interface Customer {
  id: string;
  user_id: string;
  organization_id: string | null;
  email: string | null;
  phone: string | null;
  name: string | null;
  total_orders: number;
  total_spent: number;
  first_order_date: string | null;
  last_order_date: string | null;
  tags: string[];
  notes: string | null;
  is_vip: boolean;
  preferred_contact_method: string | null;
  addresses: Address[];
  created_at: string;
  updated_at: string;
}

export interface Address {
  type: 'shipping' | 'billing';
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
}

export interface CustomerMatchRule {
  id: string;
  user_id: string;
  match_by: 'email' | 'phone' | 'name_and_city';
  priority: number;
  is_active: boolean;
  created_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  organization_id: string | null;
  customer_id: string | null;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  max_uses: number | null;
  times_used: number;
  expires_at: string | null;
  created_at: string;
}

export interface PersonalizedMessage {
  id: string;
  user_id: string;
  order_id: string | null;
  customer_id: string | null;
  message_type: PersonalizedMessageType;
  content: string;
  printed: boolean;
  created_at: string;
}

// ============================================
// WORKFLOW RULES
// ============================================

export interface WorkflowRule {
  id: string;
  organization_id: string | null;
  user_id: string;
  rule_type: WorkflowRuleType;
  config: PackingConfig | ShippingConfig | OrderPriorityConfig;
  created_at: string;
  updated_at: string;
}

export interface PackingConfig {
  on_packed: {
    auto_print_label: boolean;
    auto_print_slip: boolean;
    require_scan: boolean;
    auto_advance: boolean;
  };
  sounds: {
    success: boolean;
    error: boolean;
  };
}

export interface ShippingConfig {
  group_by: 'marketplace' | 'destination' | 'carrier';
  auto_mark_shipped: boolean;
}

export interface OrderPriorityConfig {
  priority_mode: 'fifo' | 'delivery_cutoff' | 'marketplace';
  urgent_threshold_hours: number;
}

// ============================================
// INVENTORY TRACKING
// ============================================

export interface InventoryMovement {
  id: string;
  user_id: string;
  organization_id: string | null;
  variant_id: string | null;
  from_location: InventoryLocation | null;
  to_location: InventoryLocation;
  quantity: number;
  order_id: string | null;
  supplier_order_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface SupplierProductAvailability {
  id: string;
  user_id: string;
  supplier_id: string;
  product_name: string;
  brand: string | null;
  model: string | null;
  is_available: boolean | null;
  last_confirmed_at: string | null;
  avg_fulfillment_hours: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// DASHBOARD VIEWS
// ============================================

export interface OrderPipelineCounts {
  user_id: string;
  new_count: number;
  processing_count: number;
  confirmed_count: number;
  ready_count: number;
  shipped_today: number;
  delivered_today: number;
}

export interface SupplierOrderCounts {
  user_id: string;
  supplier_id: string;
  supplier_name: string;
  pending_send_count: number;
  awaiting_reply_count: number;
  confirmed_count: number;
  unavailable_count: number;
  avg_response_minutes: number | null;
}

export interface InventorySummary {
  user_id: string;
  total_products: number;
  total_units: number;
  available_units: number;
  reserved_units: number;
  low_stock_count: number;
  out_of_stock_count: number;
}

// ============================================
// EXTENDED TYPES (for API responses)
// ============================================

export interface SupplierWithBrands extends Supplier {
  brands: string[];
  pending_orders_count?: number;
}

export interface CustomerWithStats extends Customer {
  is_repeat: boolean;
  order_count: number;
}

export interface SupplierOrderWithDetails extends SupplierOrder {
  supplier: Supplier;
  order: {
    id: string;
    marketplace_order_id: string;
    customer_name: string;
    shipping_city: string;
  };
  items: {
    product_name: string;
    quantity: number;
  }[];
}
