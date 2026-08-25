export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string | null
          description: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_match_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          match_by: string
          org_id: string | null
          priority: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_by: string
          org_id?: string | null
          priority?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_by?: string
          org_id?: string | null
          priority?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_match_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_match_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          addresses: Json | null
          created_at: string | null
          email: string | null
          first_order_date: string | null
          id: string
          is_vip: boolean | null
          last_order_date: string | null
          name: string | null
          notes: string | null
          org_id: string | null
          organization_id: string | null
          phone: string | null
          preferred_contact_method: string | null
          tags: string[] | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          addresses?: Json | null
          created_at?: string | null
          email?: string | null
          first_order_date?: string | null
          id?: string
          is_vip?: boolean | null
          last_order_date?: string | null
          name?: string | null
          notes?: string | null
          org_id?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          addresses?: Json | null
          created_at?: string | null
          email?: string | null
          first_order_date?: string | null
          id?: string
          is_vip?: boolean | null
          last_order_date?: string | null
          name?: string | null
          notes?: string | null
          org_id?: string | null
          organization_id?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          tags?: string[] | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          connection_id: string | null
          created_at: string | null
          id: string
          quantity: number
          reorder_point: number | null
          reserved: number
          updated_at: string | null
          variant_id: string
          warehouse_location: string | null
        }
        Insert: {
          connection_id?: string | null
          created_at?: string | null
          id?: string
          quantity?: number
          reorder_point?: number | null
          reserved?: number
          updated_at?: string | null
          variant_id: string
          warehouse_location?: string | null
        }
        Update: {
          connection_id?: string | null
          created_at?: string | null
          id?: string
          quantity?: number
          reorder_point?: number | null
          reserved?: number
          updated_at?: string | null
          variant_id?: string
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "marketplace_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string | null
          from_location:
            | Database["public"]["Enums"]["inventory_location"]
            | null
          id: string
          notes: string | null
          order_id: string | null
          organization_id: string | null
          quantity: number
          supplier_order_id: string | null
          to_location: Database["public"]["Enums"]["inventory_location"]
          user_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_location?:
            | Database["public"]["Enums"]["inventory_location"]
            | null
          id?: string
          notes?: string | null
          order_id?: string | null
          organization_id?: string | null
          quantity: number
          supplier_order_id?: string | null
          to_location: Database["public"]["Enums"]["inventory_location"]
          user_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_location?:
            | Database["public"]["Enums"]["inventory_location"]
            | null
          id?: string
          notes?: string | null
          order_id?: string | null
          organization_id?: string | null
          quantity?: number
          supplier_order_id?: string | null
          to_location?: Database["public"]["Enums"]["inventory_location"]
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_supplier_order_id_fkey"
            columns: ["supplier_order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_connections: {
        Row: {
          created_at: string | null
          credentials: Json | null
          display_name: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          marketplace: Database["public"]["Enums"]["marketplace_type"]
          org_id: string | null
          settings: Json | null
          status: Database["public"]["Enums"]["connection_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credentials?: Json | null
          display_name: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          marketplace: Database["public"]["Enums"]["marketplace_type"]
          org_id?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credentials?: Json | null
          display_name?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          marketplace?: Database["public"]["Enums"]["marketplace_type"]
          org_id?: string | null
          settings?: Json | null
          status?: Database["public"]["Enums"]["connection_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_listings: {
        Row: {
          connection_id: string
          created_at: string | null
          id: string
          last_sync_at: string | null
          listing_url: string | null
          marketplace_product_id: string | null
          marketplace_sku: string | null
          price: number | null
          status: Database["public"]["Enums"]["listing_status"] | null
          sync_status: Json | null
          updated_at: string | null
          variant_id: string
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          listing_url?: string | null
          marketplace_product_id?: string | null
          marketplace_sku?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          sync_status?: Json | null
          updated_at?: string | null
          variant_id: string
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          listing_url?: string | null
          marketplace_product_id?: string | null
          marketplace_sku?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          sync_status?: Json | null
          updated_at?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "marketplace_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_listings_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          org_id: string | null
          organization_id: string | null
          template_type: Database["public"]["Enums"]["template_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          org_id?: string | null
          organization_id?: string | null
          template_type: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          org_id?: string | null
          organization_id?: string | null
          template_type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          condition: Database["public"]["Enums"]["product_condition"] | null
          created_at: string | null
          id: string
          marketplace_sku: string | null
          order_id: string
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["product_condition"] | null
          created_at?: string | null
          id?: string
          marketplace_sku?: string | null
          order_id: string
          product_name: string
          quantity?: number
          total_price: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["product_condition"] | null
          created_at?: string | null
          id?: string
          marketplace_sku?: string | null
          order_id?: string
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          alternative_offered_product_id: string | null
          carrier: string | null
          connection_id: string | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_response: string | null
          delivery_date: string | null
          discount: number | null
          fulfillment: Database["public"]["Enums"]["fulfillment_type"] | null
          id: string
          marketplace: Database["public"]["Enums"]["marketplace_type"]
          marketplace_order_id: string
          notes: string | null
          order_date: string
          org_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          raw_data: Json | null
          requires_supplier: boolean | null
          routed_at: string | null
          ship_date: string | null
          shipping_address: Json | null
          shipping_city: string | null
          shipping_cost: number | null
          shipping_country: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number | null
          supplier_order_id: string | null
          tax: number | null
          total: number | null
          tracking_number: string | null
          unavailable_handled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alternative_offered_product_id?: string | null
          carrier?: string | null
          connection_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_response?: string | null
          delivery_date?: string | null
          discount?: number | null
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"] | null
          id?: string
          marketplace: Database["public"]["Enums"]["marketplace_type"]
          marketplace_order_id: string
          notes?: string | null
          order_date: string
          org_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          raw_data?: Json | null
          requires_supplier?: boolean | null
          routed_at?: string | null
          ship_date?: string | null
          shipping_address?: Json | null
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_country?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          supplier_order_id?: string | null
          tax?: number | null
          total?: number | null
          tracking_number?: string | null
          unavailable_handled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alternative_offered_product_id?: string | null
          carrier?: string | null
          connection_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_response?: string | null
          delivery_date?: string | null
          discount?: number | null
          fulfillment?: Database["public"]["Enums"]["fulfillment_type"] | null
          id?: string
          marketplace?: Database["public"]["Enums"]["marketplace_type"]
          marketplace_order_id?: string
          notes?: string | null
          order_date?: string
          org_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          raw_data?: Json | null
          requires_supplier?: boolean | null
          routed_at?: string | null
          ship_date?: string | null
          shipping_address?: Json | null
          shipping_city?: string | null
          shipping_cost?: number | null
          shipping_country?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number | null
          supplier_order_id?: string | null
          tax?: number | null
          total?: number | null
          tracking_number?: string | null
          unavailable_handled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_alternative_offered_product_id_fkey"
            columns: ["alternative_offered_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "marketplace_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_supplier_order_id_fkey"
            columns: ["supplier_order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          bio: string | null
          bio_ar: string | null
          commission_bps: number
          created_at: string | null
          id: string
          is_published: boolean
          logo_url: string | null
          name: string
          name_ar: string | null
          owner_user_id: string
          settings: Json | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          bio_ar?: string | null
          commission_bps?: number
          created_at?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name: string
          name_ar?: string | null
          owner_user_id: string
          settings?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          bio_ar?: string | null
          commission_bps?: number
          created_at?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          name?: string
          name_ar?: string | null
          owner_user_id?: string
          settings?: Json | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personalized_messages: {
        Row: {
          content: string
          created_at: string | null
          customer_id: string | null
          id: string
          message_type: Database["public"]["Enums"]["personalized_message_type"]
          order_id: string | null
          org_id: string | null
          printed: boolean | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          message_type: Database["public"]["Enums"]["personalized_message_type"]
          order_id?: string | null
          org_id?: string | null
          printed?: boolean | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          customer_id?: string | null
          id?: string
          message_type?: Database["public"]["Enums"]["personalized_message_type"]
          order_id?: string | null
          org_id?: string | null
          printed?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "personalized_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personalized_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personalized_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personalized_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          color: string | null
          condition: Database["public"]["Enums"]["product_condition"] | null
          cost: number | null
          created_at: string | null
          dimensions: Json | null
          id: string
          is_active: boolean | null
          name: string | null
          price: number | null
          product_id: string
          sku: string
          storage: string | null
          updated_at: string | null
          weight_grams: number | null
        }
        Insert: {
          barcode?: string | null
          color?: string | null
          condition?: Database["public"]["Enums"]["product_condition"] | null
          cost?: number | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          price?: number | null
          product_id: string
          sku: string
          storage?: string | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Update: {
          barcode?: string | null
          color?: string | null
          condition?: Database["public"]["Enums"]["product_condition"] | null
          cost?: number | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          price?: number | null
          product_id?: string
          sku?: string
          storage?: string | null
          updated_at?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json | null
          availability_type:
            | Database["public"]["Enums"]["product_availability"]
            | null
          base_price: number | null
          brand: string | null
          category: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          description_ar: string | null
          id: string
          images: Json | null
          is_active: boolean | null
          is_published: boolean
          name: string
          org_id: string | null
          preferred_supplier_id: string | null
          search_vector: unknown
          short_id: string | null
          slug: string | null
          title_ar: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attributes?: Json | null
          availability_type?:
            | Database["public"]["Enums"]["product_availability"]
            | null
          base_price?: number | null
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_published?: boolean
          name: string
          org_id?: string | null
          preferred_supplier_id?: string | null
          search_vector?: unknown
          short_id?: string | null
          slug?: string | null
          title_ar?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attributes?: Json | null
          availability_type?:
            | Database["public"]["Enums"]["product_availability"]
            | null
          base_price?: number | null
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          description_ar?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_published?: boolean
          name?: string
          org_id?: string | null
          preferred_supplier_id?: string | null
          search_vector?: unknown
          short_id?: string | null
          slug?: string | null
          title_ar?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_name: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          email: string
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          organization_id: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          business_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          business_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          discount_percent: number | null
          expires_at: string | null
          id: string
          max_uses: number | null
          org_id: string | null
          organization_id: string | null
          times_used: number | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          org_id?: string | null
          organization_id?: string | null
          times_used?: number | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          org_id?: string | null
          organization_id?: string | null
          times_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_codes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_brand_rules: {
        Row: {
          brand: string
          category: string | null
          created_at: string | null
          id: string
          org_id: string | null
          priority: number | null
          supplier_id: string
          user_id: string
        }
        Insert: {
          brand: string
          category?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          priority?: number | null
          supplier_id: string
          user_id: string
        }
        Update: {
          brand?: string
          category?: string | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          priority?: number | null
          supplier_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_brand_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_brand_rules_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_brand_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_orders: {
        Row: {
          alternative_product: string | null
          created_at: string | null
          delivered_at: string | null
          expected_delivery_at: string | null
          id: string
          order_id: string
          org_id: string | null
          organization_id: string | null
          packed_at: string | null
          requires_manual_review: boolean | null
          response_confidence: number | null
          sent_at: string | null
          sent_via: string | null
          shipped_at: string | null
          status: Database["public"]["Enums"]["supplier_order_status"] | null
          supplier_id: string
          supplier_response: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alternative_product?: string | null
          created_at?: string | null
          delivered_at?: string | null
          expected_delivery_at?: string | null
          id?: string
          order_id: string
          org_id?: string | null
          organization_id?: string | null
          packed_at?: string | null
          requires_manual_review?: boolean | null
          response_confidence?: number | null
          sent_at?: string | null
          sent_via?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["supplier_order_status"] | null
          supplier_id: string
          supplier_response?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alternative_product?: string | null
          created_at?: string | null
          delivered_at?: string | null
          expected_delivery_at?: string | null
          id?: string
          order_id?: string
          org_id?: string | null
          organization_id?: string | null
          packed_at?: string | null
          requires_manual_review?: boolean | null
          response_confidence?: number | null
          sent_at?: string | null
          sent_via?: string | null
          shipped_at?: string | null
          status?: Database["public"]["Enums"]["supplier_order_status"] | null
          supplier_id?: string
          supplier_response?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_product_availability: {
        Row: {
          avg_fulfillment_hours: number | null
          brand: string | null
          created_at: string | null
          id: string
          is_available: boolean | null
          last_confirmed_at: string | null
          model: string | null
          notes: string | null
          product_name: string
          supplier_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_fulfillment_hours?: number | null
          brand?: string | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          last_confirmed_at?: string | null
          model?: string | null
          notes?: string | null
          product_name: string
          supplier_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_fulfillment_hours?: number | null
          brand?: string | null
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          last_confirmed_at?: string | null
          model?: string | null
          notes?: string | null
          product_name?: string
          supplier_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_product_availability_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_product_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          avg_fulfillment_hours: number | null
          avg_response_minutes: number | null
          contact_notes: string | null
          created_at: string | null
          delivery_times: string[] | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          org_id: string | null
          organization_id: string | null
          preferred_contact: string | null
          secondary_email: string | null
          secondary_whatsapp: string | null
          updated_at: string | null
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          avg_fulfillment_hours?: number | null
          avg_response_minutes?: number | null
          contact_notes?: string | null
          created_at?: string | null
          delivery_times?: string[] | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          org_id?: string | null
          organization_id?: string | null
          preferred_contact?: string | null
          secondary_email?: string | null
          secondary_whatsapp?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_number: string
        }
        Update: {
          avg_fulfillment_hours?: number | null
          avg_response_minutes?: number | null
          contact_notes?: string | null
          created_at?: string | null
          delivery_times?: string[] | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          org_id?: string | null
          organization_id?: string | null
          preferred_contact?: string | null
          secondary_email?: string | null
          secondary_whatsapp?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          last_active_at: string | null
          name: string
          organization_id: string
          owner_user_id: string
          permissions: Json | null
          phone: string | null
          pin_code: string | null
          role: Database["public"]["Enums"]["team_role"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          name: string
          organization_id: string
          owner_user_id: string
          permissions?: Json | null
          phone?: string | null
          pin_code?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_active_at?: string | null
          name?: string
          organization_id?: string
          owner_user_id?: string
          permissions?: Json | null
          phone?: string | null
          pin_code?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_sessions: {
        Row: {
          device_id: string | null
          ended_at: string | null
          id: string
          started_at: string | null
          team_member_id: string
        }
        Insert: {
          device_id?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          team_member_id: string
        }
        Update: {
          device_id?: string | null
          ended_at?: string | null
          id?: string
          started_at?: string | null
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_sessions_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          last_connected_at: string | null
          organization_id: string | null
          phone_number: string | null
          session_data: string | null
          status: Database["public"]["Enums"]["whatsapp_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_connected_at?: string | null
          organization_id?: string | null
          phone_number?: string | null
          session_data?: string | null
          status?: Database["public"]["Enums"]["whatsapp_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_connected_at?: string | null
          organization_id?: string | null
          phone_number?: string | null
          session_data?: string | null
          status?: Database["public"]["Enums"]["whatsapp_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          message_content: string
          org_id: string | null
          organization_id: string | null
          parsed_data: Json | null
          parsed_intent: string | null
          phone_number: string
          read_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          supplier_id: string | null
          supplier_order_id: string | null
          user_id: string
          whatsapp_message_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          message_content: string
          org_id?: string | null
          organization_id?: string | null
          parsed_data?: Json | null
          parsed_intent?: string | null
          phone_number: string
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          supplier_id?: string | null
          supplier_order_id?: string | null
          user_id: string
          whatsapp_message_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          message_content?: string
          org_id?: string | null
          organization_id?: string | null
          parsed_data?: Json | null
          parsed_intent?: string | null
          phone_number?: string
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          supplier_id?: string | null
          supplier_order_id?: string | null
          user_id?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_supplier_order_id_fkey"
            columns: ["supplier_order_id"]
            isOneToOne: false
            referencedRelation: "supplier_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_config: {
        Row: {
          auto_route_orders: boolean | null
          auto_send_supplier_messages: boolean | null
          created_at: string | null
          delivery_schedule: Json | null
          fulfillment_model:
            | Database["public"]["Enums"]["fulfillment_model"]
            | null
          id: string
          org_id: string | null
          organization_id: string | null
          packing_location: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_route_orders?: boolean | null
          auto_send_supplier_messages?: boolean | null
          created_at?: string | null
          delivery_schedule?: Json | null
          fulfillment_model?:
            | Database["public"]["Enums"]["fulfillment_model"]
            | null
          id?: string
          org_id?: string | null
          organization_id?: string | null
          packing_location?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_route_orders?: boolean | null
          auto_send_supplier_messages?: boolean | null
          created_at?: string | null
          delivery_schedule?: Json | null
          fulfillment_model?:
            | Database["public"]["Enums"]["fulfillment_model"]
            | null
          id?: string
          org_id?: string | null
          organization_id?: string | null
          packing_location?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_config_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_rules: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          org_id: string | null
          organization_id: string | null
          rule_type: Database["public"]["Enums"]["workflow_rule_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          org_id?: string | null
          organization_id?: string | null
          rule_type: Database["public"]["Enums"]["workflow_rule_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          org_id?: string | null
          organization_id?: string | null
          rule_type?: Database["public"]["Enums"]["workflow_rule_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_rules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      inventory_summary: {
        Row: {
          available_units: number | null
          low_stock_count: number | null
          out_of_stock_count: number | null
          reserved_units: number | null
          total_products: number | null
          total_units: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_pipeline_counts: {
        Row: {
          confirmed_count: number | null
          delivered_today: number | null
          new_count: number | null
          processing_count: number | null
          ready_count: number | null
          shipped_today: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_order_counts: {
        Row: {
          avg_response_minutes: number | null
          awaiting_reply_count: number | null
          confirmed_count: number | null
          pending_send_count: number | null
          supplier_id: string | null
          supplier_name: string | null
          unavailable_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      ensure_org_for_user: { Args: { p_user_id: string }; Returns: string }
      find_or_create_customer: {
        Args: {
          p_city?: string
          p_email: string
          p_name: string
          p_phone: string
          p_user_id: string
        }
        Returns: string
      }
      generate_referral_code: { Args: { p_length?: number }; Returns: string }
      is_org_member: { Args: { check_org: string }; Returns: boolean }
      log_activity: {
        Args: {
          p_description?: string
          p_metadata?: Json
          p_title: string
          p_type: Database["public"]["Enums"]["activity_type"]
          p_user_id: string
        }
        Returns: string
      }
      refresh_dashboard_views: { Args: never; Returns: undefined }
      route_order_to_supplier: { Args: { p_order_id: string }; Returns: string }
      search_listings: {
        Args: {
          p_brand?: string
          p_category?: string
          p_limit?: number
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_query?: string
        }
        Returns: {
          base_price: number
          brand: string
          category: string
          id: string
          images: Json
          name: string
          org_id: string
          rank: number
          short_id: string
          slug: string
          store_name: string
          store_slug: string
          title_ar: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { input: string }; Returns: string }
    }
    Enums: {
      activity_type:
        | "order_created"
        | "order_updated"
        | "order_shipped"
        | "order_delivered"
        | "inventory_updated"
        | "listing_created"
        | "listing_updated"
        | "price_changed"
        | "sync_completed"
        | "sync_failed"
        | "ai_suggestion"
        | "ai_action"
      connection_status: "pending" | "active" | "error" | "disconnected"
      fulfillment_model: "self_fulfilled" | "supplier_fulfilled" | "hybrid"
      fulfillment_type: "fbs" | "fbc" | "fbm" | "easy_ship" | "self_ship"
      inventory_location:
        | "at_supplier"
        | "ordered"
        | "in_transit"
        | "at_warehouse"
        | "reserved"
        | "packed"
        | "shipped"
      listing_status: "draft" | "active" | "paused" | "out_of_stock" | "error"
      marketplace_type: "amazon" | "cartlow" | "revibe" | "noon" | "other"
      message_direction: "outgoing" | "incoming"
      message_status: "pending" | "sent" | "delivered" | "read" | "failed"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "ready_to_ship"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "returned"
        | "refunded"
      payment_method:
        | "card"
        | "cod"
        | "tabby"
        | "tamara"
        | "payjustnow"
        | "payflex"
        | "bank_transfer"
        | "other"
      personalized_message_type:
        | "thank_you"
        | "birthday"
        | "referral"
        | "custom"
      product_availability: "in_stock" | "available_on_demand" | "discontinued"
      product_condition:
        | "new"
        | "excellent"
        | "very_good"
        | "good"
        | "fair"
        | "renewed"
      supplier_order_status:
        | "pending_send"
        | "sent"
        | "confirmed"
        | "unavailable"
        | "alternative_offered"
        | "delivered_to_seller"
        | "packed"
        | "shipped"
      team_role: "owner" | "manager" | "packer" | "viewer"
      template_type:
        | "supplier_order"
        | "supplier_batch"
        | "customer_update"
        | "thank_you"
        | "referral"
      whatsapp_status: "disconnected" | "connecting" | "connected" | "error"
      workflow_rule_type:
        | "packing"
        | "shipping"
        | "receiving"
        | "order_priority"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "order_created",
        "order_updated",
        "order_shipped",
        "order_delivered",
        "inventory_updated",
        "listing_created",
        "listing_updated",
        "price_changed",
        "sync_completed",
        "sync_failed",
        "ai_suggestion",
        "ai_action",
      ],
      connection_status: ["pending", "active", "error", "disconnected"],
      fulfillment_model: ["self_fulfilled", "supplier_fulfilled", "hybrid"],
      fulfillment_type: ["fbs", "fbc", "fbm", "easy_ship", "self_ship"],
      inventory_location: [
        "at_supplier",
        "ordered",
        "in_transit",
        "at_warehouse",
        "reserved",
        "packed",
        "shipped",
      ],
      listing_status: ["draft", "active", "paused", "out_of_stock", "error"],
      marketplace_type: ["amazon", "cartlow", "revibe", "noon", "other"],
      message_direction: ["outgoing", "incoming"],
      message_status: ["pending", "sent", "delivered", "read", "failed"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "ready_to_ship",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
        "refunded",
      ],
      payment_method: [
        "card",
        "cod",
        "tabby",
        "tamara",
        "payjustnow",
        "payflex",
        "bank_transfer",
        "other",
      ],
      personalized_message_type: [
        "thank_you",
        "birthday",
        "referral",
        "custom",
      ],
      product_availability: ["in_stock", "available_on_demand", "discontinued"],
      product_condition: [
        "new",
        "excellent",
        "very_good",
        "good",
        "fair",
        "renewed",
      ],
      supplier_order_status: [
        "pending_send",
        "sent",
        "confirmed",
        "unavailable",
        "alternative_offered",
        "delivered_to_seller",
        "packed",
        "shipped",
      ],
      team_role: ["owner", "manager", "packer", "viewer"],
      template_type: [
        "supplier_order",
        "supplier_batch",
        "customer_update",
        "thank_you",
        "referral",
      ],
      whatsapp_status: ["disconnected", "connecting", "connected", "error"],
      workflow_rule_type: [
        "packing",
        "shipping",
        "receiving",
        "order_priority",
      ],
    },
  },
} as const


// Convenience type exports
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Product = Tables<'products'>
export type ProductVariant = Tables<'product_variants'>
export type Inventory = Tables<'inventory'>
export type Profile = Tables<'profiles'>
export type MarketplaceConnection = Tables<'marketplace_connections'>
export type MarketplaceListing = Tables<'marketplace_listings'>
export type ActivityLog = Tables<'activity_log'>
export type Customer = Tables<'customers'>
export type Supplier = Tables<'suppliers'>
export type SupplierOrder = Tables<'supplier_orders'>
export type SupplierBrandRule = Tables<'supplier_brand_rules'>
export type TeamMember = Tables<'team_members'>
export type TeamSession = Tables<'team_sessions'>
export type Organization = Tables<'organizations'>
export type WorkflowConfig = Tables<'workflow_config'>
export type WorkflowRule = Tables<'workflow_rules'>
export type WhatsAppConnection = Tables<'whatsapp_connections'>
export type WhatsAppMessage = Tables<'whatsapp_messages'>
export type MessageTemplate = Tables<'message_templates'>
export type InventoryMovement = Tables<'inventory_movements'>

// Enum type exports
export type OrderStatus = Enums<'order_status'>
export type FulfillmentType = Enums<'fulfillment_type'>
export type PaymentMethod = Enums<'payment_method'>
export type MarketplaceType = Enums<'marketplace_type'>
export type ProductCondition = Enums<'product_condition'>
export type ActivityType = Enums<'activity_type'>
export type ConnectionStatus = Enums<'connection_status'>
export type ListingStatus = Enums<'listing_status'>
export type TeamRole = Enums<'team_role'>
export type FulfillmentModel = Enums<'fulfillment_model'>
export type SupplierOrderStatus = Enums<'supplier_order_status'>
export type WhatsAppStatus = Enums<'whatsapp_status'>
export type InventoryLocation = Enums<'inventory_location'>
