export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  fratabi: {
    Tables: {
      favorites: {
        Row: {
          card_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "phrase_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "phrases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          inviter_id: string
          revoked: boolean
          role: string
          thread_id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          inviter_id: string
          revoked?: boolean
          role?: string
          thread_id: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          inviter_id?: string
          revoked?: boolean
          role?: string
          thread_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      phrases: {
        Row: {
          audio_url: string
          author_user_id: string
          created_at: string
          en: string
          fr: string
          furigana: string
          id: string
          jp: string
          thread_id: string
        }
        Insert: {
          audio_url: string
          author_user_id: string
          created_at?: string
          en: string
          fr: string
          furigana: string
          id?: string
          jp: string
          thread_id: string
        }
        Update: {
          audio_url?: string
          author_user_id?: string
          created_at?: string
          en?: string
          fr?: string
          furigana?: string
          id?: string
          jp?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phrases_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phrases_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_members: {
        Row: {
          created_at: string
          role: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_members_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thread_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          owner_user_id: string
          title: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          owner_user_id: string
          title?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          owner_user_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "threads_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          count: number
          period_key: string
          user_id: string
        }
        Insert: {
          count?: number
          period_key: string
          user_id: string
        }
        Update: {
          count?: number
          period_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          plan: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          plan?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          plan?: string
        }
        Relationships: []
      }
    }
    Views: {
      phrase_logs: {
        Row: {
          audio_url: string | null
          created_at: string | null
          fr: string | null
          id: string | null
          jp: string | null
          kana: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          fr?: string | null
          id?: string | null
          jp?: string | null
          kana?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          fr?: string | null
          id?: string | null
          jp?: string | null
          kana?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      fratabi_increment_usage: {
        Args: { p_limit: number; p_period_key: string; p_user_id: string }
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
      phrase_logs: {
        Row: {
          audio_url: string
          created_at: string | null
          fr: string
          id: string
          jp: string
          kana: string | null
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          fr: string
          id?: string
          jp: string
          kana?: string | null
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          fr?: string
          id?: string
          jp?: string
          kana?: string | null
        }
        Relationships: []
      }
      phrases: {
        Row: {
          audio_url: string
          created_at: string
          en: string
          fr: string
          id: string
          jp: string
          kana: string | null
          thread_id: string
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          en: string
          fr: string
          id?: string
          jp: string
          kana?: string | null
          thread_id: string
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          en?: string
          fr?: string
          id?: string
          jp?: string
          kana?: string | null
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phrases_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "fratabi_threads_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phrases_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          owner_id: string
          title: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          owner_id: string
          title?: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          owner_id?: string
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      fratabi_phrases_view: {
        Row: {
          audio_url: string | null
          created_at: string | null
          en: string | null
          fr: string | null
          id: string | null
          jp: string | null
          kana: string | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          en?: string | null
          fr?: string | null
          id?: string | null
          jp?: string | null
          kana?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          en?: string | null
          fr?: string | null
          id?: string | null
          jp?: string | null
          kana?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phrases_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "fratabi_threads_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phrases_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      fratabi_threads_view: {
        Row: {
          archived: boolean | null
          created_at: string | null
          id: string | null
          owner_id: string | null
          title: string | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          id?: string | null
          owner_id?: string | null
          title?: string | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          id?: string | null
          owner_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      fratabi_increment_usage: {
        Args: { p_limit: number; p_period_key: string; p_user_id: string }
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
  fratabi: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

