import { addDaysUTC, diffInDaysUTC, getDaysInMonth, todayISO } from "../utils/date-helpers";
import type { Entry, ISODate } from "./types";

export interface StreakInfo {
  currentStreak: number; // días seguidos ahorrando (hoy inclusive)
  longestStreak: number; // máxima racha histórica
  totalStreakDays: number; // días totales con al menos un depósito
  lastDepositDate: ISODate | null;
  isStreakActive: boolean; // ¿ahorró hoy o ayer?
  streakAtRisk: boolean; // ¿no ha ahorrado hoy pero sí ayer?
  nextMilestone: number; // próximo objetivo (7, 30, 90, 365)
  daysToNextMilestone: number;
  badges: StreakBadge[];
}

export interface StreakBadge {
  id: string;
  name: string;
  icon: string;
  requiredDays: number;
  earned: boolean;
  earnedDate?: ISODate;
}

const BADGES: Omit<StreakBadge, "earned" | "earnedDate">[] = [
  { id: "week", name: "Semana de Fuego", icon: "🔥", requiredDays: 7 },
  { id: "month", name: "Ahorrador del Mes", icon: "📅", requiredDays: 30 },
  { id: "quarter", name: "Trimestre de Oro", icon: "🏆", requiredDays: 90 },
  { id: "year", name: "Leyenda del Ahorro", icon: "👑", requiredDays: 365 },
  { id: "biweek", name: "Quincena Perfecta", icon: "⭐", requiredDays: 14 },
  { id: "halfyear", name: "Medio Año", icon: "🥈", requiredDays: 180 },
];

/**
 * Obtiene el conjunto de días únicos con al menos un depósito,
 * ordenados ascendentemente.
 */
export function getDepositDays(entries: Entry[]): ISODate[] {
  const days = new Set<ISODate>();
  for (const e of entries) {
    if (e.type === "deposit" && e.amount > 0) {
      days.add(e.date);
    }
  }
  return Array.from(days).sort();
}

/**
 * Calcula la racha actual: días consecutivos desde el último depósito hacia atrás.
 * Si no hay depósito hoy ni ayer, la racha es 0.
 */
export function calculateCurrentStreak(depositDays: ISODate[], today: ISODate = todayISO()): number {
  if (depositDays.length === 0) return 0;

  const lastDay = depositDays[depositDays.length - 1];
  const daysSinceLastDeposit = diffInDaysUTC(lastDay, today);

  // Si el último depósito fue hace más de 1 día, la racha se rompió
  if (daysSinceLastDeposit > 1) return 0;

  // Contar hacia atrás desde el último día
  let streak = 1;
  let checkDate = lastDay;

  for (let i = depositDays.length - 2; i >= 0; i--) {
    const expectedPrev = addDaysUTC(checkDate, -1);
    if (depositDays[i] === expectedPrev) {
      streak++;
      checkDate = expectedPrev;
    } else if (depositDays[i] === checkDate) {
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calcula la racha más larga histórica.
 */
export function calculateLongestStreak(depositDays: ISODate[]): number {
  if (depositDays.length === 0) return 0;

  let maxStreak = 1;
  let current = 1;

  for (let i = 1; i < depositDays.length; i++) {
    const prev = depositDays[i - 1];
    const curr = depositDays[i];
    const diff = diffInDaysUTC(prev, curr);

    if (diff === 1) {
      current++;
      maxStreak = Math.max(maxStreak, current);
    } else if (diff === 0) {
    } else {
      current = 1;
    }
  }

  return maxStreak;
}

/**
 * Resumen completo de rachas e insignias.
 */
export function getStreakInfo(entries: Entry[], today: ISODate = todayISO()): StreakInfo {
  const depositDays = getDepositDays(entries);
  const currentStreak = calculateCurrentStreak(depositDays, today);
  const longestStreak = calculateLongestStreak(depositDays);
  const totalStreakDays = depositDays.length;
  const lastDepositDate = depositDays.length > 0 ? depositDays[depositDays.length - 1] : null;

  const isStreakActive = lastDepositDate === today;
  const streakAtRisk = !isStreakActive && lastDepositDate === addDaysUTC(today, -1);

  // Próximo milestone
  const milestones = [7, 30, 90, 365];
  const nextMilestone = milestones.find((m) => m > currentStreak) ?? milestones[milestones.length - 1];
  const daysToNextMilestone = nextMilestone - currentStreak;

  // Badges
  const badges: StreakBadge[] = BADGES.map((b) => ({
    ...b,
    earned: longestStreak >= b.requiredDays,
    earnedDate: longestStreak >= b.requiredDays ? depositDays[depositDays.length - 1] : undefined,
  }));

  return {
    currentStreak,
    longestStreak,
    totalStreakDays,
    lastDepositDate,
    isStreakActive,
    streakAtRisk,
    nextMilestone,
    daysToNextMilestone,
    badges,
  };
}

/**
 * Para el calendario: devuelve un mapa de día -> si pertenece a una racha activa.
 * Útil para pintar bordes o highlights en el calendario.
 */
export function getStreakDaysInMonth(
  entries: Entry[],
  year: number,
  month: number, // 1-12
  today: ISODate = todayISO(),
): Map<number, { inStreak: boolean; isToday: boolean }> {
  const depositDays = getDepositDays(entries);
  const result = new Map<number, { inStreak: boolean; isToday: boolean }>();
  const currentStreak = calculateCurrentStreak(depositDays, today);

  if (currentStreak === 0) return result;

  // Los días de la racha actual van desde (today - currentStreak + 1) hasta today
  const streakStart = addDaysUTC(today, -(currentStreak - 1));
  const prefix = `${year}-${String(month).padStart(2, "0")}`;

  const daysInMonth = getDaysInMonth(`${prefix}-01`); // first day
  // const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${prefix}-${String(day).padStart(2, "0")}`;
    const inStreak = iso >= streakStart && iso <= today;
    result.set(day, { inStreak, isToday: iso === today });
  }

  return result;
}
