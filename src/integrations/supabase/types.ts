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
      access_logs: {
        Row: {
          accessed_at: string
          device_type: string | null
          email: string
          id: string
          language: string
          user_id: string
        }
        Insert: {
          accessed_at?: string
          device_type?: string | null
          email: string
          id?: string
          language: string
          user_id: string
        }
        Update: {
          accessed_at?: string
          device_type?: string | null
          email?: string
          id?: string
          language?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_replies: {
        Row: {
          comment_id: string
          content: string
          created_at: string
          id: string
          language: string
          status: Database["public"]["Enums"]["comment_status"]
          user_id: string
        }
        Insert: {
          comment_id: string
          content: string
          created_at?: string
          id?: string
          language?: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id: string
        }
        Update: {
          comment_id?: string
          content?: string
          created_at?: string
          id?: string
          language?: string
          status?: Database["public"]["Enums"]["comment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_replies_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          language: string
          lesson_id: string
          status: Database["public"]["Enums"]["comment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          language?: string
          lesson_id: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          language?: string
          lesson_id?: string
          status?: Database["public"]["Enums"]["comment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_lessons: {
        Row: {
          created_at: string
          duration: string | null
          id: string
          module_id: string
          position: number
          title: string
          type: string
          custom_labels: Record<string, string> | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration?: string | null
          id?: string
          module_id: string
          position?: number
          title: string
          type?: string
          custom_labels?: Record<string, string> | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration?: string | null
          id?: string
          module_id?: string
          position?: number
          title?: string
          type?: string
          custom_labels?: Record<string, string> | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          created_at: string
          emoji: string
          id: string
          language: string
          position: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          language?: string
          position?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          language?: string
          position?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_completions: {
        Row: {
          completed_at: string
          id: string
          language: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          language?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          language?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_content_blocks: {
        Row: {
          block_type: string
          content: string | null
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          lesson_id: string
          position: number
          updated_at: string
        }
        Insert: {
          block_type?: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          lesson_id: string
          position?: number
          updated_at?: string
        }
        Update: {
          block_type?: string
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          lesson_id?: string
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_content_blocks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_ratings: {
        Row: {
          created_at: string
          id: string
          language: string
          lesson_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string
          lesson_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          lesson_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: string | null
          created_at: string
          id: string
          language: string | null
          page: string
          position: number
          section: string
          updated_at: string
        }
        Insert: {
          content_key: string
          content_type?: string
          content_value?: string | null
          created_at?: string
          id?: string
          language?: string | null
          page: string
          position?: number
          section: string
          updated_at?: string
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: string | null
          created_at?: string
          id?: string
          language?: string | null
          page?: string
          position?: number
          section?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      member_areas: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string
          description: string
          icon: string
          button_text: string
          lang_code: string
          support_email: string
          custom_labels: Record<string, string> | null
          owner_id: string | null
          require_auth: boolean
          theme: string
          active: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          subtitle: string
          description?: string
          icon?: string
          button_text?: string
          lang_code?: string
          support_email?: string
          custom_labels?: Record<string, string> | null
          owner_id?: string | null
          require_auth?: boolean
          theme?: string
          active?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          subtitle?: string
          description?: string
          icon?: string
          button_text?: string
          lang_code?: string
          support_email?: string
          custom_labels?: Record<string, string> | null
          owner_id?: string | null
          require_auth?: boolean
          theme?: string
          active?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      authorized_buyers: {
        Row: {
          id: string
          email: string
          name: string | null
          area_slug: string
          hotmart_transaction: string | null
          hotmart_product_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          area_slug: string
          hotmart_transaction?: string | null
          hotmart_product_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          area_slug?: string
          hotmart_transaction?: string | null
          hotmart_product_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          id: string
          area_slug: string
          hottok: string | null
          resend_api_key: string | null
          email_from: string
          email_subject_template: string
          email_body_template: string
          webhook_enabled: boolean
          email_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_slug: string
          hottok?: string | null
          resend_api_key?: string | null
          email_from?: string
          email_subject_template?: string
          email_body_template?: string
          webhook_enabled?: boolean
          email_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_slug?: string
          hottok?: string | null
          resend_api_key?: string | null
          email_from?: string
          email_subject_template?: string
          email_body_template?: string
          webhook_enabled?: boolean
          email_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      hotmart_products: {
        Row: {
          id: string
          product_id: string
          product_name: string | null
          area_slug: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          product_name?: string | null
          area_slug: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          product_name?: string | null
          area_slug?: string
          created_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          id: string
          area_slug: string | null
          event_type: string | null
          buyer_email: string | null
          buyer_name: string | null
          product_id: string | null
          transaction_id: string | null
          status: string
          error_message: string | null
          raw_payload: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          area_slug?: string | null
          event_type?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          product_id?: string | null
          transaction_id?: string | null
          status?: string
          error_message?: string | null
          raw_payload?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          id?: string
          area_slug?: string | null
          event_type?: string | null
          buyer_email?: string | null
          buyer_name?: string | null
          product_id?: string | null
          transaction_id?: string | null
          status?: string
          error_message?: string | null
          raw_payload?: Record<string, unknown> | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
      comment_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user", "super_admin"],
      comment_status: ["pending", "approved", "rejected"],
    },
  },
} as const
