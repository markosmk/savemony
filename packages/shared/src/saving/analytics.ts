import {
  addDaysUTC as addDays,
  diffInDaysUTC as diffInDays,
  getDayOfWeekUTC,
  startOfMonthUTC as getMonthStart,
  startOfWeekUTC as getWeekStart,
  subtractMonthsUTC,
  todayUTC,
} from "../utils/date-helpers-impl";
import type { Entry, ISODate } from "./types";

export interface WeeklyTrend {
  weekLabel: string;
  deposits: number;
  withdrawals: number;
  net: number;
}

export interface MonthlyTrend {
  monthLabel: string;
  deposits: number;
  withdrawals: number;
  net: number;
}

export interface DayOfWeekStats {
  day: string; // 'Lunes', 'Martes', etc.
  dayIndex: number; // 0-6
  totalDeposited: number;
  count: number;
  average: number;
}

export interface SavingsVelocity {
  averagePerDay: number;
  averagePerWeek: number;
  averagePerMonth: number;
  projectedCompletionDate: ISODate | null; // null si no hay meta o no hay datos
  daysToGoal: number | null;
  onTrack: boolean; // true si la velocidad actual alcanzará la meta a tiempo
}

export interface ComparisonPeriod {
  label: string;
  total: number;
  changePercent: number; // vs período anterior
}

/**
 * Obtiene tendencias semanales
 * @param entries - Entradas de ahorro
 * @param weeks - Número de semanas a mostrar
 */
export function getWeeklyTrends(entries: Entry[], weeks: number = 8): WeeklyTrend[] {
  const deposits = entries.filter((e) => e.type === "deposit");
  const withdrawals = entries.filter((e) => e.type === "withdrawal");

  // Agrupar por semana
  const weekMap = new Map<string, { deposits: number; withdrawals: number }>();

  for (const e of deposits) {
    const ws = getWeekStart(e.date);
    const current = weekMap.get(ws) || { deposits: 0, withdrawals: 0 };
    current.deposits += e.amount;
    weekMap.set(ws, current);
  }

  for (const e of withdrawals) {
    const ws = getWeekStart(e.date);
    const current = weekMap.get(ws) || { deposits: 0, withdrawals: 0 };
    current.withdrawals += e.amount;
    weekMap.set(ws, current);
  }

  const sortedWeeks = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-weeks);

  return sortedWeeks.map(([weekStart, data]) => {
    const [_y, m, d] = weekStart.split("-").map(Number);
    const label = `Sem ${d}/${m}`;

    return {
      weekLabel: label,
      deposits: data.deposits,
      withdrawals: data.withdrawals,
      net: data.deposits - data.withdrawals,
    };
  });
}

/**
 * Obtiene tendencias mensuales
 * @param entries - Entradas de ahorro
 * @param months - Número de meses a mostrar
 */
export function getMonthlyTrends(entries: Entry[], months: number = 6): MonthlyTrend[] {
  const deposits = entries.filter((e) => e.type === "deposit");
  const withdrawals = entries.filter((e) => e.type === "withdrawal");

  const monthMap = new Map<string, { deposits: number; withdrawals: number }>();

  for (const e of deposits) {
    const ms = getMonthStart(e.date);
    const current = monthMap.get(ms) || { deposits: 0, withdrawals: 0 };
    current.deposits += e.amount;
    monthMap.set(ms, current);
  }

  for (const e of withdrawals) {
    const ms = getMonthStart(e.date);
    const current = monthMap.get(ms) || { deposits: 0, withdrawals: 0 };
    current.withdrawals += e.amount;
    monthMap.set(ms, current);
  }

  const sortedMonths = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-months);

  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  return sortedMonths.map(([monthStart, data]) => {
    const [y, m, _d] = monthStart.split("-").map(Number);
    const label = `${monthNames[m - 1]} ${y}`;
    return {
      monthLabel: label,
      deposits: data.deposits,
      withdrawals: data.withdrawals,
      net: data.deposits - data.withdrawals,
    };
  });
}

/**
 * Obtiene estadísticas por día de la semana
 * Mejor día para ahorrar
 * @param entries - Entradas de ahorro
 */
export function getDayOfWeekStats(entries: Entry[]): DayOfWeekStats[] {
  const deposits = entries.filter((e) => e.type === "deposit");
  const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

  const stats = Array.from({ length: 7 }, (_, i) => ({
    day: dayNames[i],
    dayIndex: i,
    totalDeposited: 0,
    count: 0,
    average: 0,
  }));

  for (const e of deposits) {
    const dow = getDayOfWeekUTC(e.date);
    stats[dow].totalDeposited += e.amount;
    stats[dow].count++;
  }

  for (const s of stats) {
    s.average = s.count > 0 ? Math.round(s.totalDeposited / s.count) : 0;
  }

  return stats.sort((a, b) => b.totalDeposited - a.totalDeposited);
}

/**
 * Calcula la velocidad de ahorro
 * @param entries - Entradas de ahorro
 * @param goalAmount - Meta de ahorro
 * @param endDate - Fecha fin
 * @param today - Fecha actual
 */
export function getSavingsVelocity(
  entries: Entry[],
  goalAmount: number | null,
  endDate: ISODate | null,
  today: ISODate = todayUTC(),
): SavingsVelocity {
  const deposits = entries.filter((e) => e.type === "deposit");

  if (deposits.length === 0) {
    return {
      averagePerDay: 0,
      averagePerWeek: 0,
      averagePerMonth: 0,
      projectedCompletionDate: null,
      daysToGoal: null,
      onTrack: false,
    };
  }

  const dates = deposits.map((e) => e.date).sort();
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const totalDays = Math.max(1, diffInDays(firstDate, lastDate) + 1);

  const totalDeposited = deposits.reduce((sum, e) => sum + e.amount, 0);
  const totalWithdrawn = entries.filter((e) => e.type === "withdrawal").reduce((sum, e) => sum + e.amount, 0);
  const netSaved = totalDeposited - totalWithdrawn;

  const avgPerDay = totalDeposited / totalDays;
  const avgPerWeek = avgPerDay * 7;
  const avgPerMonth = avgPerDay * 30;

  let projectedCompletionDate: ISODate | null = null;
  let daysToGoal: number | null = null;
  let onTrack = false;

  if (goalAmount && goalAmount > 0 && avgPerDay > 0) {
    const remaining = Math.max(0, goalAmount - netSaved);
    daysToGoal = Math.ceil(remaining / avgPerDay);
    projectedCompletionDate = addDays(today, daysToGoal);

    if (endDate) {
      const daysUntilDeadline = diffInDays(today, endDate);
      onTrack = daysToGoal <= daysUntilDeadline;
    }
  }

  return {
    averagePerDay: Math.round(avgPerDay),
    averagePerWeek: Math.round(avgPerWeek),
    averagePerMonth: Math.round(avgPerMonth),
    projectedCompletionDate,
    daysToGoal,
    onTrack,
  };
}

/**
 * Calcula comparaciones entre períodos
 * @param entries - Entradas de ahorro
 */
export function getPeriodComparisons(entries: Entry[]): {
  thisWeek: ComparisonPeriod;
  lastWeek: ComparisonPeriod;
  thisMonth: ComparisonPeriod;
  lastMonth: ComparisonPeriod;
} {
  const todayISO = todayUTC();

  // Esta semana (últimos 7 días)
  const thisWeekStart = addDays(todayISO, -6);
  const lastWeekStart = addDays(todayISO, -13);
  const lastWeekEnd = addDays(todayISO, -7);

  const thisWeekTotal = entries
    .filter((e) => e.type === "deposit" && e.date >= thisWeekStart && e.date <= todayISO)
    .reduce((sum, e) => sum + e.amount, 0);

  const lastWeekTotal = entries
    .filter((e) => e.type === "deposit" && e.date >= lastWeekStart && e.date <= lastWeekEnd)
    .reduce((sum, e) => sum + e.amount, 0);

  // Este mes
  const thisMonthStart = getMonthStart(todayISO);
  const lastMonthStart = subtractMonthsUTC(thisMonthStart, 1);
  const lastMonthEnd = getMonthStart(todayISO);

  const thisMonthTotal = entries
    .filter((e) => e.type === "deposit" && e.date >= thisMonthStart && e.date <= todayISO)
    .reduce((sum, e) => sum + e.amount, 0);

  const lastMonthTotal = entries
    .filter((e) => e.type === "deposit" && e.date >= lastMonthStart && e.date < lastMonthEnd)
    .reduce((sum, e) => sum + e.amount, 0);

  const calcChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    thisWeek: { label: "Esta semana", total: thisWeekTotal, changePercent: calcChange(thisWeekTotal, lastWeekTotal) },
    lastWeek: { label: "Semana pasada", total: lastWeekTotal, changePercent: 0 },
    thisMonth: { label: "Este mes", total: thisMonthTotal, changePercent: calcChange(thisMonthTotal, lastMonthTotal) },
    lastMonth: { label: "Mes pasado", total: lastMonthTotal, changePercent: 0 },
  };
}
