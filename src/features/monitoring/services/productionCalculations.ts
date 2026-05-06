import type {
  CheckItem,
  DowntimeMetrics,
  M4Item,
  MonCheckSheet,
  MonDowntimeAgg,
  MonDowntimeRaw,
  MonHourlyOutput,
  MonNGAgg,
  MonSkill,
  OEEMetrics,
  ProductionMetrics,
  QualityMetrics,
  SCWEvent,
  SkillRow,
} from "@/types/monitoring.types";

export class ProductionCalculations {
  static calculateProductionMetrics(hourly: MonHourlyOutput[], run: { target_qty: number; hourly_target: number; started_at: string | null }): ProductionMetrics {
    const totalActual = hourly.reduce((sum, h) => sum + (h.actual_qty ?? 0), 0);
    const totalNg = hourly.reduce((sum, h) => sum + (h.ng_qty ?? 0), 0);
    const achievement = run.target_qty > 0 ? (totalActual / run.target_qty) * 100 : 0;
    return {
      totalActual,
      totalNg,
      targetQty: run.target_qty ?? 0,
      hourlyTarget: run.hourly_target ?? 0,
      achievement: Math.round(achievement * 10) / 10,
      startTime: run.started_at ? new Date(run.started_at) : null,
    };
  }

  static calculateOEEMetrics(hourly: MonHourlyOutput[], dtAgg: MonDowntimeAgg[], run: { target_qty: number }): OEEMetrics {
    const totalActual = hourly.reduce((sum, h) => sum + (h.actual_qty ?? 0), 0);
    const totalNg = hourly.reduce((sum, h) => sum + (h.ng_qty ?? 0), 0);
    const totalDt = dtAgg.reduce((sum, d) => sum + (d.total_min ?? 0), 0);
    const availability = Math.max(0, (480 - totalDt) / 480) * 100;
    const performance = run.target_qty > 0 ? Math.min(100, (totalActual / run.target_qty) * 100) : 0;
    const quality = totalActual > 0 ? ((totalActual - totalNg) / totalActual) * 100 : 0;
    const oee = (availability * performance * quality) / 10000;
    return {
      oee: Math.round(oee * 10) / 10,
      otr: Math.round(availability * 10) / 10,
      per: Math.round(performance * 10) / 10,
      qr: Math.round(quality * 10) / 10,
      totalActual,
      totalNg,
      totalDt,
      achievement: run.target_qty > 0 ? Math.round((totalActual / run.target_qty) * 1000) / 10 : 0,
    };
  }

  static calculateQualityMetrics(hourly: MonHourlyOutput[], ngAgg: MonNGAgg[]): QualityMetrics {
    const totalProduction = hourly.reduce((sum, h) => sum + (h.actual_qty ?? 0), 0);
    const totalDefects = ngAgg.reduce((sum, n) => sum + (n.total_qty ?? 0), 0);
    const ngRatio = totalProduction > 0 ? (totalDefects / totalProduction) * 100 : 0;
    const status = ngRatio <= 1 ? "excellent" : ngRatio <= 3 ? "good" : ngRatio <= 5 ? "acceptable" : "critical";
    return { ngRatio: Math.round(ngRatio * 100) / 100, totalDefects, totalProduction, status };
  }

  static calculateDowntimeMetrics(dtAgg: MonDowntimeAgg[]): DowntimeMetrics {
    const totalMinutes = dtAgg.reduce((sum, d) => sum + (d.total_min ?? 0), 0);
    const plannedMinutes = dtAgg.filter((d) => d.category_name?.toLowerCase().includes("planned")).reduce((sum, d) => sum + d.total_min, 0);
    const availabilityRate = Math.max(0, ((480 - totalMinutes) / 480) * 100);
    const lossPercentage = (totalMinutes / 480) * 100;
    const status = lossPercentage <= 5 ? "excellent" : lossPercentage <= 10 ? "good" : lossPercentage <= 20 ? "concerning" : "critical";
    return {
      totalMinutes,
      plannedMinutes,
      availabilityRate: Math.round(availabilityRate * 10) / 10,
      lossPercentage: Math.round(lossPercentage * 10) / 10,
      status,
    };
  }

  static transformCheckSheets(checks: MonCheckSheet[], kind: "5F5L" | "AUTONOMOUS"): CheckItem[] {
    return checks
      .filter((c) => c.check_sheet_templates?.kind === kind)
      .sort((a, b) => (a.check_sheet_templates?.sort_order ?? 0) - (b.check_sheet_templates?.sort_order ?? 0))
      .map((c) => ({
        label: c.check_sheet_templates?.label ?? "-",
        time: c.checked_at,
        done: !!c.passed,
      }));
  }

  static calculateM4Items(skills: MonSkill[], dtRaw: MonDowntimeRaw[], lineId?: string): M4Item[] {
    const filtered = lineId ? skills.filter((s) => s.assigned_line_ids?.includes(lineId)) : skills;
    const wiFail = filtered.flatMap((s) => s.skills).filter((x) => !x.wi_pass).length;
    const downtimeCount = dtRaw.length;
    return [
      { icon: "users", label: "Man", badge: `${filtered.length}`, tone: "green", title: "Operator active" },
      { icon: "shield", label: "Method", badge: wiFail > 0 ? `${wiFail} gap` : "OK", tone: wiFail > 0 ? "amber" : "green", title: "WI compliance" },
      { icon: "clock", label: "Machine", badge: `${downtimeCount} event`, tone: downtimeCount > 0 ? "amber" : "green", title: "Downtime events" },
    ];
  }

  static transformSCWEvents(dtRaw: MonDowntimeRaw[]): SCWEvent[] {
    return dtRaw.map((d) => ({
      id: d.id,
      marker: d.kind === "unplanned" ? "STOP" : "WAIT",
      label: d.downtime_categories?.name ?? d.kind,
      time: d.started_at,
      badge: d.ended_at ? "Resolved" : "On-going",
      meta: d.root_cause ?? "-",
    }));
  }

  static calculateSkillMatrix(skills: MonSkill[], lineId?: string): SkillRow[] {
    const filtered = lineId ? skills.filter((s) => s.assigned_line_ids?.includes(lineId)) : skills;
    return filtered.map((s) => ({
      name: s.full_name,
      initials: s.initials ?? "-",
      join: s.join_date,
      skills: s.skills,
      wi: s.skills.every((x) => x.wi_pass) ? "PASS" : s.skills.some((x) => x.wi_pass) ? "CHECK" : "FAIL",
    }));
  }
}

