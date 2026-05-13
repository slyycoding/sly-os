export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: "not_started" | "in_progress" | "done";
          priority: "low" | "medium" | "high";
          due_date: string | null;
          due_time: string | null;
          tags: string[];
          project_id: string | null;
          is_recurring: boolean;
          recurrence_pattern: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tasks"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
          priority: "low" | "medium" | "high";
          progress: number;
          deadline: string | null;
          client: string | null;
          project_type: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["projects"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      project_milestones: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          due_date: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_milestones"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["project_milestones"]["Insert"]>;
      };
      project_logs: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          title: string;
          update: string;
          blockers: string | null;
          next_steps: string | null;
          log_date: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["project_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["project_logs"]["Insert"]>;
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          category: string | null;
          tags: string[];
          is_pinned: boolean;
          project_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notes"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["notes"]["Insert"]>;
      };
      gym_logs: {
        Row: {
          id: string;
          user_id: string;
          workout_date: string;
          workout_type: string | null;
          duration_minutes: number | null;
          notes: string | null;
          bodyweight: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["gym_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["gym_logs"]["Insert"]>;
      };
      exercises: {
        Row: {
          id: string;
          gym_log_id: string;
          user_id: string;
          name: string;
          sets: number;
          reps: number | null;
          weight_kg: number | null;
          is_pr: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["exercises"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["exercises"]["Insert"]>;
      };
      skincare_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          time_of_day: "morning" | "night";
          products_used: string[];
          skin_condition: string | null;
          irritation_level: number | null;
          breakouts: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["skincare_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["skincare_logs"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          brand: string | null;
          category: "skincare" | "gym" | "tech" | "supplements" | "grooming" | "food" | "software" | "other";
          price: number | null;
          purchase_date: string | null;
          expiry_date: string | null;
          rating: number | null;
          notes: string | null;
          status: "active" | "running_low" | "finished" | "discontinued";
          rebuy: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      income: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          amount: number;
          frequency: "once" | "weekly" | "fortnightly" | "monthly" | "yearly";
          received_date: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["income"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["income"]["Insert"]>;
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          amount: number;
          category: string;
          expense_date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["expenses"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };
      debts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          total_amount: number;
          remaining_amount: number;
          interest_rate: number | null;
          minimum_payment: number | null;
          due_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["debts"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["debts"]["Insert"]>;
      };
      bills: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          due_date: string;
          frequency: "once" | "weekly" | "fortnightly" | "monthly" | "yearly";
          category: string;
          is_paid: boolean;
          auto_pay: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bills"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["bills"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          amount: number;
          billing_cycle: "weekly" | "monthly" | "yearly";
          next_billing_date: string | null;
          category: string | null;
          is_active: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      savings_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          deadline: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["savings_goals"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["savings_goals"]["Insert"]>;
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string;
          frequency: "daily" | "weekly" | "custom";
          target_days: number[];
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["habits"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["habits"]["Insert"]>;
      };
      habit_logs: {
        Row: {
          id: string;
          habit_id: string;
          user_id: string;
          log_date: string;
          completed: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["habit_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["habit_logs"]["Insert"]>;
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: "money" | "fitness" | "study" | "business" | "health" | "personal";
          timeframe: "daily" | "weekly" | "monthly" | "yearly";
          status: "not_started" | "in_progress" | "completed" | "abandoned";
          progress: number;
          deadline: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["goals"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["goals"]["Insert"]>;
      };
      learning_paths: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          icon: string | null;
          color: string;
          progress: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["learning_paths"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["learning_paths"]["Insert"]>;
      };
      learning_topics: {
        Row: {
          id: string;
          path_id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: "not_started" | "learning" | "completed" | "needs_revision";
          priority: "low" | "medium" | "high";
          estimated_hours: number | null;
          due_date: string | null;
          completed_date: string | null;
          notes: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["learning_topics"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["learning_topics"]["Insert"]>;
      };
      learning_resources: {
        Row: {
          id: string;
          topic_id: string;
          user_id: string;
          title: string;
          url: string | null;
          type: "video" | "article" | "course" | "book" | "docs" | "other";
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["learning_resources"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["learning_resources"]["Insert"]>;
      };
      study_sessions: {
        Row: {
          id: string;
          user_id: string;
          path_id: string | null;
          topic_id: string | null;
          start_time: string;
          end_time: string | null;
          duration_minutes: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["study_sessions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["study_sessions"]["Insert"]>;
      };
      certificates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          issuer: string | null;
          path_id: string | null;
          issue_date: string | null;
          expiry_date: string | null;
          credential_url: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["certificates"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["certificates"]["Insert"]>;
      };
      health_logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          sleep_hours: number | null;
          mood: number | null;
          energy: number | null;
          weight_kg: number | null;
          water_ml: number | null;
          protein_g: number | null;
          calories: number | null;
          symptoms: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["health_logs"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["health_logs"]["Insert"]>;
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          reminder_type: "bill" | "subscription" | "gym" | "skincare" | "deadline" | "study" | "product" | "custom";
          due_date: string;
          due_time: string | null;
          is_recurring: boolean;
          recurrence_pattern: string | null;
          is_completed: boolean;
          related_id: string | null;
          related_type: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reminders"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reminders"]["Insert"]>;
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          event_type: "work_shift" | "study" | "gym" | "appointment" | "deadline" | "reminder" | "personal";
          start_date: string;
          end_date: string | null;
          start_time: string | null;
          end_time: string | null;
          all_day: boolean;
          color: string;
          is_recurring: boolean;
          recurrence_pattern: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["calendar_events"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["calendar_events"]["Insert"]>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
