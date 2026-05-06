import { z } from "zod";

export const lineFormSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  sort_order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const productFormSchema = z.object({
  code: z.string().min(1).max(30),
  name: z.string().min(1).max(120),
  model: z.string().max(120).nullable().optional(),
  category: z.string().max(120).nullable().optional(),
  active: z.boolean().default(true),
});

export const processFormSchema = z.object({
  line_id: z.string().uuid(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(120),
  sort_order: z.number().int().min(0).default(0),
  cycle_time_sec: z.number().int().min(0).nullable().optional(),
  active: z.boolean().default(true),
});

export const shiftFormSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  start_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  break_minutes: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export type LineForm = z.infer<typeof lineFormSchema>;
export type ProductForm = z.infer<typeof productFormSchema>;
export type ProcessForm = z.infer<typeof processFormSchema>;
export type ShiftForm = z.infer<typeof shiftFormSchema>;

