export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus = 'NEW' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'QRIS' | 'BANK_TRANSFER' | 'DEBIT_CARD' | 'CREDIT_CARD';
export type OrderChannel = 'ONLINE' | 'POS';
export type ServiceType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'PICKUP';
export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'REFUND';
export type SessionStatus = 'OPEN' | 'CLOSED';
export type RefundStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface Database {
  public: {
    Tables: {
      outlets: {
        Row: {
          id: string;
          code: string;
          name: string;
          address: string | null;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          code: string;
          module: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          module: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          module?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          outlet_id: string;
          name: string;
          slug: string;
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          name: string;
          slug: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          outlet_id: string;
          category_id: string | null;
          sku: string;
          name: string;
          description: string | null;
          base_price: number;
          image_url: string | null;
          is_active: boolean;
          is_available: boolean;
          display_order: number;
          current_stock: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          category_id?: string | null;
          sku: string;
          name: string;
          description?: string | null;
          base_price: number;
          image_url?: string | null;
          is_active?: boolean;
          is_available?: boolean;
          display_order?: number;
          current_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          category_id?: string | null;
          sku?: string;
          name?: string;
          description?: string | null;
          base_price?: number;
          image_url?: string | null;
          is_active?: boolean;
          is_available?: boolean;
          display_order?: number;
          current_stock?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          price_adjustment: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          price_adjustment?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          price_adjustment?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      product_addons: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          price: number;
          is_active: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          price?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          price?: number;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          outlet_id: string;
          customer_id: string | null;
          order_number: string;
          channel: OrderChannel;
          service_type: ServiceType;
          order_status: OrderStatus;
          customer_name_snapshot: string;
          customer_phone_snapshot: string;
          delivery_address_snapshot: string | null;
          subtotal: number;
          discount_amount: number;
          tax_amount: number;
          service_charge_amount: number;
          delivery_fee: number;
          grand_total: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          customer_id?: string | null;
          order_number: string;
          channel: OrderChannel;
          service_type: ServiceType;
          order_status?: OrderStatus;
          customer_name_snapshot: string;
          customer_phone_snapshot: string;
          delivery_address_snapshot?: string | null;
          subtotal: number;
          discount_amount?: number;
          tax_amount?: number;
          service_charge_amount?: number;
          delivery_fee?: number;
          grand_total: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          customer_id?: string | null;
          order_number?: string;
          channel?: OrderChannel;
          service_type?: ServiceType;
          order_status?: OrderStatus;
          customer_name_snapshot?: string;
          customer_phone_snapshot?: string;
          delivery_address_snapshot?: string | null;
          subtotal?: number;
          discount_amount?: number;
          tax_amount?: number;
          service_charge_amount?: number;
          delivery_fee?: number;
          grand_total?: number;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          sku_snapshot: string;
          variant_name_snapshot: string | null;
          addons_snapshot: Json;
          unit_price: number;
          quantity: number;
          discount_amount: number;
          line_total: number;
          item_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name_snapshot: string;
          sku_snapshot: string;
          variant_name_snapshot?: string | null;
          addons_snapshot?: Json;
          unit_price: number;
          quantity: number;
          discount_amount?: number;
          line_total: number;
          item_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name_snapshot?: string;
          sku_snapshot?: string;
          variant_name_snapshot?: string | null;
          addons_snapshot?: Json;
          unit_price?: number;
          quantity?: number;
          discount_amount?: number;
          line_total?: number;
          item_notes?: string | null;
          created_at?: string;
        };
      };
      order_payments: {
        Row: {
          id: string;
          outlet_id: string;
          order_id: string;
          payment_method: PaymentMethod;
          status: PaymentStatus;
          amount: number;
          cash_received: number | null;
          change_amount: number | null;
          reference_number: string | null;
          proof_path: string | null;
          verified_by: string | null;
          verified_at: string | null;
          idempotency_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          order_id: string;
          payment_method: PaymentMethod;
          status?: PaymentStatus;
          amount: number;
          cash_received?: number | null;
          change_amount?: number | null;
          reference_number?: string | null;
          proof_path?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          order_id?: string;
          payment_method?: PaymentMethod;
          status?: PaymentStatus;
          amount?: number;
          cash_received?: number | null;
          change_amount?: number | null;
          reference_number?: string | null;
          proof_path?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_refunds: {
        Row: {
          id: string;
          outlet_id: string;
          payment_id: string;
          refund_amount: number;
          reason: string;
          status: RefundStatus;
          requested_by: string;
          approved_by: string | null;
          approved_at: string | null;
          refunded_at: string | null;
          refund_reference: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          payment_id: string;
          refund_amount: number;
          reason: string;
          status?: RefundStatus;
          requested_by: string;
          approved_by?: string | null;
          approved_at?: string | null;
          refunded_at?: string | null;
          refund_reference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          payment_id?: string;
          refund_amount?: number;
          reason?: string;
          status?: RefundStatus;
          requested_by?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          refunded_at?: string | null;
          refund_reference?: string | null;
          created_at?: string;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          outlet_id: string;
          product_id: string;
          movement_type: MovementType;
          quantity_change: number;
          previous_stock: number;
          new_stock: number;
          reference_id: string | null;
          reason: string;
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          product_id: string;
          movement_type: MovementType;
          quantity_change: number;
          previous_stock: number;
          new_stock: number;
          reference_id?: string | null;
          reason: string;
          actor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          product_id?: string;
          movement_type?: MovementType;
          quantity_change?: number;
          previous_stock?: number;
          new_stock?: number;
          reference_id?: string | null;
          reason?: string;
          actor_id?: string | null;
          created_at?: string;
        };
      };
      cash_sessions: {
        Row: {
          id: string;
          outlet_id: string;
          opened_by: string;
          closed_by: string | null;
          opened_at: string;
          closed_at: string | null;
          opening_cash: number;
          total_cash_sales: number;
          total_non_cash_sales: number;
          total_cash_in: number;
          total_cash_out: number;
          expected_closing_cash: number | null;
          actual_closing_cash: number | null;
          discrepancy: number | null;
          status: SessionStatus;
          closing_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          opened_by: string;
          closed_by?: string | null;
          opened_at?: string;
          closed_at?: string | null;
          opening_cash: number;
          total_cash_sales?: number;
          total_non_cash_sales?: number;
          total_cash_in?: number;
          total_cash_out?: number;
          expected_closing_cash?: number | null;
          actual_closing_cash?: number | null;
          discrepancy?: number | null;
          status?: SessionStatus;
          closing_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          opened_by?: string;
          closed_by?: string | null;
          opened_at?: string;
          closed_at?: string | null;
          opening_cash?: number;
          total_cash_sales?: number;
          total_non_cash_sales?: number;
          total_cash_in?: number;
          total_cash_out?: number;
          expected_closing_cash?: number | null;
          actual_closing_cash?: number | null;
          discrepancy?: number | null;
          status?: SessionStatus;
          closing_notes?: string | null;
          created_at?: string;
        };
      };
      store_settings: {
        Row: {
          id: string;
          outlet_id: string;
          business_name: string;
          business_tagline: string | null;
          description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          operating_hours: string | null;
          whatsapp_number: string | null;
          email: string | null;
          google_maps_url: string | null;
          estimated_prep_time_minutes: number;
          is_online_ordering_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          outlet_id: string;
          business_name: string;
          business_tagline?: string | null;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          operating_hours?: string | null;
          whatsapp_number?: string | null;
          email?: string | null;
          google_maps_url?: string | null;
          estimated_prep_time_minutes?: number;
          is_online_ordering_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          outlet_id?: string;
          business_name?: string;
          business_tagline?: string | null;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          operating_hours?: string | null;
          whatsapp_number?: string | null;
          email?: string | null;
          google_maps_url?: string | null;
          estimated_prep_time_minutes?: number;
          is_online_ordering_enabled?: boolean;
          updated_at?: string;
        };
      };
    };
    Functions: {
      bootstrap_initial_owner: {
        Args: {
          p_user_id: string;
          p_full_name: string;
          p_phone?: string;
        };
        Returns: Json;
      };
      track_order_by_token: {
        Args: {
          p_token_hash: string;
        };
        Returns: Json;
      };
      has_permission: {
        Args: {
          p_permission_code: string;
        };
        Returns: boolean;
      };
      is_outlet_member: {
        Args: {
          p_outlet_id: string;
        };
        Returns: boolean;
      };
    };
  };
}
