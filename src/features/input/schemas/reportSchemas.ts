import { z } from "zod";

export const shiftSetupSchema = z.object({
  line_id: z.string().uuid(),
  shift_id: z.string().uuid(),
  product_id: z.string().uuid(),
  target_quantity: z.number().int().positive(),
  hourly_target: z.number().int().positive(),
  work_order_no: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export const hourlyOutputSchema = z.object({
  hour_index: z.number().int().min(0),
  hour_label: z.string().min(1).max(20),
  actual_qty: z.number().int().min(0),
  ng_qty: z.number().int().min(0),
  downtime_minutes: z.number().int().min(0),
  is_break: z.boolean(),
  note: z.string().max(500).nullable().optional(),
});

export const ngEntrySchema = z.object({
  defect_type_id: z.string().uuid().optional().nullable(),
  process_id: z.string().uuid().optional().nullable(),
  quantity: z.number().int().positive(),
  disposition: z.enum(["accepted", "rework", "scrap", "hold"]),
  description: z.string().max(500).optional(),
});

export const downtimeEntrySchema = z.object({
  category_id: z.string().uuid().optional().nullable(),
  kind: z.enum(["planned", "unplanned"]),
  duration: z.number().int().positive(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  root_cause: z.string().max(500).optional(),
  action_taken: z.string().max(500).optional(),
});

export const eosrSchema = z.object({
  totalActual: z.number().int().min(0),
  totalNg: z.number().int().min(0),
  totalDowntime: z.number().int().min(0),
  oee: z.number().min(0).max(100),
  targetQty: z.number().int().positive(),
  notes: z.string().max(2000).optional(),
  leaderName: z.string().max(100).optional(),
});

