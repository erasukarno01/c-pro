import type { MonitoringRun, MonHourlyOutput, MonNGAgg, MonDowntimeAgg, CheckItem, M4Item, SCWEvent, ProductionMetrics, OEEMetrics, QualityMetrics, DowntimeMetrics } from "./monitoring.types";

export type { MonitoringRun, MonHourlyOutput, MonNGAgg, MonDowntimeAgg, CheckItem, M4Item, SCWEvent, ProductionMetrics, OEEMetrics, QualityMetrics, DowntimeMetrics };

export interface MonDowntimeRaw {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number;
  kind: "planned" | "unplanned";
  root_cause?: string;
  action_taken?: string;
  downtime_categories?: {
    code: string;
    name: string;
    is_planned: boolean;
  } | null;
}

export interface MonHourlyOutputConsolidated {
  id: string;
  shift_run_id: string;
  hour_index: number;
  hour_label: string;
  actual_qty: number;
  ng_qty: number;
  downtime_minutes: number;
  is_break: boolean;
  note: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
