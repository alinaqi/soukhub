export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
export type PaymentMethod =
  | 'card'
  | 'cod'
  | 'tabby'
  | 'tamara'
  | 'payjustnow'
  | 'payflex'
  | 'bank_transfer'
  | 'other';
export type ActivityType =
  | 'order_created'
  | 'order_updated'
  | 'order_shipped'
  | 'order_delivered'
  | 'inventory_updated'
  | 'listing_created'
  | 'listing_updated'
  | 'price_changed'
  | 'sync_completed'
  | 'sync_failed'
  | 'ai_suggestion'
  | 'ai_action';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          business_name: string | null;
          phone: string | null;
          country: string;
          currency: string;
          onboarding_completed: boolean;
          onboarding_step: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          country?: string;
          currency?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          country?: string;
          currency?: string;
          onboarding_completed?: boolean;
          onboarding_step?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      marketplace_connections: {
        Row: {
          id: string;
          user_id: string;
          marketplace: MarketplaceType;
          display_name: string;
          credentials: Json | null;
          settings: Json;
          status: ConnectionStatus;
          last_sync_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          marketplace: MarketplaceType;
          display_name: string;
          credentials?: Json | null;
          settings?: Json;
          status?: ConnectionStatus;
          last_sync_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          marketplace?: MarketplaceType;
          display_name?: string;
          credentials?: Json | null;
          settings?: Json;
          status?: ConnectionStatus;
          last_sync_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string | null;
          category: string | null;
          description: string | null;
          base_price: number | null;
          cost_price: number | null;
          images: Json;
          attributes: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          brand?: string | null;
          category?: string | null;
          description?: string | null;
          base_price?: number | null;
          cost_price?: number | null;
          images?: Json;
          attributes?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          brand?: string | null;
          category?: string | null;
          description?: string | null;
          base_price?: number | null;
          cost_price?: number | null;
          images?: Json;
          attributes?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          name: string | null;
          color: string | null;
          storage: string | null;
          condition: ProductCondition;
          price: number | null;
          cost: number | null;
          weight_grams: number | null;
          dimensions: Json | null;
          barcode: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          name?: string | null;
          color?: string | null;
          storage?: string | null;
          condition?: ProductCondition;
          price?: number | null;
          cost?: number | null;
          weight_grams?: number | null;
          dimensions?: Json | null;
          barcode?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          name?: string | null;
          color?: string | null;
          storage?: string | null;
          condition?: ProductCondition;
          price?: number | null;
          cost?: number | null;
          weight_grams?: number | null;
          dimensions?: Json | null;
          barcode?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          connection_id: string | null;
          marketplace: MarketplaceType;
          marketplace_order_id: string;
          status: OrderStatus;
          fulfillment: FulfillmentType | null;
          payment_method: PaymentMethod | null;
          customer_name: string | null;
          customer_email: string | null;
          customer_phone: string | null;
          shipping_address: Json | null;
          shipping_city: string | null;
          shipping_country: string;
          subtotal: number;
          shipping_cost: number;
          tax: number;
          discount: number;
          total: number;
          currency: string;
          order_date: string;
          ship_date: string | null;
          delivery_date: string | null;
          tracking_number: string | null;
          carrier: string | null;
          notes: string | null;
          raw_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          connection_id?: string | null;
          marketplace: MarketplaceType;
          marketplace_order_id: string;
          status?: OrderStatus;
          fulfillment?: FulfillmentType | null;
          payment_method?: PaymentMethod | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          shipping_address?: Json | null;
          shipping_city?: string | null;
          shipping_country?: string;
          subtotal?: number;
          shipping_cost?: number;
          tax?: number;
          discount?: number;
          total?: number;
          currency?: string;
          order_date: string;
          ship_date?: string | null;
          delivery_date?: string | null;
          tracking_number?: string | null;
          carrier?: string | null;
          notes?: string | null;
          raw_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          connection_id?: string | null;
          marketplace?: MarketplaceType;
          marketplace_order_id?: string;
          status?: OrderStatus;
          fulfillment?: FulfillmentType | null;
          payment_method?: PaymentMethod | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          shipping_address?: Json | null;
          shipping_city?: string | null;
          shipping_country?: string;
          subtotal?: number;
          shipping_cost?: number;
          tax?: number;
          discount?: number;
          total?: number;
          currency?: string;
          order_date?: string;
          ship_date?: string | null;
          delivery_date?: string | null;
          tracking_number?: string | null;
          carrier?: string | null;
          notes?: string | null;
          raw_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string | null;
          marketplace_sku: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          condition: ProductCondition | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id?: string | null;
          marketplace_sku?: string | null;
          product_name: string;
          quantity?: number;
          unit_price: number;
          total_price: number;
          condition?: ProductCondition | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string | null;
          marketplace_sku?: string | null;
          product_name?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          condition?: ProductCondition | null;
          created_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          variant_id: string;
          connection_id: string | null;
          quantity: number;
          reserved: number;
          warehouse_location: string | null;
          reorder_point: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          connection_id?: string | null;
          quantity?: number;
          reserved?: number;
          warehouse_location?: string | null;
          reorder_point?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          connection_id?: string | null;
          quantity?: number;
          reserved?: number;
          warehouse_location?: string | null;
          reorder_point?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          activity_type: ActivityType;
          title: string;
          description: string | null;
          metadata: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type: ActivityType;
          title: string;
          description?: string | null;
          metadata?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?: ActivityType;
          title?: string;
          description?: string | null;
          metadata?: Json;
          is_read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      marketplace_type: MarketplaceType;
      connection_status: ConnectionStatus;
      product_condition: ProductCondition;
      listing_status: ListingStatus;
      order_status: OrderStatus;
      fulfillment_type: FulfillmentType;
      payment_method: PaymentMethod;
      activity_type: ActivityType;
    };
  };
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type MarketplaceConnection =
  Database['public']['Tables']['marketplace_connections']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Inventory = Database['public']['Tables']['inventory']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_log']['Row'];
