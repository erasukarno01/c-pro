export type Database = {
  public: {
    Tables: {
      shift_runs: {
        Row: {
          id: string;
          line_id: string;
          product_id: string;
          shift_id: string;
          group_id: string | null;
          leader_user_id: string | null;
          work_order: string | null;
          target_qty: number;
          hourly_target: number;
          status: "setup" | "running" | "completed" | "cancelled";
          started_at: string | null;
          ended_at: string | null;
          notes: string | null;
          plan_start_at: string | null;
          plan_finish_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["shift_runs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["shift_runs"]["Row"]>;
      };
      hourly_outputs: {
        Row: {
          id: string;
          shift_run_id: string;
          hour_index: number;
          hour_label: string;
          actual_qty: number;
          ng_qty: number;
          downtime_minutes: number;
          is_break: boolean;
          note: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["hourly_outputs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["hourly_outputs"]["Row"]>;
      };
      ng_entries: {
        Row: {
          id: string;
          shift_run_id: string;
          defect_type_id: string | null;
          process_id: string | null;
          qty: number;
          disposition: string;
          description: string | null;
          found_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ng_entries"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["ng_entries"]["Row"]>;
      };
      downtime_entries: {
        Row: {
          id: string;
          shift_run_id: string;
          category_id: string | null;
          kind: "planned" | "unplanned";
          duration_minutes: number;
          started_at: string;
          ended_at: string | null;
          root_cause: string | null;
          action_taken: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["downtime_entries"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["downtime_entries"]["Row"]>;
      };
      check_sheet_results: {
        Row: {
          id: string;
          shift_run_id: string;
          template_id: string;
          passed: boolean;
          checked_at: string;
          note: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["check_sheet_results"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["check_sheet_results"]["Row"]>;
      };
      eosr_reports: {
        Row: {
          id: string;
          shift_run_id: string;
          total_actual: number;
          total_ng: number;
          total_downtime_min: number;
          achievement_pct: number;
          oee_pct: number;
          notes: string | null;
          signed_by_name: string | null;
          signed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["eosr_reports"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["eosr_reports"]["Row"]>;
      };
      lines: {
        Row: {
          id: string;
          code: string;
          name: string;
          active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["lines"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["lines"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          code: string;
          name: string;
          model: string | null;
          active: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      shifts: {
        Row: {
          id: string;
          name: string;
          start_time: string;
          end_time: string;
          break_minutes: number;
        };
        Insert: Partial<Database["public"]["Tables"]["shifts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["shifts"]["Row"]>;
      };
      groups: {
        Row: {
          id: string;
          code: string;
          line_id: string;
          active: boolean;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["groups"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["groups"]["Row"]>;
      };
      group_leaders: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
        };
        Insert: Partial<Database["public"]["Tables"]["group_leaders"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["group_leaders"]["Row"]>;
      };
      processes: {
        Row: {
          id: string;
          code: string;
          name: string;
          line_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["processes"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["processes"]["Row"]>;
      };
      operator_skills: {
        Row: {
          id: string;
          operator_id: string;
          skill_id: string;
          level: number;
          wi_pass: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["operator_skills"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["operator_skills"]["Row"]>;
      };
      downtime_categories: {
        Row: {
          id: string;
          code: string;
          name: string;
          is_planned: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["downtime_categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["downtime_categories"]["Row"]>;
      };
      defect_types: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["defect_types"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["defect_types"]["Row"]>;
      };
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          email: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_roles: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
    Enums: Record<string, never>;
  };
};
