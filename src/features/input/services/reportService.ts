import { supabase } from "@/integrations/supabase/client";
import type { ShiftSetupData, NgEntryData, DowntimeData } from "@/components/modals/ShiftModals";

export const reportService = {
  async createShiftRun(payload: ShiftSetupData) {
    const { data, error } = await supabase
      .from("shift_runs")
      .insert({
        line_id: payload.line_id,
        shift_id: payload.shift_id,
        product_id: payload.product_id,
        work_order: payload.work_order_no || null,
        target_qty: payload.target_quantity,
        hourly_target: payload.hourly_target,
        leader_user_id: payload.leader_user_id || null,
        group_id: payload.group_id ?? null,
        status: "running",
        started_at: payload.actual_started_at ?? new Date().toISOString(),
        plan_start_at: payload.plan_start_at ?? null,
        plan_finish_at: payload.plan_finish_at ?? null,
        notes: payload.notes || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createNgEntry(shiftRunId: string, payload: NgEntryData) {
    const { data, error } = await supabase
      .from("ng_entries")
      .insert({
        shift_run_id: shiftRunId,
        defect_type_id: payload.defect_type_id || null,
        process_id: payload.process_id || null,
        qty: payload.quantity,
        disposition: payload.disposition,
        description: payload.description || null,
        found_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async createDowntimeEntry(shiftRunId: string, payload: DowntimeData) {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("downtime_entries")
      .insert({
        shift_run_id: shiftRunId,
        category_id: payload.category_id || null,
        kind: payload.kind,
        duration_minutes: payload.duration,
        started_at: `${today}T${payload.start_time}:00`,
        ended_at: `${today}T${payload.end_time}:00`,
        root_cause: payload.root_cause || null,
        action_taken: payload.action_taken || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

