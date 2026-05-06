import { supabase } from "@/integrations/supabase/client";

export interface MasterDataService {
  list<T>(table: string, orderBy?: string): Promise<T[]>;
  create<T>(table: string, payload: Record<string, unknown>): Promise<T>;
  update<T>(table: string, id: string, payload: Record<string, unknown>): Promise<T>;
  remove(table: string, id: string): Promise<void>;
}

export const masterDataService: MasterDataService = {
  async list<T>(table, orderBy = "created_at"): Promise<T[]> {
    const { data, error } = await (supabase.from(table) as any).select("*").order(orderBy);
    if (error) throw error;
    return (data ?? []) as T[];
  },

  async create<T>(table, payload): Promise<T> {
    const { data, error } = await (supabase.from(table) as any).insert(payload).select().single();
    if (error) throw error;
    return data as T;
  },

  async update<T>(table, id, payload): Promise<T> {
    const { data, error } = await (supabase.from(table) as any).update(payload).eq("id", id).select().single();
    if (error) throw error;
    return data as T;
  },

  async remove(table, id): Promise<void> {
    const { error } = await (supabase.from(table) as any).delete().eq("id", id);
    if (error) throw error;
  },
};

