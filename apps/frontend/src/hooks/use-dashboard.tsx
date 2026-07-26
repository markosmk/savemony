import { useMemo } from "react";
import type {
  Entry as AnalyticsEntry,
  Entry as DashboardEntry,
  Entry as FlexibleEntry,
  Plan,
  Entry as StreakEntry,
} from "@savemony/shared";
import { getCurrentPeriodInfo, getPiggyBankSummary, getStreakInfo, getTotalProgress } from "@savemony/shared";

/**
 * Hook unificado que expone TODO lo necesario para el Dashboard V2.
 * Combina: período, progreso, rachas, modo flexible, analytics.
 *
 * use:
 * const dashboard = useDashboard(plan, entries);
 *
 * Acceso directo:
 * dashboard.periodInfo      // estado del botón
 * dashboard.progress        // progreso total
 * dashboard.streakInfo      // rachas e insignias
 * dashboard.piggySummary    // resumen flexible (o null)
 * dashboard.entries         // datos crudos para analytics
 */
export function useDashboardV2(plan: Plan, entries: DashboardEntry[]) {
  const today = new Date().toISOString().split("T")[0];

  // ── Core ──
  const periodInfo = useMemo(() => getCurrentPeriodInfo(plan, entries, today), [plan, entries, today]);
  const progress = useMemo(() => getTotalProgress(plan, entries), [plan, entries]);

  // ── Rachas ──
  const streakInfo = useMemo(() => getStreakInfo(entries as StreakEntry[], today), [entries, today]);

  // ── Flexible ──
  const piggySummary = useMemo(
    () => (plan.isFlexible ? getPiggyBankSummary(entries as FlexibleEntry[]) : null),
    [plan.isFlexible, entries],
  );

  // ── Analytics ──
  const analyticsEntries = entries as AnalyticsEntry[];

  return {
    // Core
    periodInfo,
    progress,
    today,

    // Rachas
    streakInfo,

    // Flexible
    piggySummary,
    isFlexible: plan.isFlexible,

    // Raw data para componentes que hacen sus propios cálculos
    plan,
    entries: analyticsEntries,
  };
}
