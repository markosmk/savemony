import type { FrequencyType, ISODate } from "../types";
import { roundUp } from "../utils/currency-helpers";
import { addDaysUTC, diffInDaysUTC, endOfMonthUTC, getDayOfWeekUTC, todayUTC } from "../utils/date-helpers";
import type { AdjustmentMode, AdjustmentResult, CalculationInput, CalculationResult, PlanTemplate } from "./types";

/** Logica de frecuencia */
function matchesFrequency(date: ISODate, type: FrequencyType, customDays?: number[]): boolean {
  const dow = getDayOfWeekUTC(date);

  switch (type) {
    case "DAILY":
      return true;
    case "WEEKDAYS":
      return dow >= 1 && dow <= 5;
    case "WEEKLY":
      return getDayOfWeekUTC(date) === getDayOfWeekUTC(todayUTC());
    case "BIWEEKLY": {
      const today = todayUTC();
      const daysDiff = diffInDaysUTC(today, date);
      return daysDiff % 14 === 0;
    }
    case "MONTHLY": {
      const today = todayUTC();
      const todayDay = parseInt(today.split("-")[2], 10);
      const dateDay = parseInt(date.split("-")[2], 10);
      const lastDayOfMonth = parseInt(endOfMonthUTC(date).split("-")[2], 10);
      return dateDay === Math.min(todayDay, lastDayOfMonth);
    }
    case "CUSTOM_DAYS":
      return customDays?.includes(dow) ?? false;
    default:
      return false;
  }
}

/**
 * Devuelve TODAS las fechas de depósito desde HOY hasta endDate.
 */
export function getDepositDates(input: CalculationInput): ISODate[] {
  const { endDate, frequencyType, customDays } = input;
  const dates: ISODate[] = [];
  let current = todayUTC();

  while (current <= endDate) {
    if (matchesFrequency(current, frequencyType, customDays)) {
      dates.push(current);
    }
    current = addDaysUTC(current, 1);
  }

  return dates;
}

/**
 * Calcula la cuota sugerida al CREAR el plan.
 * Fórmula: goalAmount / número de períodos desde hoy hasta endDate.
 */
export function calculateSuggestedQuota(input: CalculationInput): number {
  const dates = getDepositDates(input);
  if (dates.length === 0) return 0;
  const raw = input.goalAmount / dates.length;
  return roundUp(raw, input.roundTo ?? 1000);
}

/**
 * Resumen completo del plan para previsualización ANTES de guardar.
 */
export function calculatePlanSummary(input: CalculationInput): CalculationResult {
  const depositDates = getDepositDates(input);
  const numberOfPeriods = depositDates.length;
  const suggestedQuota = calculateSuggestedQuota(input);
  const totalAmount = suggestedQuota * numberOfPeriods;
  const daysTotal = Math.max(1, diffInDaysUTC(todayUTC(), input.endDate));

  return {
    suggestedQuota,
    numberOfPeriods,
    depositDates,
    totalAmount,
    dailyAverage: Math.round(input.goalAmount / daysTotal),
  };
}

/**
 * Cuando el usuario modifica la cuota sugerida al CREAR el plan.
 */
export function adjustPlanByQuota(input: CalculationInput, newQuota: number, mode: AdjustmentMode): AdjustmentResult {
  if (newQuota <= 0) {
    throw new Error("La cuota debe ser mayor a cero");
  }

  const originalDates = getDepositDates(input);
  const originalPeriods = originalDates.length;

  if (mode === "adjust-goal") {
    const adjustedGoalAmount = newQuota * originalPeriods;
    return {
      mode,
      newQuota,
      adjustedGoalAmount,
      adjustedEndDate: input.endDate,
      adjustedPeriods: originalPeriods,
      message: `Mantienes la fecha ${input.endDate}, pero tu meta baja a $${adjustedGoalAmount.toLocaleString("es-CL")}.`,
    };
  }

  // mode === 'adjust-date'
  const periodsNeeded = Math.ceil(input.goalAmount / newQuota);
  const newDates: ISODate[] = [];
  let current = todayUTC();

  while (newDates.length < periodsNeeded) {
    if (matchesFrequency(current, input.frequencyType, input.customDays)) {
      newDates.push(current);
    }
    current = addDaysUTC(current, 1);
  }

  const adjustedEndDate = newDates[newDates.length - 1];
  const adjustedGoalAmount = newQuota * periodsNeeded;

  return {
    mode,
    newQuota,
    adjustedGoalAmount,
    adjustedEndDate,
    adjustedPeriods: periodsNeeded,
    message: `Mantienes la meta, pero tu fecha límite se mueve al ${adjustedEndDate}.`,
  };
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "vacations",
    name: "Vacaciones",
    icon: "🏖️",
    defaultGoalAmount: 1_500_000,
    defaultFrequency: "WEEKLY",
    defaultMonths: 6,
    description: "Un viaje de descanso",
  },
  {
    id: "car",
    name: "Auto usado",
    icon: "🚗",
    defaultGoalAmount: 5_000_000,
    defaultFrequency: "MONTHLY",
    defaultMonths: 24,
    description: "Pie para un auto",
  },
  {
    id: "ps5",
    name: "PS5 / Consola",
    icon: "🎮",
    defaultGoalAmount: 600_000,
    defaultFrequency: "WEEKLY",
    defaultMonths: 4,
    description: "Entretenimiento",
  },
  {
    id: "emergency",
    name: "Fondo de Emergencia",
    icon: "🛡️",
    defaultGoalAmount: 2_000_000,
    defaultFrequency: "MONTHLY",
    defaultMonths: 12,
    description: "3 meses de gastos",
  },
];
