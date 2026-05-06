/**
 * Domain data hooks for the Shift Setup feature.
 * Pure server-state queries — no local UI state.
 *
 * Types sourced from:
 * - @/types/database.generated.ts  → Database type (Supabase schema)
 * - @/lib/queryErrorHandler.ts     → Centralized error handling
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createQueryErrorHandler } from "@/lib/queryErrorHandler";
import { Database } from "@/types/database.generated";
import { FALLBACK_CHECK_GROUPS } from "../types";

// ─── Type aliases from Database schema ────────────────────────────────────────

type LineRow         = Database["public"]["Tables"]["lines"]["Row"];
type ProductRow      = Database["public"]["Tables"]["products"]["Row"];
type ShiftRow        = Database["public"]["Tables"]["shifts"]["Row"];
type GroupRow        = Database["public"]["Tables"]["groups"]["Row"];
type GroupLeaderRow  = Database["public"]["Tables"]["group_leaders"]["Row"];
type ProcessRow      = Database["public"]["Tables"]["processes"]["Row"];
type OperatorRow     = Database["public"]["Tables"]["profiles"]["Row"];

// ─── Join / derived types ─────────────────────────────────────────────────────

interface GroupLeaderWithGroup {
  id: GroupLeaderRow["id"];
  group_id: GroupLeaderRow["group_id"];
  groups: Pick<GroupRow, "id" | "code" | "line_id"> | null;
}

interface LineProduct {
  id: string;
  code: string;
  name: string;
  model: string | null;
}

interface LineOperator {
  id: string;
  full_name: string | null;
  initials: string | null;
  employee_code: string | null;
  avatar_color: string | null;
  position: string | null;
}

interface ProcessAssignment {
  process_id: string;
  processes: Pick<ProcessRow, "id" | "code" | "name"> | null;
  default_assignments: OperatorAssignment[];
}

interface OperatorAssignment {
  operator_id: string;
  process_id: string | null;
  operators: Pick<OperatorRow, "id" | "full_name" | "initials" | "employee_code" | "avatar_color" | "position"> | null;
}

interface GroupPOSResult {
  groupId: string | null;
  groupCode: string;
  posData: ProcessAssignment[];
}

// ─── Master data ──────────────────────────────────────────────────────────────

export function useLines() {
  return useQuery<LineRow[], Error>({
    queryKey: ["lines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lines")
        .select("id, code, name, active")
        .eq("active", true)
        .order("code");
      if (error) throw error;
      return (data ?? []) as LineRow[];
    },
  });
}

export function useProducts() {
  return useQuery<ProductRow[], Error>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, model")
        .eq("active", true)
        .order("code");
      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });
}

export function useAllShifts() {
  return useQuery<ShiftRow[], Error>({
    queryKey: ["shifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .order("start_time");
      if (error) throw error;
      return (data ?? []) as ShiftRow[];
    },
  });
}

// ─── Leader-scoped data ───────────────────────────────────────────────────────

export function useLeaderGroups(userId?: string) {
  return useQuery<GroupLeaderWithGroup[], Error>({
    queryKey: ["leader_groups", userId],
    queryFn: async () => {
      if (!userId) return [];

      const handleError = createQueryErrorHandler("leader groups");


      const { data: basicData, error: basicError } = await supabase
        .from("group_leaders")
        .select("id, group_id")
        .eq("user_id", userId);

      if (basicError) {
        handleError(basicError);
        throw basicError;
      }

      if (!basicData || basicData.length === 0) return [];

      const groupIds = basicData
        .map((gl) => gl.group_id)
        .filter((id): id is string => Boolean(id));

      if (groupIds.length === 0) return basicData as GroupLeaderWithGroup[];

      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("id, code, line_id")
        .in("id", groupIds);

      if (groupsError) {
        handleError(groupsError);
        throw groupsError;
      }

      return (basicData as GroupLeaderRow[]).map((gl) => ({
        id: gl.id,
        group_id: gl.group_id,
        groups: groupsData?.find((g) => g.id === gl.group_id) ?? null,
      }));
    },
    enabled: !!userId,
  });
}

// ─── Line-scoped data ─────────────────────────────────────────────────────────

export function useLineProducts(lineId?: string) {
  return useQuery<LineProduct[], Error>({
    queryKey: ["line_products", lineId],
    queryFn: async () => {
      if (!lineId) return [];
      const handleError = createQueryErrorHandler("line products");

      const { data, error } = await supabase
        .from("product_lines")
        .select("product_id, products(id, code, name, model)")
        .eq("line_id", lineId);

      if (error) {
        handleError(error);
        throw error;
      }

      return (data ?? []).map((lp) => ({
        id: lp.product_id,
        code: (lp.products as ProductRow).code,
        name: (lp.products as ProductRow).name,
        model: (lp.products as ProductRow).model,
      })) as LineProduct[];
    },
    enabled: !!lineId,
  });
}

export function useLineOperators(lineId?: string) {
  return useQuery<LineOperator[], Error>({
    queryKey: ["line_operators", lineId],
    queryFn: async () => {
      if (!lineId) return [];
      const handleError = createQueryErrorHandler("line operators");

      const { data, error } = await supabase
        .from("operator_line_assignments")
        .select(
          "operator_id, operators(id, full_name, initials, employee_code, avatar_color, position)"
        )
        .eq("line_id", lineId);


      if (error) {
        handleError(error);
        throw error;
      }

      return (
        (data ?? []).map((la) => ({
          id: (la.operators as OperatorRow).id,
          full_name: (la.operators as OperatorRow).full_name,
          initials: (la.operators as OperatorRow).initials,
          employee_code: (la.operators as OperatorRow).employee_code,
          avatar_color: (la.operators as OperatorRow).avatar_color,
          position: (la.operators as OperatorRow).position,
        })) as LineOperator[]
      );
    },
    enabled: !!lineId,
  });
}

export function useLineGroups(lineId?: string) {
  return useQuery<GroupRow[], Error>({
    queryKey: ["line_groups", lineId],
    queryFn: async () => {
      if (!lineId) return [];
      const handleError = createQueryErrorHandler("line groups");

      const { data, error } = await supabase
        .from("groups")
        .select("id, code, line_id, active, sort_order")
        .eq("line_id", lineId)
        .eq("active", true)
        .order("sort_order");


      if (error) {
        handleError(error);
        throw error;
      }

      return (data ?? []) as GroupRow[];
    },
    enabled: !!lineId,
  });
}

// ─── Group-scoped data ────────────────────────────────────────────────────────

export function useGroupPOS(groupId?: string) {
  return useQuery<GroupPOSResult, Error>({
    queryKey: ["group_pos", groupId],
    queryFn: async () => {
      if (!groupId) return { groupId: null, groupCode: "", posData: [] };

      const handleError = createQueryErrorHandler("group details");

      // 1. Get group info
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id, code")
        .eq("id", groupId)
        .single();

      if (groupError) {
        handleError(groupError);
        throw groupError;
      }

      // 2. Get process assignments for this group
      const { data: posData, error: posError } = await supabase
        .from("group_process_assignments")
        .select("process_id, processes(id, code, name)")
        .eq("group_id", groupId);

      if (posError) {
        handleError(posError);
        throw posError;
      }

      // 3. Get line_id from group for fallback operator lookup
      const { data: groupDetail } = await supabase
        .from("groups")
        .select("line_id")
        .eq("id", groupId)
        .single();

      const processIds = (posData ?? []).map((p) => p.process_id);

      // 4. Fetch operator assignments — process-level first, fallback to line-level
      let opAssignments: OperatorAssignment[] = [];

      const { data: processOpAssignments, error: procOpError } = processIds.length
        ? await supabase
            .from("operator_process_assignments")
            .select(
              "operator_id, process_id, operators(id, full_name, initials, employee_code, avatar_color, position)"
            )
            .in("process_id", processIds)
        : { data: null, error: null };

      if (!procOpError && processOpAssignments && processOpAssignments.length > 0) {
        opAssignments = (processOpAssignments as unknown as OperatorAssignment[]).map((op) => ({
          operator_id: op.operator_id,
          process_id: op.process_id,
          operators: op.operators as OperatorAssignment["operators"],
        }));
      } else {
        if (procOpError) handleError(procOpError);

        // Fallback: line-level operators mapped to each process
        if (groupDetail?.line_id) {
          const { data: lineOpAssignments, error: lineOpError } = await supabase
            .from("operator_line_assignments")
            .select(
              "operator_id, operators(id, full_name, initials, employee_code, avatar_color, position)"
            )
            .eq("line_id", groupDetail.line_id);

          if (lineOpError) {
            handleError(lineOpError);
          } else if (lineOpAssignments) {
            opAssignments = (posData ?? []).flatMap((pos) =>
              (lineOpAssignments as unknown as LineOperator[]).map((op) => ({
                operator_id: (op as unknown as { operator_id: string }).operator_id,
                process_id: pos.process_id,
                operators: op as OperatorAssignment["operators"],
              }))
            );
          }
        }
      }

      // 5. Transform: attach default_assignments to each process
      const transformedPosData: ProcessAssignment[] = (posData ?? []).map((pos) => ({
        process_id: pos.process_id,
        processes: pos.processes as ProcessAssignment["processes"],
        default_assignments: opAssignments.filter(
          (op) => op.process_id === pos.process_id
        ),
      }));

      return {
        groupId,
        groupCode: (group as GroupRow).code,
        posData: transformedPosData,
      };
    },
    enabled: !!groupId,
  });
}

// ─── Line checklist items ─────────────────────────────────────────────────────

export function useLineCheckItems(_lineId?: string) {
  const { data } = useQuery<typeof FALLBACK_CHECK_GROUPS, Error>({
    queryKey: ["line_check_items", _lineId],
    queryFn: async () => FALLBACK_CHECK_GROUPS,
  });
  return data ?? FALLBACK_CHECK_GROUPS;
}
