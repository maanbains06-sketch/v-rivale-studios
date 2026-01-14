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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_message_ratings: {
        Row: {
          chat_id: string
          created_at: string | null
          feedback: string | null
          id: string
          message_id: string
          rating: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          message_id: string
          rating: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          feedback?: string | null
          id?: string
          message_id?: string
          rating?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_message_ratings_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      ban_appeals: {
        Row: {
          additional_info: string | null
          admin_notes: string | null
          appeal_reason: string
          ban_reason: string
          created_at: string
          discord_username: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          steam_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_info?: string | null
          admin_notes?: string | null
          appeal_reason: string
          ban_reason: string
          created_at?: string
          discord_username: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          steam_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_info?: string | null
          admin_notes?: string | null
          appeal_reason?: string
          ban_reason?: string
          created_at?: string
          discord_username?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          steam_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      canned_responses: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_applications: {
        Row: {
          admin_notes: string | null
          average_ccv: string | null
          average_viewers: string
          channel_url: string
          comply_with_policies: boolean | null
          contact_email: string | null
          content_frequency: string
          content_style: string
          created_at: string
          discord_username: string
          expected_benefits: string | null
          full_name: string
          id: string
          ownership_proof_url: string | null
          platform: string
          reviewed_at: string | null
          reviewed_by: string | null
          rp_experience: string
          social_links: string | null
          status: string
          steam_id: string
          storyline_ideas: string | null
          updated_at: string
          user_id: string | null
          value_contribution: string | null
          why_join: string
        }
        Insert: {
          admin_notes?: string | null
          average_ccv?: string | null
          average_viewers: string
          channel_url: string
          comply_with_policies?: boolean | null
          contact_email?: string | null
          content_frequency: string
          content_style: string
          created_at?: string
          discord_username: string
          expected_benefits?: string | null
          full_name: string
          id?: string
          ownership_proof_url?: string | null
          platform: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rp_experience: string
          social_links?: string | null
          status?: string
          steam_id: string
          storyline_ideas?: string | null
          updated_at?: string
          user_id?: string | null
          value_contribution?: string | null
          why_join: string
        }
        Update: {
          admin_notes?: string | null
          average_ccv?: string | null
          average_viewers?: string
          channel_url?: string
          comply_with_policies?: boolean | null
          contact_email?: string | null
          content_frequency?: string
          content_style?: string
          created_at?: string
          discord_username?: string
          expected_benefits?: string | null
          full_name?: string
          id?: string
          ownership_proof_url?: string | null
          platform?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          rp_experience?: string
          social_links?: string | null
          status?: string
          steam_id?: string
          storyline_ideas?: string | null
          updated_at?: string
          user_id?: string | null
          value_contribution?: string | null
          why_join?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
          staff_member_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
          staff_member_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
          staff_member_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_presence: {
        Row: {
          created_at: string
          discord_id: string
          id: string
          is_online: boolean
          last_online_at: string | null
          staff_member_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discord_id: string
          id?: string
          is_online?: boolean
          last_online_at?: string | null
          staff_member_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discord_id?: string
          id?: string
          is_online?: boolean
          last_online_at?: string | null
          staff_member_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discord_presence_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discord_presence_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_rules_sections: {
        Row: {
          color: number
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          rules: Json
          section_key: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: number
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          rules?: Json
          section_key: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: number
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          rules?: Json
          section_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_participants: {
        Row: {
          event_id: string
          id: string
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participants_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_image: string | null
          created_at: string
          created_by: string | null
          current_participants: number | null
          description: string | null
          discord_event_id: string | null
          end_date: string
          event_type: string
          id: string
          location: string | null
          max_participants: number | null
          source: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_image?: string | null
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          discord_event_id?: string | null
          end_date: string
          event_type?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          source?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_image?: string | null
          created_at?: string
          created_by?: string | null
          current_participants?: number | null
          description?: string | null
          discord_event_id?: string | null
          end_date?: string
          event_type?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          source?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorite_staff: {
        Row: {
          created_at: string
          id: string
          staff_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          staff_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          staff_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorite_staff_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_youtubers: {
        Row: {
          avatar_url: string | null
          channel_url: string
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          is_live: boolean | null
          live_stream_url: string | null
          name: string
          role: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          channel_url: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_live?: boolean | null
          live_stream_url?: string | null
          name: string
          role?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          channel_url?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_live?: boolean | null
          live_stream_url?: string | null
          name?: string
          role?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      firefighter_applications: {
        Row: {
          admin_notes: string | null
          created_at: string
          discord_id: string
          id: string
          in_game_name: string
          real_name: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          steam_id: string
          updated_at: string
          user_id: string
          weekly_availability: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          discord_id: string
          id?: string
          in_game_name: string
          real_name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          steam_id: string
          updated_at?: string
          user_id: string
          weekly_availability: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          discord_id?: string
          id?: string
          in_game_name?: string
          real_name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          steam_id?: string
          updated_at?: string
          user_id?: string
          weekly_availability?: string
        }
        Relationships: []
      }
      gallery_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          submission_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          submission_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          submission_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "gallery_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_likes: {
        Row: {
          created_at: string | null
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_likes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "gallery_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_submissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          category: string
          created_at: string
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          rejection_reason: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          category: string
          created_at?: string
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          rejection_reason?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          rejection_reason?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      giveaway_entries: {
        Row: {
          created_at: string
          discord_id: string | null
          discord_username: string | null
          entry_count: number
          giveaway_id: string
          id: string
          is_winner: boolean
          referral_bonus: boolean | null
          social_share_bonus: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          discord_id?: string | null
          discord_username?: string | null
          entry_count?: number
          giveaway_id: string
          id?: string
          is_winner?: boolean
          referral_bonus?: boolean | null
          social_share_bonus?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          discord_id?: string | null
          discord_username?: string | null
          entry_count?: number
          giveaway_id?: string
          id?: string
          is_winner?: boolean
          referral_bonus?: boolean | null
          social_share_bonus?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_entries_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_winners: {
        Row: {
          announced_at: string | null
          claimed_at: string | null
          created_at: string
          discord_username: string | null
          giveaway_id: string
          id: string
          prize_claimed: boolean
          user_id: string
        }
        Insert: {
          announced_at?: string | null
          claimed_at?: string | null
          created_at?: string
          discord_username?: string | null
          giveaway_id: string
          id?: string
          prize_claimed?: boolean
          user_id: string
        }
        Update: {
          announced_at?: string | null
          claimed_at?: string | null
          created_at?: string
          discord_username?: string | null
          giveaway_id?: string
          id?: string
          prize_claimed?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_winners_giveaway_id_fkey"
            columns: ["giveaway_id"]
            isOneToOne: false
            referencedRelation: "giveaways"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaways: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          max_entries: number | null
          prize: string
          prize_image_url: string | null
          requirements: Json | null
          start_date: string
          status: string
          title: string
          updated_at: string
          winner_count: number
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          max_entries?: number | null
          prize: string
          prize_image_url?: string | null
          requirements?: Json | null
          start_date?: string
          status?: string
          title: string
          updated_at?: string
          winner_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          max_entries?: number | null
          prize?: string
          prize_image_url?: string | null
          requirements?: Json | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
          winner_count?: number
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          additional_info: string | null
          admin_notes: string | null
          age: number
          availability: string
          character_background: string
          character_name: string
          created_at: string
          id: string
          job_specific_answer: string | null
          job_type: string
          phone_number: string
          previous_experience: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          strengths: string | null
          updated_at: string
          user_id: string
          why_join: string
        }
        Insert: {
          additional_info?: string | null
          admin_notes?: string | null
          age: number
          availability: string
          character_background: string
          character_name: string
          created_at?: string
          id?: string
          job_specific_answer?: string | null
          job_type: string
          phone_number: string
          previous_experience: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          strengths?: string | null
          updated_at?: string
          user_id: string
          why_join: string
        }
        Update: {
          additional_info?: string | null
          admin_notes?: string | null
          age?: number
          availability?: string
          character_background?: string
          character_name?: string
          created_at?: string
          id?: string
          job_specific_answer?: string | null
          job_type?: string
          phone_number?: string
          previous_experience?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          strengths?: string | null
          updated_at?: string
          user_id?: string
          why_join?: string
        }
        Relationships: []
      }
      maintenance_schedules: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          scheduled_end: string
          scheduled_start: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          scheduled_end: string
          scheduled_start: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      member_joins: {
        Row: {
          discord_avatar: string | null
          discord_id: string | null
          discord_username: string | null
          id: string
          ip_country: string | null
          joined_at: string
          referral_source: string | null
          user_id: string
        }
        Insert: {
          discord_avatar?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          ip_country?: string | null
          joined_at?: string
          referral_source?: string | null
          user_id: string
        }
        Update: {
          discord_avatar?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          ip_country?: string | null
          joined_at?: string
          referral_source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          discord_username: string | null
          id: string
          items: Json
          order_number: string
          status: string
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          discord_username?: string | null
          id?: string
          items: Json
          order_number: string
          status?: string
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          discord_username?: string | null
          id?: string
          items?: Json
          order_number?: string
          status?: string
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_2fa_sessions: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          id: string
          is_enabled: boolean | null
          last_verified_at: string | null
          secret_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_verified_at?: string | null
          secret_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          id?: string
          is_enabled?: boolean | null
          last_verified_at?: string | null
          secret_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      owner_audit_log: {
        Row: {
          action_description: string
          action_type: string
          created_at: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          owner_user_id: string
          target_id: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          owner_user_id: string
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          owner_user_id?: string
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      owner_verification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      pdm_applications: {
        Row: {
          additional_info: string | null
          admin_notes: string | null
          age: number
          availability: string
          character_background: string
          character_name: string
          created_at: string
          customer_scenario: string
          id: string
          phone_number: string
          previous_experience: string
          reviewed_at: string | null
          reviewed_by: string | null
          sales_experience: string
          status: string
          updated_at: string
          user_id: string
          vehicle_knowledge: string
          why_join: string
        }
        Insert: {
          additional_info?: string | null
          admin_notes?: string | null
          age: number
          availability: string
          character_background: string
          character_name: string
          created_at?: string
          customer_scenario: string
          id?: string
          phone_number: string
          previous_experience: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sales_experience: string
          status?: string
          updated_at?: string
          user_id: string
          vehicle_knowledge: string
          why_join: string
        }
        Update: {
          additional_info?: string | null
          admin_notes?: string | null
          age?: number
          availability?: string
          character_background?: string
          character_name?: string
          created_at?: string
          customer_scenario?: string
          id?: string
          phone_number?: string
          previous_experience?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sales_experience?: string
          status?: string
          updated_at?: string
          user_id?: string
          vehicle_knowledge?: string
          why_join?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          discord_avatar: string | null
          discord_banner: string | null
          discord_id: string | null
          discord_username: string | null
          id: string
          steam_id: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          discord_avatar?: string | null
          discord_banner?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id: string
          steam_id?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          discord_avatar?: string | null
          discord_banner?: string | null
          discord_id?: string | null
          discord_username?: string | null
          id?: string
          steam_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_percentage: number
          expires_at: string | null
          id: string
          is_used: boolean
          updated_at: string
          used_at: string | null
          used_by: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_used?: boolean
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_percentage?: number
          expires_at?: string | null
          id?: string
          is_used?: boolean
          updated_at?: string
          used_at?: string | null
          used_by?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          created_at: string
          discount_percentage: number
          id: string
          total_earnings: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number
          id?: string
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number
          id?: string
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          purchase_amount: number | null
          purchase_made: boolean
          referred_email: string | null
          referred_user_id: string | null
          referrer_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          purchase_amount?: number | null
          purchase_made?: boolean
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          purchase_amount?: number | null
          purchase_made?: boolean
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      server_resource_snapshot: {
        Row: {
          created_at: string
          id: string
          resource_count: number
          resources: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_count?: number
          resources?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_count?: number
          resources?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      server_updates: {
        Row: {
          created_at: string
          description: string | null
          detected_at: string
          id: string
          resource_name: string | null
          title: string
          update_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          resource_name?: string | null
          title: string
          update_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          detected_at?: string
          id?: string
          resource_name?: string | null
          title?: string
          update_type?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      sla_config: {
        Row: {
          created_at: string | null
          id: string
          priority: string
          resolution_time_minutes: number
          response_time_minutes: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          priority: string
          resolution_time_minutes: number
          response_time_minutes: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          priority?: string
          resolution_time_minutes?: number
          response_time_minutes?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_activity_log: {
        Row: {
          action_description: string
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          related_id: string | null
          related_type: string | null
          staff_user_id: string
        }
        Insert: {
          action_description: string
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          related_id?: string | null
          related_type?: string | null
          staff_user_id: string
        }
        Update: {
          action_description?: string
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          related_id?: string | null
          related_type?: string | null
          staff_user_id?: string
        }
        Relationships: []
      }
      staff_applications: {
        Row: {
          admin_notes: string | null
          age: number
          availability: string
          created_at: string
          discord_username: string
          experience: string
          full_name: string
          id: string
          in_game_name: string
          playtime: string
          position: string
          previous_experience: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          why_join: string
        }
        Insert: {
          admin_notes?: string | null
          age: number
          availability: string
          created_at?: string
          discord_username: string
          experience: string
          full_name: string
          id?: string
          in_game_name: string
          playtime: string
          position: string
          previous_experience?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          why_join: string
        }
        Update: {
          admin_notes?: string | null
          age?: number
          availability?: string
          created_at?: string
          discord_username?: string
          experience?: string
          full_name?: string
          id?: string
          in_game_name?: string
          playtime?: string
          position?: string
          previous_experience?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          why_join?: string
        }
        Relationships: []
      }
      staff_availability: {
        Row: {
          created_at: string | null
          current_workload: number | null
          id: string
          is_available: boolean | null
          last_assignment_at: string | null
          max_concurrent_chats: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_workload?: number | null
          id?: string
          is_available?: boolean | null
          last_assignment_at?: string | null
          max_concurrent_chats?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_workload?: number | null
          id?: string
          is_available?: boolean | null
          last_assignment_at?: string | null
          max_concurrent_chats?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          bio: string | null
          created_at: string | null
          department: string
          discord_avatar: string | null
          discord_banner: string | null
          discord_id: string
          discord_username: string | null
          display_order: number | null
          email: string | null
          id: string
          is_active: boolean | null
          last_seen: string | null
          name: string
          responsibilities: string[] | null
          role: string
          role_type: string
          steam_id: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          department: string
          discord_avatar?: string | null
          discord_banner?: string | null
          discord_id: string
          discord_username?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          name: string
          responsibilities?: string[] | null
          role: string
          role_type: string
          steam_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          department?: string
          discord_avatar?: string | null
          discord_banner?: string | null
          discord_id?: string
          discord_username?: string | null
          display_order?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          last_seen?: string | null
          name?: string
          responsibilities?: string[] | null
          role?: string
          role_type?: string
          steam_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      staff_onboarding_checklist: {
        Row: {
          category: string
          created_at: string
          description: string
          display_order: number
          id: string
          is_required: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_required?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_required?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_onboarding_progress: {
        Row: {
          checklist_item_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          staff_user_id: string
          updated_at: string
        }
        Insert: {
          checklist_item_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          staff_user_id: string
          updated_at?: string
        }
        Update: {
          checklist_item_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          staff_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_onboarding_progress_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "staff_onboarding_checklist"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_team_settings: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          max_members: number
          team_description: string | null
          team_label: string
          team_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          max_members?: number
          team_description?: string | null
          team_label: string
          team_value: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          max_members?: number
          team_description?: string | null
          team_label?: string
          team_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_training_modules: {
        Row: {
          content: string
          created_at: string
          description: string
          display_order: number
          duration_minutes: number | null
          id: string
          is_required: boolean
          module_type: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          description: string
          display_order?: number
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          module_type: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          display_order?: number
          duration_minutes?: number | null
          id?: string
          is_required?: boolean
          module_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_training_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          module_id: string
          notes: string | null
          score: number | null
          staff_user_id: string
          updated_at: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id: string
          notes?: string | null
          score?: number | null
          staff_user_id: string
          updated_at?: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          module_id?: string
          notes?: string | null
          score?: number | null
          staff_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_training_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "staff_training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chat_ratings: {
        Row: {
          chat_id: string
          created_at: string
          feedback: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_chat_ratings_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "support_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      support_chats: {
        Row: {
          assigned_to: string | null
          created_at: string
          detected_language: string | null
          escalated: boolean | null
          escalated_at: string | null
          first_response_at: string | null
          id: string
          last_message_at: string
          priority: string | null
          resolved_at: string | null
          sentiment: string | null
          sentiment_score: number | null
          sla_breached: boolean | null
          sla_resolution_target: string | null
          sla_response_target: string | null
          status: string
          subject: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          detected_language?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          first_response_at?: string | null
          id?: string
          last_message_at?: string
          priority?: string | null
          resolved_at?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          sla_breached?: boolean | null
          sla_resolution_target?: string | null
          sla_response_target?: string | null
          status?: string
          subject: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          detected_language?: string | null
          escalated?: boolean | null
          escalated_at?: string | null
          first_response_at?: string | null
          id?: string
          last_message_at?: string
          priority?: string | null
          resolved_at?: string | null
          sentiment?: string | null
          sentiment_score?: number | null
          sla_breached?: boolean | null
          sla_resolution_target?: string | null
          sla_response_target?: string | null
          status?: string
          subject?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_url: string | null
          chat_id: string
          created_at: string
          id: string
          is_staff: boolean
          message: string
          read: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          chat_id: string
          created_at?: string
          id?: string
          is_staff?: boolean
          message: string
          read?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          chat_id?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          message?: string
          read?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_featured: boolean
          player_name: string
          player_role: string | null
          rating: number
          testimonial: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          player_name: string
          player_role?: string | null
          rating: number
          testimonial: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          player_name?: string
          player_role?: string | null
          rating?: number
          testimonial?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_package_favorites: {
        Row: {
          created_at: string
          id: string
          package_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          user_id?: string
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
      weazel_news_applications: {
        Row: {
          additional_info: string | null
          admin_notes: string | null
          age: number
          availability: string
          camera_skills: string
          character_background: string
          character_name: string
          created_at: string
          id: string
          interview_scenario: string
          journalism_experience: string
          phone_number: string
          previous_experience: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          why_join: string
          writing_sample: string
        }
        Insert: {
          additional_info?: string | null
          admin_notes?: string | null
          age: number
          availability: string
          camera_skills: string
          character_background: string
          character_name: string
          created_at?: string
          id?: string
          interview_scenario: string
          journalism_experience: string
          phone_number: string
          previous_experience: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
          why_join: string
          writing_sample: string
        }
        Update: {
          additional_info?: string | null
          admin_notes?: string | null
          age?: number
          availability?: string
          camera_skills?: string
          character_background?: string
          character_name?: string
          created_at?: string
          id?: string
          interview_scenario?: string
          journalism_experience?: string
          phone_number?: string
          previous_experience?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          why_join?: string
          writing_sample?: string
        }
        Relationships: []
      }
      whitelist_application_drafts: {
        Row: {
          age: number | null
          backstory: string | null
          created_at: string
          discord: string | null
          experience: string | null
          id: string
          steam_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          backstory?: string | null
          created_at?: string
          discord?: string | null
          experience?: string | null
          id?: string
          steam_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          backstory?: string | null
          created_at?: string
          discord?: string | null
          experience?: string | null
          id?: string
          steam_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whitelist_applications: {
        Row: {
          admin_notes: string | null
          age: number
          backstory: string
          created_at: string
          discord: string
          experience: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["application_status"]
          steam_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          age: number
          backstory: string
          created_at?: string
          discord: string
          experience: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          steam_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          age?: number
          backstory?: string
          created_at?: string
          discord?: string
          experience?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          steam_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whitelist_reapplication_notifications: {
        Row: {
          application_id: string
          created_at: string
          email_sent_at: string
          id: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          email_sent_at?: string
          id?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          email_sent_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      discord_presence_public: {
        Row: {
          created_at: string | null
          id: string | null
          is_online: boolean | null
          last_online_at: string | null
          staff_member_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_online?: boolean | null
          last_online_at?: string | null
          staff_member_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_online?: boolean | null
          last_online_at?: string | null
          staff_member_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discord_presence_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discord_presence_staff_member_id_fkey"
            columns: ["staff_member_id"]
            isOneToOne: false
            referencedRelation: "staff_members_public"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members_public: {
        Row: {
          bio: string | null
          created_at: string | null
          department: string | null
          discord_avatar: string | null
          discord_banner: string | null
          discord_username: string | null
          display_order: number | null
          id: string | null
          is_active: boolean | null
          name: string | null
          responsibilities: string[] | null
          role: string | null
          role_type: string | null
          user_id: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          department?: string | null
          discord_avatar?: string | null
          discord_banner?: string | null
          discord_username?: string | null
          display_order?: number | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          responsibilities?: string[] | null
          role?: string | null
          role_type?: string | null
          user_id?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          department?: string | null
          discord_avatar?: string | null
          discord_banner?: string | null
          discord_username?: string | null
          display_order?: number | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          responsibilities?: string[] | null
          role?: string | null
          role_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_bonus_entry: {
        Args: { p_bonus_type: string; p_giveaway_id: string; p_user_id: string }
        Returns: boolean
      }
      assign_chat_to_staff: { Args: { chat_id: string }; Returns: string }
      auto_assign_chat_to_online_staff: {
        Args: { chat_id: string }
        Returns: string
      }
      auto_assign_unassigned_chats: {
        Args: never
        Returns: {
          assigned_to: string
          chat_id: string
          subject: string
        }[]
      }
      check_sla_breach: { Args: never; Returns: undefined }
      generate_owner_2fa_token: { Args: never; Returns: string }
      generate_promo_code: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_all_users_for_owner: {
        Args: never
        Returns: {
          out_created_at: string
          out_discord_avatar: string
          out_discord_id: string
          out_discord_username: string
          out_email: string
          out_role: string
          out_user_id: string
        }[]
      }
      get_gallery_like_count: {
        Args: { submission_uuid: string }
        Returns: number
      }
      get_online_staff_for_chat_assignment: {
        Args: never
        Returns: {
          current_workload: number
          staff_member_id: string
          staff_user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_owner_session_verified: { Args: never; Returns: boolean }
      log_owner_action: {
        Args: {
          p_action_description: string
          p_action_type: string
          p_new_value?: Json
          p_old_value?: Json
          p_target_id?: string
          p_target_table?: string
        }
        Returns: string
      }
      log_staff_activity: {
        Args: {
          p_action_description: string
          p_action_type: string
          p_metadata?: Json
          p_related_id?: string
          p_related_type?: string
          p_staff_user_id: string
        }
        Returns: string
      }
      manual_link_staff_members: {
        Args: never
        Returns: {
          assigned_role: string
          staff_name: string
          user_email: string
        }[]
      }
      notify_staff_sla_breach: { Args: never; Returns: undefined }
      purge_old_rejected_applications: { Args: never; Returns: undefined }
      rebalance_chats_to_online_staff: {
        Args: never
        Returns: {
          chat_id: string
          new_assigned_to: string
        }[]
      }
      rebalance_staff_workload: {
        Args: never
        Returns: {
          message: string
          rebalanced_count: number
        }[]
      }
      select_giveaway_winners: {
        Args: { p_giveaway_id: string }
        Returns: {
          winner_discord_username: string
          winner_user_id: string
        }[]
      }
      sync_all_staff_user_ids: {
        Args: never
        Returns: {
          linked: boolean
          message: string
          staff_discord_id: string
          staff_name: string
        }[]
      }
      sync_user_discord_info: {
        Args: {
          p_discord_avatar?: string
          p_discord_banner?: string
          p_discord_username: string
          p_user_id: string
        }
        Returns: boolean
      }
      verify_owner_2fa: { Args: { p_token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      application_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      application_status: ["pending", "approved", "rejected"],
    },
  },
} as const
