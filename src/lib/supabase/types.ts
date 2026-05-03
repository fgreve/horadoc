export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      clinics: {
        Row: {
          id: Database["public"]["Enums"]["clinic_id"];
          name: string;
          short_name: string;
          logo_url: string | null;
          website_url: string;
          booking_url: string;
          sedes: Json;
          scraping_enabled: boolean;
          created_at: string;
        };
        Insert: {
          id: Database["public"]["Enums"]["clinic_id"];
          name: string;
          short_name: string;
          logo_url?: string | null;
          website_url: string;
          booking_url: string;
          sedes?: Json;
          scraping_enabled?: boolean;
          created_at?: string;
        };
        Update: {
          id?: Database["public"]["Enums"]["clinic_id"];
          name?: string;
          short_name?: string;
          logo_url?: string | null;
          website_url?: string;
          booking_url?: string;
          sedes?: Json;
          scraping_enabled?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      specialties: {
        Row: {
          id: string;
          name: string;
          slug: string;
          icon: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          icon?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          icon?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      doctors: {
        Row: {
          id: string;
          clinic_id: Database["public"]["Enums"]["clinic_id"];
          external_id: string | null;
          name: string;
          specialty_id: string | null;
          specialty_raw: string | null;
          sede: string | null;
          accepts_isapre: Json;
          consultation_price: number | null;
          metadata: Json;
          last_seen_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clinic_id: Database["public"]["Enums"]["clinic_id"];
          external_id?: string | null;
          name: string;
          specialty_id?: string | null;
          specialty_raw?: string | null;
          sede?: string | null;
          accepts_isapre?: Json;
          consultation_price?: number | null;
          metadata?: Json;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          clinic_id?: Database["public"]["Enums"]["clinic_id"];
          external_id?: string | null;
          name?: string;
          specialty_id?: string | null;
          specialty_raw?: string | null;
          sede?: string | null;
          accepts_isapre?: Json;
          consultation_price?: number | null;
          metadata?: Json;
          last_seen_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "doctors_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "doctors_specialty_id_fkey";
            columns: ["specialty_id"];
            isOneToOne: false;
            referencedRelation: "specialties";
            referencedColumns: ["id"];
          },
        ];
      };
      available_slots: {
        Row: {
          id: string;
          doctor_id: string;
          clinic_id: Database["public"]["Enums"]["clinic_id"];
          date: string;
          start_time: string;
          end_time: string | null;
          sede: string | null;
          is_telemedicine: boolean;
          raw_data: Json;
          first_seen_at: string;
          last_seen_at: string;
          is_available: boolean;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          clinic_id: Database["public"]["Enums"]["clinic_id"];
          date: string;
          start_time: string;
          end_time?: string | null;
          sede?: string | null;
          is_telemedicine?: boolean;
          raw_data?: Json;
          first_seen_at?: string;
          last_seen_at?: string;
          is_available?: boolean;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          clinic_id?: Database["public"]["Enums"]["clinic_id"];
          date?: string;
          start_time?: string;
          end_time?: string | null;
          sede?: string | null;
          is_telemedicine?: boolean;
          raw_data?: Json;
          first_seen_at?: string;
          last_seen_at?: string;
          is_available?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "available_slots_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "available_slots_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          rut: string | null;
          phone: string | null;
          preferred_clinics: Database["public"]["Enums"]["clinic_id"][];
          notification_email: string | null;
          webhook_url: string | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          rut?: string | null;
          phone?: string | null;
          preferred_clinics?: Database["public"]["Enums"]["clinic_id"][];
          notification_email?: string | null;
          webhook_url?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          rut?: string | null;
          phone?: string | null;
          preferred_clinics?: Database["public"]["Enums"]["clinic_id"][];
          notification_email?: string | null;
          webhook_url?: string | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      alerts: {
        Row: {
          id: string;
          user_id: string;
          doctor_id: string | null;
          doctor_name_query: string | null;
          specialty_id: string | null;
          clinic_ids: Database["public"]["Enums"]["clinic_id"][];
          date_from: string | null;
          date_to: string | null;
          time_from: string | null;
          time_to: string | null;
          days_of_week: number[];
          sede: string | null;
          include_telemedicine: boolean;
          channel: Database["public"]["Enums"]["alert_channel"];
          status: Database["public"]["Enums"]["alert_status"];
          times_triggered: number;
          max_triggers: number;
          last_triggered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          doctor_id?: string | null;
          doctor_name_query?: string | null;
          specialty_id?: string | null;
          clinic_ids?: Database["public"]["Enums"]["clinic_id"][];
          date_from?: string | null;
          date_to?: string | null;
          time_from?: string | null;
          time_to?: string | null;
          days_of_week?: number[];
          sede?: string | null;
          include_telemedicine?: boolean;
          channel?: Database["public"]["Enums"]["alert_channel"];
          status?: Database["public"]["Enums"]["alert_status"];
          times_triggered?: number;
          max_triggers?: number;
          last_triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          doctor_id?: string | null;
          doctor_name_query?: string | null;
          specialty_id?: string | null;
          clinic_ids?: Database["public"]["Enums"]["clinic_id"][];
          date_from?: string | null;
          date_to?: string | null;
          time_from?: string | null;
          time_to?: string | null;
          days_of_week?: number[];
          sede?: string | null;
          include_telemedicine?: boolean;
          channel?: Database["public"]["Enums"]["alert_channel"];
          status?: Database["public"]["Enums"]["alert_status"];
          times_triggered?: number;
          max_triggers?: number;
          last_triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "alerts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_doctor_id_fkey";
            columns: ["doctor_id"];
            isOneToOne: false;
            referencedRelation: "doctors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "alerts_specialty_id_fkey";
            columns: ["specialty_id"];
            isOneToOne: false;
            referencedRelation: "specialties";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          alert_id: string;
          user_id: string;
          slot_id: string | null;
          channel: Database["public"]["Enums"]["alert_channel"];
          payload: Json;
          sent_at: string;
          delivered: boolean;
          error: string | null;
        };
        Insert: {
          id?: string;
          alert_id: string;
          user_id: string;
          slot_id?: string | null;
          channel: Database["public"]["Enums"]["alert_channel"];
          payload: Json;
          sent_at?: string;
          delivered?: boolean;
          error?: string | null;
        };
        Update: {
          id?: string;
          alert_id?: string;
          user_id?: string;
          slot_id?: string | null;
          channel?: Database["public"]["Enums"]["alert_channel"];
          payload?: Json;
          sent_at?: string;
          delivered?: boolean;
          error?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_alert_id_fkey";
            columns: ["alert_id"];
            isOneToOne: false;
            referencedRelation: "alerts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "available_slots";
            referencedColumns: ["id"];
          },
        ];
      };
      scrape_runs: {
        Row: {
          id: string;
          clinic_id: Database["public"]["Enums"]["clinic_id"];
          status: Database["public"]["Enums"]["scrape_status"];
          slots_found: number;
          slots_new: number;
          slots_removed: number;
          duration_ms: number | null;
          error_message: string | null;
          metadata: Json;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          clinic_id: Database["public"]["Enums"]["clinic_id"];
          status?: Database["public"]["Enums"]["scrape_status"];
          slots_found?: number;
          slots_new?: number;
          slots_removed?: number;
          duration_ms?: number | null;
          error_message?: string | null;
          metadata?: Json;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          clinic_id?: Database["public"]["Enums"]["clinic_id"];
          status?: Database["public"]["Enums"]["scrape_status"];
          slots_found?: number;
          slots_new?: number;
          slots_removed?: number;
          duration_ms?: number | null;
          error_message?: string | null;
          metadata?: Json;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "scrape_runs_clinic_id_fkey";
            columns: ["clinic_id"];
            isOneToOne: false;
            referencedRelation: "clinics";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      search_doctors: {
        Args: {
          search_query?: string | null;
          filter_clinic?: Database["public"]["Enums"]["clinic_id"] | null;
          filter_specialty?: string | null;
          result_limit?: number;
        };
        Returns: {
          id: string;
          name: string;
          clinic_id: Database["public"]["Enums"]["clinic_id"];
          clinic_name: string;
          specialty: string | null;
          sede: string | null;
          next_available_date: string | null;
          available_slots_count: number;
        }[];
      };
      match_alerts_for_slot: {
        Args: {
          slot_id: string;
        };
        Returns: {
          alert_id: string;
          user_id: string;
        }[];
      };
    };
    Enums: {
      clinic_id: "indisa" | "clc" | "santa_maria" | "alemana";
      alert_channel: "email" | "push" | "webhook";
      alert_status: "active" | "paused" | "triggered" | "expired";
      scrape_status: "pending" | "running" | "success" | "error";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof (Database["public"]["Enums"])
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;
