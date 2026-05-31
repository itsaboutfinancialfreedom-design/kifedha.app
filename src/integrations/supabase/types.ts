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
      profiles: {
        Row: {
          age: number | null
          country: string
          created_at: string
          dependents_ages: Json | null
          dependents_count: number | null
          email: string | null
          emergency_fund_amount: number
          full_name: string | null
          has_emergency_fund: boolean
          has_health_insurance: boolean
          has_life_insurance: boolean
          id: string
          income_frequency: string | null
          income_stability: string | null
          monthly_income: number | null
          onboarding_completed: boolean
          phone: string | null
          risk_score: number | null
          risk_tolerance: string | null
          supports_elderly: boolean | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          country?: string
          created_at?: string
          dependents_ages?: Json | null
          dependents_count?: number | null
          email?: string | null
          emergency_fund_amount?: number
          full_name?: string | null
          has_emergency_fund?: boolean
          has_health_insurance?: boolean
          has_life_insurance?: boolean
          id: string
          income_frequency?: string | null
          income_stability?: string | null
          monthly_income?: number | null
          onboarding_completed?: boolean
          phone?: string | null
          risk_score?: number | null
          risk_tolerance?: string | null
          supports_elderly?: boolean | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          country?: string
          created_at?: string
          dependents_ages?: Json | null
          dependents_count?: number | null
          email?: string | null
          emergency_fund_amount?: number
          full_name?: string | null
          has_emergency_fund?: boolean
          has_health_insurance?: boolean
          has_life_insurance?: boolean
          id?: string
          income_frequency?: string | null
          income_stability?: string | null
          monthly_income?: number | null
          onboarding_completed?: boolean
          phone?: string | null
          risk_score?: number | null
          risk_tolerance?: string | null
          supports_elderly?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id: string
          paddle_subscription_id: string
          price_id: string
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          paddle_customer_id?: string
          paddle_subscription_id?: string
          price_id?: string
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string | null
          external_ref: string | null
          id: string
          occurred_at: string
          source: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          occurred_at: string
          source?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string | null
          external_ref?: string | null
          id?: string
          occurred_at?: string
          source?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_allocations: {
        Row: {
          created_at: string
          has_dependents: boolean | null
          id: string
          investments_amount: number
          investments_percent: number
          monthly_income: number
          needs_amount: number
          needs_percent: number
          protection_amount: number
          protection_percent: number
          risk_tolerance: string | null
          savings_amount: number
          savings_percent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_dependents?: boolean | null
          id?: string
          investments_amount: number
          investments_percent: number
          monthly_income: number
          needs_amount: number
          needs_percent: number
          protection_amount: number
          protection_percent: number
          risk_tolerance?: string | null
          savings_amount: number
          savings_percent: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          has_dependents?: boolean | null
          id?: string
          investments_amount?: number
          investments_percent?: number
          monthly_income?: number
          needs_amount?: number
          needs_percent?: number
          protection_amount?: number
          protection_percent?: number
          risk_tolerance?: string | null
          savings_amount?: number
          savings_percent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_debts: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          interest_rate: number
          is_paid_off: boolean
          min_payment: number
          name: string
          paid_off_date: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          interest_rate?: number
          is_paid_off?: boolean
          min_payment?: number
          name: string
          paid_off_date?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          interest_rate?: number
          is_paid_off?: boolean
          min_payment?: number
          name?: string
          paid_off_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_debts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          created_at: string
          current_amount: number
          goal_type: string
          id: string
          is_premium_feature: boolean
          priority: string | null
          target_amount: number
          target_date: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          current_amount?: number
          goal_type: string
          id?: string
          is_premium_feature?: boolean
          priority?: string | null
          target_amount?: number
          target_date?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          current_amount?: number
          goal_type?: string
          id?: string
          is_premium_feature?: boolean
          priority?: string | null
          target_amount?: number
          target_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          created_at: string
          enabled: boolean
          frequency: string | null
          id: string
          last_sent: string | null
          notification_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          frequency?: string | null
          id?: string
          last_sent?: string | null
          notification_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          frequency?: string | null
          id?: string
          last_sent?: string | null
          notification_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_protection_gaps: {
        Row: {
          assessed_at: string
          health_insurance_gap: number
          id: string
          income_protection_gap: number
          inputs: Json
          life_insurance_gap: number
          protection_score: number
          total_gap: number
          user_id: string
        }
        Insert: {
          assessed_at?: string
          health_insurance_gap?: number
          id?: string
          income_protection_gap?: number
          inputs?: Json
          life_insurance_gap?: number
          protection_score?: number
          total_gap?: number
          user_id: string
        }
        Update: {
          assessed_at?: string
          health_insurance_gap?: number
          id?: string
          income_protection_gap?: number
          inputs?: Json
          life_insurance_gap?: number
          protection_score?: number
          total_gap?: number
          user_id?: string
        }
        Relationships: []
      }
      user_reminders: {
        Row: {
          id: string
          reference: string | null
          reminder_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          reference?: string | null
          reminder_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          reference?: string | null
          reminder_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_risk_profiles: {
        Row: {
          answers: Json
          assessed_at: string
          id: string
          risk_level: string
          risk_score: number
          user_id: string
        }
        Insert: {
          answers?: Json
          assessed_at?: string
          id?: string
          risk_level: string
          risk_score: number
          user_id: string
        }
        Update: {
          answers?: Json
          assessed_at?: string
          id?: string
          risk_level?: string
          risk_score?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
