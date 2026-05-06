// Database Type Definitions
// Centralized types for Supabase database operations

// ============================================================================
// Table Map - Maps table names to their row types
// ============================================================================

export interface TableMap {
  profiles: UserProfile;
  user_roles: UserRole;
  lines: ProductionLine;
  groups: Group;
  products: Product;
  processes: Process;
  shifts: Shift;
  operators: Operator;
  ng_categories: NgCategory;
  downtime_categories: DowntimeCategory;
  check_sheet_templates: CheckSheetTemplate;
  check_sheet_results: CheckSheetResult;
  shift_runs: ShiftRun;
  hourly_outputs: HourlyOutput;
  ng_entries: NgEntry;
  downtime_entries: DowntimeEntry;
}

export type AppRole = "super_admin" | "leader" | "supervisor" | "manager";

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

export interface ActiveEntity extends BaseEntity {
  active: boolean;
}

export interface SortableEntity extends BaseEntity {
  sort_order: number;
}

export interface UserProfile {
  user_id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface ProductionLine extends SortableEntity {
  code: string;
  name: string;
  description: string | null;
}

export interface Group extends BaseEntity {
  line_id: string;
  code: string;
  sort_order: number;
  active: boolean;
}

export interface Product extends BaseEntity {
  code: string;
  name: string;
  model: string | null;
  category: string | null;
  active: boolean;
}

export interface Process extends SortableEntity {
  line_id: string;
  code: string;
  name: string;
}

export interface Shift extends BaseEntity {
  name: string;
  code: string;
  start_time: string;
  end_time: string;
}

export interface Operator extends BaseEntity {
  full_name: string;
  employee_code: string | null;
  initials: string | null;
  avatar_color: string | null;
  active: boolean;
  assigned_line_ids: string[];
}

export interface NgCategory extends BaseEntity {
  code: string;
  name: string;
  is_critical: boolean;
  active: boolean;
}

export interface DowntimeCategory extends BaseEntity {
  code: string;
  name: string;
  is_planned: boolean;
  active: boolean;
}

export interface CheckSheetTemplate extends BaseEntity {
  kind: "5F5L" | "AUTONOMOUS";
  label: string;
  frequency: string;
  sort_order: number;
  active: boolean;
}

export interface CheckSheetResult extends BaseEntity {
  shift_run_id: string;
  template_id: string;
  passed: boolean;
  checked_at: string;
}

export interface ShiftRun extends BaseEntity {
  line_id: string;
  shift_id: string;
  product_id: string;
  target_qty: number;
  hourly_target: number;
  status: "setup" | "running" | "paused" | "completed";
  started_at: string | null;
}

export interface HourlyOutput extends BaseEntity {
  shift_run_id: string;
  hour_index: number;
  actual_qty: number;
  ng_qty: number;
}

export interface NgEntry extends BaseEntity {
  shift_run_id: string;
  hour_index: number;
  qty: number;
}

export interface DowntimeEntry extends BaseEntity {
  shift_run_id: string;
  category_id: string;
  kind: "planned" | "unplanned";
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
