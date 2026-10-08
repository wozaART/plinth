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
      artist_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          full_name: string | null
          gallery_id: string
          id: string
          invited_by: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          full_name?: string | null
          gallery_id: string
          id?: string
          invited_by: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string | null
          gallery_id?: string
          id?: string
          invited_by?: string
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_invites_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_bank_details: {
        Row: {
          account_type: string | null
          bank_account_number: string | null
          bank_name: string | null
          branch_code: string | null
          id: string
          updated_at: string
        }
        Insert: {
          account_type?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          branch_code?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          account_type?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          branch_code?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_bank_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_profiles: {
        Row: {
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          practice: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          practice?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          practice?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      catalogue_works: {
        Row: {
          artist_id: string
          created_at: string
          gallery_id: string
          id: string
          price: number | null
          status: string
          submission_id: string | null
          title: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          gallery_id: string
          id?: string
          price?: number | null
          status?: string
          submission_id?: string | null
          title: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          gallery_id?: string
          id?: string
          price?: number | null
          status?: string
          submission_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalogue_works_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogue_works_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalogue_works_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      consignment_terms_responses: {
        Row: {
          answers: Json
          contact_email: string | null
          contact_name: string
          contact_role: string | null
          created_at: string
          gallery_name: string
          id: string
          status: string
        }
        Insert: {
          answers: Json
          contact_email?: string | null
          contact_name: string
          contact_role?: string | null
          created_at?: string
          gallery_name: string
          id?: string
          status?: string
        }
        Update: {
          answers?: Json
          contact_email?: string | null
          contact_name?: string
          contact_role?: string | null
          created_at?: string
          gallery_name?: string
          id?: string
          status?: string
        }
        Relationships: []
      }
      consignment_terms_followups: {
        Row: {
          created_at: string
          created_by: string
          id: string
          message: string
          response_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          message: string
          response_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          response_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consignment_terms_followups_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "consignment_terms_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          focus: string | null
          gallery_id: string
          id: string
          last_contact_at: string | null
          name: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          focus?: string | null
          gallery_id: string
          id?: string
          last_contact_at?: string | null
          name: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          focus?: string | null
          gallery_id?: string
          id?: string
          last_contact_at?: string | null
          name?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibition_invites: {
        Row: {
          artist_id: string | null
          created_at: string
          email: string
          exhibition_id: string
          expires_at: string
          full_name: string | null
          gallery_id: string
          id: string
          invited_by: string
          message: string | null
          responded_at: string | null
          status: string
          token: string
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          email: string
          exhibition_id: string
          expires_at?: string
          full_name?: string | null
          gallery_id: string
          id?: string
          invited_by: string
          message?: string | null
          responded_at?: string | null
          status?: string
          token?: string
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          email?: string
          exhibition_id?: string
          expires_at?: string
          full_name?: string | null
          gallery_id?: string
          id?: string
          invited_by?: string
          message?: string | null
          responded_at?: string | null
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibition_invites_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_invites_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibition_counts"
            referencedColumns: ["exhibition_id"]
          },
          {
            foreignKeyName: "exhibition_invites_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exhibition_invites_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      exhibitions: {
        Row: {
          blurb: string | null
          closing_date: string | null
          created_at: string
          delivery_date: string | null
          gallery_id: string
          id: string
          medium_requirements: string | null
          opening_date: string | null
          rules: string | null
          size_requirements: string | null
          slots: number
          status: string
          submission_deadline: string | null
          theme: string | null
          title: string
          type: string
        }
        Insert: {
          blurb?: string | null
          closing_date?: string | null
          created_at?: string
          delivery_date?: string | null
          gallery_id: string
          id?: string
          medium_requirements?: string | null
          opening_date?: string | null
          rules?: string | null
          size_requirements?: string | null
          slots?: number
          status?: string
          submission_deadline?: string | null
          theme?: string | null
          title: string
          type?: string
        }
        Update: {
          blurb?: string | null
          closing_date?: string | null
          created_at?: string
          delivery_date?: string | null
          gallery_id?: string
          id?: string
          medium_requirements?: string | null
          opening_date?: string | null
          rules?: string | null
          size_requirements?: string | null
          slots?: number
          status?: string
          submission_deadline?: string | null
          theme?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exhibitions_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      frame_jobs: {
        Row: {
          artist_id: string
          created_at: string
          due_date: string | null
          gallery_id: string
          id: string
          spec: string | null
          stage: string
          submission_id: string | null
          title: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          due_date?: string | null
          gallery_id: string
          id?: string
          spec?: string | null
          stage?: string
          submission_id?: string | null
          title: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          due_date?: string | null
          gallery_id?: string
          id?: string
          spec?: string | null
          stage?: string
          submission_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "frame_jobs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frame_jobs_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frame_jobs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      galleries: {
        Row: {
          city: string | null
          commission_rate: number
          created_at: string
          currency_code: string
          custom_domain: string | null
          delivery_address: string | null
          domain_status: string
          drop_off_pass_prefix: string | null
          font_body: Json
          font_display: Json
          font_mono: Json | null
          gallery_tabs: Json
          id: string
          logo_image_url: string | null
          logo_wordmark_primary: string | null
          logo_wordmark_secondary: string | null
          name: string
          owner_id: string
          short_name: string | null
          slug: string
          studio_tabs: Json
          submit_commission_note_template: string
          tagline: string | null
          theme_colors: Json
          theme_mode: string
        }
        Insert: {
          city?: string | null
          commission_rate?: number
          created_at?: string
          currency_code?: string
          custom_domain?: string | null
          delivery_address?: string | null
          domain_status?: string
          drop_off_pass_prefix?: string | null
          font_body?: Json
          font_display?: Json
          font_mono?: Json | null
          gallery_tabs?: Json
          id?: string
          logo_image_url?: string | null
          logo_wordmark_primary?: string | null
          logo_wordmark_secondary?: string | null
          name: string
          owner_id: string
          short_name?: string | null
          slug: string
          studio_tabs?: Json
          submit_commission_note_template?: string
          tagline?: string | null
          theme_colors?: Json
          theme_mode?: string
        }
        Update: {
          city?: string | null
          commission_rate?: number
          created_at?: string
          currency_code?: string
          custom_domain?: string | null
          delivery_address?: string | null
          domain_status?: string
          drop_off_pass_prefix?: string | null
          font_body?: Json
          font_display?: Json
          font_mono?: Json | null
          gallery_tabs?: Json
          id?: string
          logo_image_url?: string | null
          logo_wordmark_primary?: string | null
          logo_wordmark_secondary?: string | null
          name?: string
          owner_id?: string
          short_name?: string | null
          slug?: string
          studio_tabs?: Json
          submit_commission_note_template?: string
          tagline?: string | null
          theme_colors?: Json
          theme_mode?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          artist_id: string
          body: string
          created_at: string
          gallery_id: string
          id: string
          read_at: string | null
          sender: string
          subject: string
          submission_id: string | null
        }
        Insert: {
          artist_id: string
          body: string
          created_at?: string
          gallery_id: string
          id?: string
          read_at?: string | null
          sender: string
          subject: string
          submission_id?: string | null
        }
        Update: {
          artist_id?: string
          body?: string
          created_at?: string
          gallery_id?: string
          id?: string
          read_at?: string | null
          sender?: string
          subject?: string
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ack: boolean | null
          artist_id: string
          created_at: string
          dim: string | null
          exhibition_id: string | null
          gallery_id: string
          id: string
          image_url: string | null
          medium: string | null
          note: string
          price: number | null
          rules_ack: boolean | null
          statement: string | null
          status: string
          title: string
          year: number | null
        }
        Insert: {
          ack?: boolean | null
          artist_id: string
          created_at?: string
          dim?: string | null
          exhibition_id?: string | null
          gallery_id: string
          id?: string
          image_url?: string | null
          medium?: string | null
          note?: string
          price?: number | null
          rules_ack?: boolean | null
          statement?: string | null
          status?: string
          title: string
          year?: number | null
        }
        Update: {
          ack?: boolean | null
          artist_id?: string
          created_at?: string
          dim?: string | null
          exhibition_id?: string | null
          gallery_id?: string
          id?: string
          image_url?: string | null
          medium?: string | null
          note?: string
          price?: number | null
          rules_ack?: boolean | null
          statement?: string | null
          status?: string
          title?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibition_counts"
            referencedColumns: ["exhibition_id"]
          },
          {
            foreignKeyName: "submissions_exhibition_id_fkey"
            columns: ["exhibition_id"]
            isOneToOne: false
            referencedRelation: "exhibitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      exhibition_counts: {
        Row: {
          applicants: number | null
          exhibition_id: string | null
          filled: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_artist_invite: {
        Args: { p_token: string }
        Returns: {
          gallery_id: string
          gallery_name: string
        }[]
      }
      accept_exhibition_invite: {
        Args: { p_token: string }
        Returns: {
          exhibition_id: string
          gallery_name: string
        }[]
      }
      get_artist_invite: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          full_name: string
          gallery_name: string
          status: string
        }[]
      }
      get_exhibition_invite: {
        Args: { p_token: string }
        Returns: {
          email: string
          exhibition_rules: string
          exhibition_theme: string
          exhibition_title: string
          expires_at: string
          full_name: string
          gallery_name: string
          status: string
        }[]
      }
      get_artist_bank_details_for_payout: {
        Args: { target_artist_id: string }
        Returns: {
          bank_name: string | null
          bank_account_number: string | null
          branch_code: string | null
          account_type: string | null
        }[]
      }
      is_platform_owner: { Args: Record<PropertyKey, never>; Returns: boolean }
      owns_gallery: { Args: { check_gallery_id: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

