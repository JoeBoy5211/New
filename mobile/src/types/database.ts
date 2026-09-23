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
      bookings: {
        Row: {
          caterer_id: string
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          customer_id: string
          event_date: string
          event_time: string | null
          event_type: string
          guest_count: number
          id: string
          menu_selections: string[] | null
          package_ids: string[] | null
          request_status: string | null
          special_requests: string | null
          status: string | null
          total_amount: number | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          caterer_id: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id: string
          event_date: string
          event_time?: string | null
          event_type: string
          guest_count: number
          id?: string
          menu_selections?: string[] | null
          package_ids?: string[] | null
          request_status?: string | null
          special_requests?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          caterer_id?: string
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          customer_id?: string
          event_date?: string
          event_time?: string | null
          event_type?: string
          guest_count?: number
          id?: string
          menu_selections?: string[] | null
          package_ids?: string[] | null
          request_status?: string | null
          special_requests?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_caterer_id_fkey"
            columns: ["caterer_id"]
            isOneToOne: false
            referencedRelation: "caterers"
            referencedColumns: ["id"]
          },
        ]
      }
      caterers: {
        Row: {
          account_status: string | null
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          contact_email: string | null
          contact_phone: string | null
          cover_image: string | null
          created_at: string
          cuisines: string[] | null
          description: string | null
          event_types: string[] | null
          id: string
          images: string[] | null
          instagram_url: string | null
          is_approved: boolean | null
          is_pending: boolean | null
          is_premium: boolean
          latitude: number | null
          location: string | null
          long_description: string | null
          longitude: number | null
          max_guests: number | null
          min_guests: number | null
          name: string
          price_range: string | null
          rating: number | null
          review_count: number | null
          service_areas: string[] | null
          specialties: string[] | null
          subscription_expires_at: string | null
          subscription_status: string | null
          telegram_url: string | null
          tiktok_url: string | null
          updated_at: string
          vendor_id: string
          view_count: number
          unique_view_count: number
          website: string | null
          years_in_business: number | null
        }
        Insert: {
          account_status?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image?: string | null
          created_at?: string
          cuisines?: string[] | null
          description?: string | null
          event_types?: string[] | null
          id?: string
          images?: string[] | null
          instagram_url?: string | null
          is_approved?: boolean | null
          is_pending?: boolean | null
          is_premium?: boolean
          latitude?: number | null
          location?: string | null
          long_description?: string | null
          longitude?: number | null
          max_guests?: number | null
          min_guests?: number | null
          name: string
          price_range?: string | null
          rating?: number | null
          review_count?: number | null
          service_areas?: string[] | null
          specialties?: string[] | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
          vendor_id: string
          view_count?: number | null
          unique_view_count?: number | null
          website?: string | null
          years_in_business?: number | null
        }
        Update: {
          account_status?: string | null
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cover_image?: string | null
          created_at?: string
          cuisines?: string[] | null
          description?: string | null
          event_types?: string[] | null
          id?: string
          images?: string[] | null
          instagram_url?: string | null
          is_approved?: boolean | null
          is_pending?: boolean | null
          is_premium?: boolean
          latitude?: number | null
          location?: string | null
          long_description?: string | null
          longitude?: number | null
          max_guests?: number | null
          min_guests?: number | null
          name?: string
          price_range?: string | null
          rating?: number | null
          review_count?: number | null
          service_areas?: string[] | null
          specialties?: string[] | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          telegram_url?: string | null
          tiktok_url?: string | null
          updated_at?: string
          vendor_id?: string
          view_count?: number | null
          unique_view_count?: number | null
          website?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      cuisine_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      event_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          category: string | null
          caterer_id: string
          created_at: string
          description: string | null
          dietary_info: string[] | null
          id: string
          image: string | null
          is_popular: boolean | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          caterer_id: string
          created_at?: string
          description?: string | null
          dietary_info?: string[] | null
          id?: string
          image?: string | null
          is_popular?: boolean | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          caterer_id?: string
          created_at?: string
          description?: string | null
          dietary_info?: string[] | null
          id?: string
          image?: string | null
          is_popular?: boolean | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_caterer_id_fkey"
            columns: ["caterer_id"]
            isOneToOne: false
            referencedRelation: "caterers"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          caterer_id: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          includes: string[] | null
          is_active: boolean | null
          max_guests: number | null
          min_guests: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          caterer_id: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          includes?: string[] | null
          is_active?: boolean | null
          max_guests?: number | null
          min_guests?: number | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          caterer_id?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          includes?: string[] | null
          is_active?: boolean | null
          max_guests?: number | null
          min_guests?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_caterer_id_fkey"
            columns: ["caterer_id"]
            isOneToOne: false
            referencedRelation: "caterers"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_unavailability: {
        Row: {
          blocked_date: string
          caterer_id: string
          created_at: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          caterer_id: string
          created_at?: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          caterer_id?: string
          created_at?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_unavailability_caterer_id_fkey"
            columns: ["caterer_id"]
            isOneToOne: false
            referencedRelation: "caterers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          caterer_id: string
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
          response: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          caterer_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          response?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          caterer_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          response?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_caterer_id_fkey"
            columns: ["caterer_id"]
            isOneToOne: false
            referencedRelation: "caterers"
            referencedColumns: ["id"]
          },
        ]
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
      home_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          link_caterer_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          link_caterer_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          link_caterer_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_banners_link_caterer_id_fkey"
            columns: ["link_caterer_id"]
            isOneToOne: false
            referencedRelation: "caterers"
            referencedColumns: ["id"]
          },
        ]
      }
      caterer_profile_views: {
        Row: {
          caterer_id: string
          device_id: string | null
          id: string
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          caterer_id: string
          device_id?: string | null
          id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          caterer_id?: string
          device_id?: string | null
          id?: string
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "caterer_profile_views_caterer_id_fkey"
            columns: ["caterer_id"]
            isOneToOne: false
            referencedRelation: "caterers"
            referencedColumns: ["id"]
          },
        ]
      }
      caterer_unique_viewers: {
        Row: {
          caterer_id: string
          first_viewed_at: string
          viewer_key: string
        }
        Insert: {
          caterer_id: string
          first_viewed_at?: string
          viewer_key: string
        }
        Update: {
          caterer_id?: string
          first_viewed_at?: string
          viewer_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "caterer_unique_viewers_caterer_id_fkey"
            columns: ["caterer_id"]
            isOneToOne: false
            referencedRelation: "caterers"
            referencedColumns: ["id"]
          },
        ]
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
      is_admin: { Args: never; Returns: boolean }
      is_caterer_owner: { Args: { _caterer_id: string }; Returns: boolean }
      is_customer: { Args: never; Returns: boolean }
      is_vendor: { Args: never; Returns: boolean }
      track_caterer_view: {
        Args: { p_caterer_id: string; p_device_id?: string | null }
        Returns: Json
      }
    }
    Enums: {
      app_role: "customer" | "vendor" | "admin"
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
      app_role: ["customer", "vendor", "admin"],
    },
  },
} as const
