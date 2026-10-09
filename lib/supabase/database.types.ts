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
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          gallery_id: string
          id: string
          record: Json
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          gallery_id: string
          id?: string
          record: Json
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          gallery_id?: string
          id?: string
          record?: Json
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      catalogue_works: {
        Row: {
          agreed_price: number | null
          artist_id: string
          commission_rate: number | null
          consigned_at: string | null
          created_at: string
          gallery_id: string
          id: string
          price: number | null
          status: string
          submission_id: string | null
          title: string
        }
        Insert: {
          agreed_price?: number | null
          artist_id: string
          commission_rate?: number | null
          consigned_at?: string | null
          created_at?: string
          gallery_id: string
          id?: string
          price?: number | null
          status?: string
          submission_id?: string | null
          title: string
        }
        Update: {
          agreed_price?: number | null
          artist_id?: string
          commission_rate?: number | null
          consigned_at?: string | null
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
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
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
      consignment_terms_responses: {
        Row: {
          answers: Json
          contact_email: string | null
          contact_name: string
          contact_phone: string | null
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
          contact_phone?: string | null
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
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string
          gallery_name?: string
          id?: string
          status?: string
        }
        Relationships: []
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
      research_responses: {
        Row: {
          answers: Json
          created_at: string
          form_slug: string
          id: string
          respondent_email: string | null
          respondent_name: string
          respondent_role: string
        }
        Insert: {
          answers: Json
          created_at?: string
          form_slug: string
          id?: string
          respondent_email?: string | null
          respondent_name: string
          respondent_role: string
        }
        Update: {
          answers?: Json
          created_at?: string
          form_slug?: string
          id?: string
          respondent_email?: string | null
          respondent_name?: string
          respondent_role?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          artist_amount_cents: number
          artist_id: string
          buyer_email: string | null
          buyer_name: string | null
          buyer_paid_at: string | null
          buyer_phone: string | null
          catalogue_work_id: string
          commission_amount_cents: number
          commission_rate: number
          created_at: string
          discount_cents: number
          gallery_id: string
          id: string
          payout_due_at: string | null
          sale_price_cents: number
          sold_at: string
        }
        Insert: {
          artist_amount_cents: number
          artist_id: string
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_paid_at?: string | null
          buyer_phone?: string | null
          catalogue_work_id: string
          commission_amount_cents: number
          commission_rate: number
          created_at?: string
          discount_cents?: number
          gallery_id: string
          id?: string
          payout_due_at?: string | null
          sale_price_cents: number
          sold_at?: string
        }
        Update: {
          artist_amount_cents?: number
          artist_id?: string
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_paid_at?: string | null
          buyer_phone?: string | null
          catalogue_work_id?: string
          commission_amount_cents?: number
          commission_rate?: number
          created_at?: string
          discount_cents?: number
          gallery_id?: string
          id?: string
          payout_due_at?: string | null
          sale_price_cents?: number
          sold_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_catalogue_work_id_fkey"
            columns: ["catalogue_work_id"]
            isOneToOne: false
            referencedRelation: "catalogue_works"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          acknowledged_at: string | null
          amount_cents: number
          artist_id: string
          created_at: string
          gallery_id: string
          id: string
          paid_at: string | null
          payment_reference: string | null
          proof_of_payment_path: string | null
          sale_id: string
          status: string
        }
        Insert: {
          acknowledged_at?: string | null
          amount_cents: number
          artist_id: string
          created_at?: string
          gallery_id: string
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          proof_of_payment_path?: string | null
          sale_id: string
          status?: string
        }
        Update: {
          acknowledged_at?: string | null
          amount_cents?: number
          artist_id?: string
          created_at?: string
          gallery_id?: string
          id?: string
          paid_at?: string | null
          payment_reference?: string | null
          proof_of_payment_path?: string | null
          sale_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: true
            referencedRelation: "artist_sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: true
            referencedRelation: "sales"
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
      artist_sales: {
        Row: {
          artist_amount_cents: number | null
          artist_id: string | null
          buyer_paid_at: string | null
          catalogue_work_id: string | null
          commission_amount_cents: number | null
          commission_rate: number | null
          created_at: string | null
          discount_cents: number | null
          gallery_id: string | null
          id: string | null
          payout_due_at: string | null
          sale_price_cents: number | null
          sold_at: string | null
        }
        Insert: {
          artist_amount_cents?: number | null
          artist_id?: string | null
          buyer_paid_at?: string | null
          catalogue_work_id?: string | null
          commission_amount_cents?: number | null
          commission_rate?: number | null
          created_at?: string | null
          discount_cents?: number | null
          gallery_id?: string | null
          id?: string | null
          payout_due_at?: string | null
          sale_price_cents?: number | null
          sold_at?: string | null
        }
        Update: {
          artist_amount_cents?: number | null
          artist_id?: string | null
          buyer_paid_at?: string | null
          catalogue_work_id?: string | null
          commission_amount_cents?: number | null
          commission_rate?: number | null
          created_at?: string | null
          discount_cents?: number | null
          gallery_id?: string | null
          id?: string | null
          payout_due_at?: string | null
          sale_price_cents?: number | null
          sold_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artist_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_catalogue_work_id_fkey"
            columns: ["catalogue_work_id"]
            isOneToOne: false
            referencedRelation: "catalogue_works"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
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
      acknowledge_payout: {
        Args: { p_payout_id: string }
        Returns: undefined
      }
      get_artist_bank_details_for_payout: {
        Args: { target_artist_id: string }
        Returns: {
          account_type: string
          bank_account_number: string
          bank_name: string
          branch_code: string
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
      is_platform_owner: { Args: never; Returns: boolean }
      mark_payout_paid: {
        Args: {
          p_paid_at?: string
          p_payment_reference?: string
          p_payout_id: string
          p_proof_of_payment_path?: string
        }
        Returns: undefined
      }
      owns_gallery: { Args: { check_gallery_id: string }; Returns: boolean }
      query_payout: {
        Args: { p_payout_id: string }
        Returns: undefined
      }
      record_sale: {
        Args: {
          p_buyer_email?: string
          p_buyer_name?: string
          p_buyer_paid_at?: string
          p_buyer_phone?: string
          p_catalogue_work_id: string
          p_commission_rate?: number
          p_discount_cents?: number
          p_payout_due_at?: string
          p_sale_price_cents: number
          p_sold_at?: string
        }
        Returns: string
      }
      submissions_update_artist_ack: {
        Args: { p_submission_id: string }
        Returns: undefined
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
