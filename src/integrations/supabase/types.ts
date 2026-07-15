export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      appointments: {
        Row: {
          admin_notes: string | null
          car_id: string | null
          created_at: string
          id: string
          notes: string | null
          requested_date: string
          service_id: string | null
          service_type: string
          status: Database["public"]["Enums"]["appointment_status"]
          time_slot: Database["public"]["Enums"]["time_slot"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          car_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_date: string
          service_id?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time_slot?: Database["public"]["Enums"]["time_slot"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          car_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          requested_date?: string
          service_id?: string | null
          service_type?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          time_slot?: Database["public"]["Enums"]["time_slot"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_recipients: {
        Row: {
          broadcast_id: string
          channel: string
          created_at: string
          error: string | null
          id: string
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          broadcast_id: string
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          broadcast_id?: string
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_recipients_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "broadcasts"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          link_url: string | null
          scheduled_at: string | null
          send_in_app: boolean
          send_sms: boolean
          send_whatsapp: boolean
          sent_at: string | null
          status: string
          target_filter: Json | null
          target_type: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          scheduled_at?: string | null
          send_in_app?: boolean
          send_sms?: boolean
          send_whatsapp?: boolean
          sent_at?: string | null
          status?: string
          target_filter?: Json | null
          target_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          scheduled_at?: string | null
          send_in_app?: boolean
          send_sms?: boolean
          send_whatsapp?: boolean
          sent_at?: string | null
          status?: string
          target_filter?: Json | null
          target_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      car_makes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      car_models: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          make_id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          make_id: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          make_id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "car_models_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "car_makes"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          created_at: string
          default_oil_interval_km: number
          id: string
          last_service_date: string | null
          last_service_odometer: number | null
          make: string
          make_id: string | null
          model: string | null
          model_id: string | null
          next_service_odometer: number | null
          notes: string | null
          odometer_unit: string
          odometer_value: number | null
          plate_number: string | null
          preferred_oil: string | null
          updated_at: string
          user_id: string
          year: number | null
        }
        Insert: {
          created_at?: string
          default_oil_interval_km?: number
          id?: string
          last_service_date?: string | null
          last_service_odometer?: number | null
          make: string
          make_id?: string | null
          model?: string | null
          model_id?: string | null
          next_service_odometer?: number | null
          notes?: string | null
          odometer_unit?: string
          odometer_value?: number | null
          plate_number?: string | null
          preferred_oil?: string | null
          updated_at?: string
          user_id: string
          year?: number | null
        }
        Update: {
          created_at?: string
          default_oil_interval_km?: number
          id?: string
          last_service_date?: string | null
          last_service_odometer?: number | null
          make?: string
          make_id?: string | null
          model?: string | null
          model_id?: string | null
          next_service_odometer?: number | null
          notes?: string | null
          odometer_unit?: string
          odometer_value?: number | null
          plate_number?: string | null
          preferred_oil?: string | null
          updated_at?: string
          user_id?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_make_id_fkey"
            columns: ["make_id"]
            isOneToOne: false
            referencedRelation: "car_makes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cars_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "car_models"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      loyalty_cards: {
        Row: {
          card_code: string
          created_at: string
          created_by: string | null
          discount_percent: number
          expires_at: string | null
          id: string
          issued_at: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_code: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_code?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number
          expires_at?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_logs: {
        Row: {
          body: string
          created_at: string
          id: string
          phone: string
          provider_response: string | null
          reminder_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status"]
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          phone: string
          provider_response?: string | null
          reminder_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          phone?: string
          provider_response?: string | null
          reminder_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link_to: string | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_to?: string | null
          read_at?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link_to?: string | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          attempts_count: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          max_attempts: number
          phone: string
          purpose: string
        }
        Insert: {
          attempts_count?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          max_attempts?: number
          phone: string
          purpose?: string
        }
        Update: {
          attempts_count?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          max_attempts?: number
          phone?: string
          purpose?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          notes: string | null
          phone: string | null
          phone_verified: boolean
          phone_verified_at: string | null
          updated_at: string
          weekly_fuel_fills: number
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          notes?: string | null
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          updated_at?: string
          weekly_fuel_fills?: number
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          phone_verified?: boolean
          phone_verified_at?: string | null
          updated_at?: string
          weekly_fuel_fills?: number
        }
        Relationships: []
      }
      promotions: {
        Row: {
          badge: string | null
          created_at: string
          cta_label: string | null
          cta_link: string | null
          description: string | null
          discount_percent: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price: number | null
          sort_order: number
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number | null
          sort_order?: number
          starts_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          created_at?: string
          cta_label?: string | null
          cta_link?: string | null
          description?: string | null
          discount_percent?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number | null
          sort_order?: number
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          car_id: string | null
          created_at: string
          due_date: string
          id: string
          notes: string | null
          sent_at: string | null
          service_record_id: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          car_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          notes?: string | null
          sent_at?: string | null
          service_record_id?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          car_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          sent_at?: string | null
          service_record_id?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminders_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_service_record_id_fkey"
            columns: ["service_record_id"]
            isOneToOne: false
            referencedRelation: "service_records"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          is_featured: boolean
          rating: number
          service_record_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          rating: number
          service_record_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          rating?: number
          service_record_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_records: {
        Row: {
          additives: string | null
          admin_notes: string | null
          car_id: string | null
          created_at: string
          customer_notes: string | null
          discount_amount: number | null
          filter_changed: boolean | null
          id: string
          next_odometer_unit: string | null
          next_odometer_value: number | null
          notes: string | null
          odometer_unit: string
          odometer_value: number | null
          oil_brand: string | null
          oil_type: string | null
          oil_viscosity: string | null
          service_date: string
          service_id: string | null
          staff_name: string | null
          total_amount: number | null
          user_id: string
        }
        Insert: {
          additives?: string | null
          admin_notes?: string | null
          car_id?: string | null
          created_at?: string
          customer_notes?: string | null
          discount_amount?: number | null
          filter_changed?: boolean | null
          id?: string
          next_odometer_unit?: string | null
          next_odometer_value?: number | null
          notes?: string | null
          odometer_unit?: string
          odometer_value?: number | null
          oil_brand?: string | null
          oil_type?: string | null
          oil_viscosity?: string | null
          service_date?: string
          service_id?: string | null
          staff_name?: string | null
          total_amount?: number | null
          user_id: string
        }
        Update: {
          additives?: string | null
          admin_notes?: string | null
          car_id?: string | null
          created_at?: string
          customer_notes?: string | null
          discount_amount?: number | null
          filter_changed?: boolean | null
          id?: string
          next_odometer_unit?: string | null
          next_odometer_value?: number | null
          notes?: string | null
          odometer_unit?: string
          odometer_value?: number | null
          oil_brand?: string | null
          oil_type?: string | null
          oil_viscosity?: string | null
          service_date?: string
          service_id?: string | null
          staff_name?: string | null
          total_amount?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_records_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_notification: {
        Args: {
          _body?: string
          _link_to?: string
          _title: string
          _type?: Database["public"]["Enums"]["notification_type"]
          _user_id: string
        }
        Returns: string
      }
      gen_loyalty_code: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      appointment_status: "pending" | "confirmed" | "done" | "cancelled"
      message_status: "queued" | "sent" | "failed" | "delivered"
      notification_type: "reminder" | "appointment" | "system" | "promo"
      reminder_status: "pending" | "due" | "sent" | "snoozed" | "completed"
      time_slot: "morning" | "afternoon" | "evening"
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
  public: {
    Enums: {
      app_role: ["admin", "staff", "customer"],
      appointment_status: ["pending", "confirmed", "done", "cancelled"],
      message_status: ["queued", "sent", "failed", "delivered"],
      notification_type: ["reminder", "appointment", "system", "promo"],
      reminder_status: ["pending", "due", "sent", "snoozed", "completed"],
      time_slot: ["morning", "afternoon", "evening"],
    },
  },
} as const
