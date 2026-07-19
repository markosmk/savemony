import type { Entry, ISODate, Plan, PlanEntryType } from "../types";
import { formatAmount } from "../utils/currency-helpers";
import {
  addDaysUTC,
  diffInDaysUTC,
  endOfMonthUTC,
  endOfWeekUTC,
  formatDate,
  getDayOfWeekUTC,
  getDaysInMonth,
  isWeekdayUTC,
  startOfMonthUTC,
  startOfWeekUTC,
  todayUTC,
} from "../utils/date-helpers";

export type ButtonState = "normal" | "partial" | "completed";

export interface CurrentPeriodInfo {
  periodStart: ISODate;
  periodEnd: ISODate;
  quotaForPeriod: number;
  depositedThisPeriod: number; // Bruto depositado en el período
  withdrawnThisPeriod: number; // Bruto retirado en el período
  netThisPeriod: number; // Neto del período (depositos - retiros)
  state: ButtonState;
  remaining: number;
  nextPeriodStart: ISODate;
  message: string;
  canDepositToday: boolean;
  blockMessage?: string;
  inputDisabled: boolean; // true en estado Parcial
  percentage: number; // this period percentage
}

export interface TotalProgress {
  totalDeposited: number;
  totalWithdrawn: number;
  netSaved: number;
  percentage: number;
  remainingToGoal: number;
  isCompleted: boolean;
}

export interface SmartSuggestion {
  amount: number;
  count: number;
}

export interface CalendarDay {
  day: number;
  amount: number;
  withdrawal: number;
  hasDeposit: boolean;
  intensity: number;
}

/**
 * Calcula los límites del período actual
 */
function getPeriodBounds(plan: Plan, today: ISODate): { start: ISODate; end: ISODate; nextStart: ISODate } {
  const { frequencyType, createdAt } = plan; // customDays

  switch (frequencyType) {
    case "DAILY":
      return { start: today, end: today, nextStart: addDaysUTC(today, 1) };

    case "WEEKDAYS": {
      const start = startOfWeekUTC(today);
      const end = addDaysUTC(start, 4); // Vie
      const nextStart = addDaysUTC(start, 7); // Próximo Lunes
      return { start, end, nextStart };
    }

    case "WEEKLY": {
      const start = startOfWeekUTC(today);
      const end = endOfWeekUTC(today);
      const nextStart = addDaysUTC(start, 7);
      return { start, end, nextStart };
    }

    case "BIWEEKLY": {
      const anchor = createdAt;
      const daysSinceAnchor = diffInDaysUTC(anchor, today);
      const periodsElapsed = Math.floor(daysSinceAnchor / 14);
      const start = addDaysUTC(anchor, periodsElapsed * 14);
      const end = addDaysUTC(start, 13);
      const nextStart = addDaysUTC(start, 14);
      return { start, end, nextStart };
    }

    case "MONTHLY": {
      const start = startOfMonthUTC(today);
      const end = endOfMonthUTC(today);
      const nextStart = addDaysUTC(endOfMonthUTC(today), 1);
      return { start, end, nextStart };
    }

    case "CUSTOM_DAYS": {
      const start = startOfWeekUTC(today);
      const end = endOfWeekUTC(today);
      const nextStart = addDaysUTC(start, 7);
      return { start, end, nextStart };
    }

    default:
      return { start: today, end: today, nextStart: addDaysUTC(today, 1) };
  }
}

/**
 * Verifica si el día actual está dentro de los días personalizados
 */
function isTodayInCustomDays(today: ISODate, customDays?: number[]): boolean {
  if (!customDays || customDays.length === 0) return true;
  return customDays.includes(getDayOfWeekUTC(today));
}

/**
 * Calcula de periodos restantes
 * Cuenta cuántas ocurrencias de la frecuencia quedan desde HOY hasta endDate inclusive.
 * @param fromDate Fecha desde la que contar (default: todayUTC)
 */
export function countRemainingPeriods(
  frequencyType: Plan["frequencyType"],
  endDate: ISODate,
  createdAt: ISODate,
  customDays?: number[],
  fromDate?: ISODate,
): number {
  let count = 0;
  let current = fromDate || todayUTC();

  // Si endDate ya pasó, no hay períodos restantes
  if (current > endDate) return 0;

  while (current <= endDate) {
    const dow = getDayOfWeekUTC(current);
    switch (frequencyType) {
      case "DAILY":
        count++;
        break;
      case "WEEKDAYS":
        if (dow >= 1 && dow <= 5) count++;
        break;
      case "WEEKLY":
        if (getDayOfWeekUTC(current) === getDayOfWeekUTC(createdAt)) count++;
        break;
      case "BIWEEKLY": {
        const daysSinceAnchor = diffInDaysUTC(createdAt, current);
        if (daysSinceAnchor % 14 === 0) count++;
        break;
      }
      case "MONTHLY": {
        const anchorDay = parseInt(createdAt.split("-")[2], 10);
        const currentDay = parseInt(current.split("-")[2], 10);
        const lastDayOfMonth = parseInt(endOfMonthUTC(current).split("-")[2], 10);
        if (currentDay === Math.min(anchorDay, lastDayOfMonth)) count++;
        break;
      }
      case "CUSTOM_DAYS":
        if (customDays?.includes(dow)) count++;
        break;
    }
    current = addDaysUTC(current, 1);
  }

  return Math.max(1, count);
}

/**
 * Calcula el estado del período actual
 */
export function getCurrentPeriodInfo(plan: Plan, entries: Entry[], today: ISODate = todayUTC()): CurrentPeriodInfo {
  if (plan.isFlexible || !plan.goalAmount || !plan.endDate) {
    return {
      periodStart: today,
      periodEnd: today,
      quotaForPeriod: 0,
      depositedThisPeriod: 0,
      withdrawnThisPeriod: 0,
      netThisPeriod: 0,
      state: "normal",
      remaining: 0,
      nextPeriodStart: addDaysUTC(today, 1),
      message: "Modo flexible: ahorra lo que puedas",
      canDepositToday: true,
      inputDisabled: false,
      percentage: 0,
    };
  }

  const { start, end, nextStart } = getPeriodBounds(plan, today);

  // Bloqueo de días no hábiles
  if (plan.frequencyType === "WEEKDAYS" && !isWeekdayUTC(today)) {
    return {
      periodStart: start,
      periodEnd: end,
      quotaForPeriod: 0,
      depositedThisPeriod: 0,
      withdrawnThisPeriod: 0,
      netThisPeriod: 0,
      state: "normal",
      remaining: 0,
      nextPeriodStart: addDaysUTC(startOfWeekUTC(today), 7),
      message: "",
      canDepositToday: false,
      blockMessage: "Hoy no es día hábil. Descansa y ahorra el Lunes",
      inputDisabled: true,
      percentage: 0,
    };
  }

  if (plan.frequencyType === "CUSTOM_DAYS" && !isTodayInCustomDays(today, plan.customDays ?? [])) {
    return {
      periodStart: start,
      periodEnd: end,
      quotaForPeriod: 0,
      depositedThisPeriod: 0,
      withdrawnThisPeriod: 0,
      netThisPeriod: 0,
      state: "normal",
      remaining: 0,
      nextPeriodStart: nextStart,
      message: "",
      canDepositToday: false,
      blockMessage: "Hoy no es un día de ahorro seleccionado",
      inputDisabled: true,
      percentage: 0,
    };
  }

  const totalDeposited = entries.filter((e) => e.type === "deposit").reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawn = entries.filter((e) => e.type === "withdrawal").reduce((sum, e) => sum + e.amount, 0);
  const totalSaved = totalDeposited - totalWithdrawn;

  // Calcular períodos restantes desde HOY hasta endDate
  const remainingPeriods = countRemainingPeriods(
    plan.frequencyType,
    plan.endDate,
    plan.createdAt,
    plan.customDays ?? [],
  );

  // Proteger contra división por cero
  const safeRemainingPeriods = Math.max(1, remainingPeriods);

  // Cuota del período actual = (meta - ahorrado) / períodos restantes
  const remainingGoal = Math.max(0, plan.goalAmount - totalSaved);
  const rawQuota = remainingGoal / safeRemainingPeriods;
  const quotaForPeriod = Math.ceil(rawQuota / 1000) * 1000;

  // Calcular NETO del período (depósitos - retiros del período)
  const periodEntries = entries.filter((e) => e.date >= start && e.date <= end);
  const depositedThisPeriod = periodEntries.filter((e) => e.type === "deposit").reduce((sum, e) => sum + e.amount, 0);
  const withdrawnThisPeriod = periodEntries
    .filter((e) => e.type === "withdrawal")
    .reduce((sum, e) => sum + e.amount, 0);
  const netThisPeriod = depositedThisPeriod - withdrawnThisPeriod;

  const remaining = Math.max(0, quotaForPeriod - netThisPeriod);
  // percentage of this period
  const percentage = Math.min(100, Math.round((netThisPeriod / quotaForPeriod) * 100));

  let state: ButtonState;
  let message: string;
  let inputDisabled: boolean;

  if (remainingGoal <= 0) {
    state = "completed";
    message = "¡Meta alcanzada!";
    inputDisabled = true;
  } else if (netThisPeriod >= quotaForPeriod) {
    state = "completed";
    message = "Cuota cumplida este período";
    inputDisabled = true;
  } else if (netThisPeriod > 0) {
    state = "partial";
    message = `Completar Cuota (faltan ${formatAmount(remaining)})`;
    inputDisabled = true;
  } else {
    state = "normal";
    message = `Ahorrar ${formatAmount(quotaForPeriod)}`;
    inputDisabled = false;
  }

  return {
    periodStart: start,
    periodEnd: end,
    quotaForPeriod,
    depositedThisPeriod,
    withdrawnThisPeriod,
    netThisPeriod,
    state,
    remaining,
    nextPeriodStart: nextStart,
    message,
    canDepositToday: true,
    inputDisabled,
    percentage,
  };
}

export function getTotalProgress(plan: Plan, entries: Entry[]): TotalProgress {
  const totalDeposited = entries.filter((e) => e.type === "deposit").reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawn = entries.filter((e) => e.type === "withdrawal").reduce((sum, e) => sum + e.amount, 0);

  // const netSaved = totalDeposited - totalWithdrawn;
  // Max.. por si es negativo
  const netSaved = Math.max(0, totalDeposited - totalWithdrawn);

  if (!plan.goalAmount || plan.goalAmount <= 0) {
    return {
      totalDeposited,
      totalWithdrawn,
      netSaved,
      percentage: 0,
      remainingToGoal: 0,
      isCompleted: false,
    };
  }

  // .round redonde hacia arriba.. aun 37.5 dara 38.. Math.floor().. redondea hacia abajo.
  const percentage = Math.min(100, Math.round((netSaved / plan.goalAmount) * 100));
  const remainingToGoal = Math.max(0, plan.goalAmount - netSaved);
  const isCompleted = netSaved >= plan.goalAmount;

  return {
    totalDeposited,
    totalWithdrawn,
    netSaved,
    percentage,
    remainingToGoal,
    isCompleted,
  };
}

/** Botones rapidos */
export function getSmartSuggestions(entries: Entry[], limit: number = 3): SmartSuggestion[] {
  const deposits = entries.filter((e) => e.type === "deposit");
  if (deposits.length === 0) return [];

  const freq = new Map<number, number>();
  for (const e of deposits) {
    freq.set(e.amount, (freq.get(e.amount) || 0) + 1);
  }

  return Array.from(freq.entries())
    .map(([amount, count]) => ({ amount, count }))
    .sort((a, b) => b.count - a.count || b.amount - a.amount)
    .slice(0, limit);
}

/** Último depósito realizado */
export function getLastDepositAmount(entries: Entry[]): number | null {
  const deposits = entries.filter((e) => e.type === "deposit").sort((a, b) => b.date.localeCompare(a.date));
  return deposits.length > 0 ? deposits[0].amount : null;
}

/** Calendario */
export function getCalendarMonthData(entries: Entry[], year: number, month: number): CalendarDay[] {
  // const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
  const daysInMonth = getDaysInMonth(firstDay);
  const prefix = `${year}-${String(month).padStart(2, "0")}`;

  const depositsByDay = new Map<number, number>();
  const withdrawalsByDay = new Map<number, number>();

  for (const entry of entries) {
    if (entry.type === "withdrawal") {
      if (!entry.date.startsWith(prefix)) continue;
      const day = parseInt(entry.date.split("-")[2], 10);
      withdrawalsByDay.set(day, (withdrawalsByDay.get(day) || 0) + entry.amount);
      continue;
    }

    if (!entry.date.startsWith(prefix)) continue;
    const day = parseInt(entry.date.split("-")[2], 10);
    depositsByDay.set(day, (depositsByDay.get(day) || 0) + entry.amount);
  }

  const maxAmount = Math.max(...Array.from(depositsByDay.values()), 1);

  const result: CalendarDay[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const amount = depositsByDay.get(day) || 0;
    const withdrawal = withdrawalsByDay.get(day) || 0;
    result.push({
      day,
      amount,
      withdrawal,
      hasDeposit: amount > 0,
      intensity: amount > 0 ? Math.min(1, amount / maxAmount) : 0,
    });
  }
  return result;
}

/**
 * HISTORIAL
 */

export interface FormattedEntry {
  id: string;
  date: ISODate;
  displayDate: string;
  amount: number;
  type: PlanEntryType;
  reason?: string | null;
  isRecent: boolean;
}
/** Formato de entradas del historial */
export function formatEntries(entries: Entry[], today: ISODate = todayUTC()): FormattedEntry[] {
  return entries
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
    .map((entry) => ({
      id: entry.id,
      date: entry.date,
      displayDate: formatDate(entry.date),
      amount: entry.amount,
      type: entry.type,
      reason: entry.reason,
      // isRecent: diffInDaysUTC(entry.date, today) >= 0 && diffInDaysUTC(entry.date, today) <= 7,
      // isRecent solo para fechas pasadas (no futuras), máximo 7 días atrás
      isRecent: entry.date <= today && diffInDaysUTC(entry.date, today) >= 0 && diffInDaysUTC(entry.date, today) <= 7,
    }));
}

/** Impacto del retiro de fondos */
export function getWithdrawalImpact(
  plan: Plan,
  entries: Entry[],
  withdrawalAmount: number,
): { newPercentage: number; daysDelayed: number; message: string } {
  const progress = getTotalProgress(plan, entries);
  const newNet = Math.max(0, progress.netSaved - withdrawalAmount);

  let newPercentage = 0;
  let daysDelayed = 0;

  if (plan.goalAmount && plan.goalAmount > 0 && plan.endDate) {
    newPercentage = Math.min(100, Math.round((newNet / plan.goalAmount) * 100));

    const remainingPeriods = countRemainingPeriods(
      plan.frequencyType,
      plan.endDate,
      plan.createdAt,
      plan.customDays ?? [],
    );

    // Proteger contra división por cero
    if (remainingPeriods > 0) {
      const currentQuota = Math.max(1, Math.ceil((plan.goalAmount - progress.netSaved) / remainingPeriods));
      const periodsLost = Math.ceil(withdrawalAmount / currentQuota);

      const daysPerPeriod: Record<string, number> = {
        DAILY: 1,
        WEEKDAYS: 7,
        WEEKLY: 7,
        BIWEEKLY: 14,
        MONTHLY: 30,
        CUSTOM_DAYS: 7,
      };
      daysDelayed = periodsLost * (daysPerPeriod[plan.frequencyType] || 7);
    }
  }

  const message =
    daysDelayed > 0
      ? `Si retiras ${formatAmount(withdrawalAmount)}, tu fecha meta se retrasará aproximadamente ${daysDelayed} días.`
      : `Si retiras ${formatAmount(withdrawalAmount)}, tu progreso bajará.`;

  return { newPercentage, daysDelayed, message };
}
