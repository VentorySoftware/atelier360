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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          client_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          work_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          work_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          work_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_attempts: {
        Row: {
          contact_date: string | null
          contact_method: string
          created_by: string | null
          id: string
          notes: string | null
          work_id: string | null
        }
        Insert: {
          contact_date?: string | null
          contact_method: string
          created_by?: string | null
          id: string
          notes?: string | null
          work_id?: string | null
        }
        Update: {
          contact_date?: string | null
          contact_method?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          work_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_attempts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_attempts_work_id_fkey"
            columns: ["work_id"]
            isOneToOne: false
            referencedRelation: "works"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      work_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          is_active: boolean | null
          name: string
          requires_appointment: boolean | null
          tolerance_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id: string
          is_active?: boolean | null
          name: string
          requires_appointment?: boolean | null
          tolerance_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_appointment?: boolean | null
          tolerance_days?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      works: {
        Row: {
          actual_delivery_date: string | null
          amount_paid: number | null
          category_id: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          deposit_amount: number | null
          deposit_status: Database["public"]["Enums"]["payment_status"] | null
          entry_date: string
          id: string
          notes: string | null
          payment_method: string | null
          price: number
          status: Database["public"]["Enums"]["work_status"] | null
          tentative_delivery_date: string
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          amount_paid?: number | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number | null
          deposit_status?: Database["public"]["Enums"]["payment_status"] | null
          entry_date?: string
          id: string
          notes?: string | null
          payment_method?: string | null
          price: number
          status?: Database["public"]["Enums"]["work_status"] | null
          tentative_delivery_date: string
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          amount_paid?: number | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deposit_amount?: number | null
          deposit_status?: Database["public"]["Enums"]["payment_status"] | null
          entry_date?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          price?: number
          status?: Database["public"]["Enums"]["work_status"] | null
          tentative_delivery_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "works_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "work_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "works_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_formatted_id: {
        Args: { prefix: string; sequence_name: string }
        Returns: string
      }
      get_current_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      payment_status: "pending" | "partial" | "completed"
      user_role: "super_admin" | "admin"
      work_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "delivered"
        | "cancelled"
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
      payment_status: ["pending", "partial", "completed"],
      user_role: ["super_admin", "admin"],
      work_status: [
        "pending",
        "in_progress",
        "completed",
        "delivered",
        "cancelled",
      ],
    },
  },
} as const
