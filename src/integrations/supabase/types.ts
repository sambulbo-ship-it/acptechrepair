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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          machine_id: string | null
          title: string | null
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          machine_id?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          machine_id?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          web_search_enabled: boolean
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          web_search_enabled?: boolean
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          web_search_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      app_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      diagnostic_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          machine_id: string
          photos: string[] | null
          priority: string
          technician: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          machine_id: string
          photos?: string[] | null
          priority?: string
          technician?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          machine_id?: string
          photos?: string[] | null
          priority?: string
          technician?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "diagnostic_entries_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      external_repairs: {
        Row: {
          actual_return_date: string | null
          cost: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          expected_return_date: string | null
          id: string
          issue_description: string
          machine_id: string
          notes: string | null
          repair_description: string | null
          repair_location_id: string | null
          sent_date: string
          status: string
          tracking_number: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          actual_return_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          expected_return_date?: string | null
          id?: string
          issue_description: string
          machine_id: string
          notes?: string | null
          repair_description?: string | null
          repair_location_id?: string | null
          sent_date: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          actual_return_date?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          expected_return_date?: string | null
          id?: string
          issue_description?: string
          machine_id?: string
          notes?: string | null
          repair_description?: string | null
          repair_location_id?: string | null
          sent_date?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_repairs_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_repairs_repair_location_id_fkey"
            columns: ["repair_location_id"]
            isOneToOne: false
            referencedRelation: "repair_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_repairs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_repairs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          created_by: string | null
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          photos: string[] | null
          serial_number: string | null
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          brand?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          photos?: string[] | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          photos?: string[] | null
          serial_number?: string | null
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "machines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          interval_days: number
          last_maintenance_date: string | null
          machine_id: string
          next_maintenance_date: string
          notes: string | null
          reminder_days_before: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          interval_days?: number
          last_maintenance_date?: string | null
          machine_id: string
          next_maintenance_date: string
          notes?: string | null
          reminder_days_before?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          interval_days?: number
          last_maintenance_date?: string | null
          machine_id?: string
          next_maintenance_date?: string
          notes?: string | null
          reminder_days_before?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: true
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          notify_machine_in_repair: boolean
          notify_machine_ready: boolean
          notify_maintenance_reminder: boolean
          notify_new_team_member: boolean
          notify_status_critical: boolean
          notify_stock_in: boolean
          notify_stock_out: boolean
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_machine_in_repair?: boolean
          notify_machine_ready?: boolean
          notify_maintenance_reminder?: boolean
          notify_new_team_member?: boolean
          notify_status_critical?: boolean
          notify_stock_in?: boolean
          notify_stock_out?: boolean
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_machine_in_repair?: boolean
          notify_machine_ready?: boolean
          notify_maintenance_reminder?: boolean
          notify_new_team_member?: boolean
          notify_status_critical?: boolean
          notify_stock_in?: boolean
          notify_stock_out?: boolean
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_preferences_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_sync: {
        Row: {
          created_at: string
          data: Json
          id: string
          operation: string
          record_id: string | null
          synced_at: string | null
          table_name: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          operation: string
          record_id?: string | null
          synced_at?: string | null
          table_name: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          operation?: string
          record_id?: string | null
          synced_at?: string | null
          table_name?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_sync_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_sync_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          specialties: string[] | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          specialties?: string[] | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_locations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repair_locations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_requests: {
        Row: {
          brand: string
          client_email: string
          client_name: string | null
          client_phone: string | null
          created_at: string
          description: string
          id: string
          model: string | null
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          brand: string
          client_email: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          description: string
          id?: string
          model?: string | null
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          brand?: string
          client_email?: string
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          model?: string | null
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repair_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "repair_service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      repair_service_providers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_email: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_visible: boolean
          phone: string | null
          supported_brands: string[] | null
          supported_categories: string[] | null
          updated_at: string
          website: string | null
          workspace_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          contact_email: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean
          phone?: string | null
          supported_brands?: string[] | null
          supported_categories?: string[] | null
          updated_at?: string
          website?: string | null
          workspace_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_email?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_visible?: boolean
          phone?: string | null
          supported_brands?: string[] | null
          supported_categories?: string[] | null
          updated_at?: string
          website?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      scan_history: {
        Row: {
          device_info: string | null
          found: boolean
          id: string
          machine_id: string | null
          scan_type: string
          scanned_at: string
          scanned_by: string | null
          scanned_code: string
          workspace_id: string
        }
        Insert: {
          device_info?: string | null
          found?: boolean
          id?: string
          machine_id?: string | null
          scan_type?: string
          scanned_at?: string
          scanned_by?: string | null
          scanned_code: string
          workspace_id: string
        }
        Update: {
          device_info?: string | null
          found?: boolean
          id?: string
          machine_id?: string | null
          scan_type?: string
          scanned_at?: string
          scanned_by?: string | null
          scanned_code?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_history_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_history_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      spare_parts: {
        Row: {
          category: string | null
          compatible_models: string[] | null
          created_at: string
          created_by: string | null
          currency: string | null
          id: string
          location: string | null
          min_quantity: number | null
          name: string
          notes: string | null
          part_number: string | null
          quantity: number
          supplier: string | null
          supplier_part_number: string | null
          unit_price: number | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          category?: string | null
          compatible_models?: string[] | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          name: string
          notes?: string | null
          part_number?: string | null
          quantity?: number
          supplier?: string | null
          supplier_part_number?: string | null
          unit_price?: number | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          category?: string | null
          compatible_models?: string[] | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          location?: string | null
          min_quantity?: number | null
          name?: string
          notes?: string | null
          part_number?: string | null
          quantity?: number
          supplier?: string | null
          supplier_part_number?: string | null
          unit_price?: number | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spare_parts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spare_parts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_brands: {
        Row: {
          brand_name: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          workspace_id: string
        }
        Insert: {
          brand_name: string
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          workspace_id: string
        }
        Update: {
          brand_name?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_brands_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_brands_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_settings: {
        Row: {
          created_at: string
          enable_barcode_print: boolean
          enable_barcode_scan: boolean
          enable_qrcode_print: boolean
          enable_qrcode_scan: boolean
          id: string
          require_scan_notes: boolean
          scan_history_retention_days: number
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          enable_barcode_print?: boolean
          enable_barcode_scan?: boolean
          enable_qrcode_print?: boolean
          enable_qrcode_scan?: boolean
          id?: string
          require_scan_notes?: boolean
          scan_history_retention_days?: number
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          enable_barcode_print?: boolean
          enable_barcode_scan?: boolean
          enable_qrcode_print?: boolean
          enable_qrcode_scan?: boolean
          id?: string
          require_scan_notes?: boolean
          scan_history_retention_days?: number
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_settings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: true
            referencedRelation: "workspaces_public"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          invite_code: string
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          invite_code?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          invite_code?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      workspaces_public: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string | null
          invite_code: string | null
          logo_url: string | null
          name: string | null
          primary_color: string | null
          secondary_color: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          invite_code?: never
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          secondary_color?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          invite_code?: never
          logo_url?: string | null
          name?: string | null
          primary_color?: string | null
          secondary_color?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      find_workspace_by_invite_code: {
        Args: { _invite_code: string }
        Returns: {
          created_at: string
          id: string
          name: string
        }[]
      }
      get_workspace_invite_code: {
        Args: { _workspace_id: string }
        Returns: string
      }
      is_any_workspace_admin: { Args: { _user_id: string }; Returns: boolean }
      is_app_admin: { Args: { _user_id: string }; Returns: boolean }
      is_workspace_admin: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
      is_workspace_member: {
        Args: { _user_id: string; _workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      workspace_role: "admin" | "member"
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
      workspace_role: ["admin", "member"],
    },
  },
} as const
