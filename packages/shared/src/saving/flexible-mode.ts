import type { Entry, ISODate } from "../types";
import { diffInDaysUTC } from "../utils/date-helpers";

export interface PiggyBankSummary {
  totalSaved: number;
  totalDays: number;
  longestStreak: number;
  totalDeposits: number;
  totalWithdrawals: number;
  averageDeposit: number;
  biggestDeposit: number;
  firstDepositDate: ISODate | null;
  lastDepositDate: ISODate | null;
  emotionalMessage: string;
}

/**
 * Calcula el resumen emocional al "romper la alcancía".
 */
export function getPiggyBankSummary(entries: Entry[]): PiggyBankSummary {
  const deposits = entries.filter((e) => e.type === "deposit");
  const withdrawals = entries.filter((e) => e.type === "withdrawal");

  const totalSaved = deposits.reduce((sum, e) => sum + e.amount, 0) - withdrawals.reduce((sum, e) => sum + e.amount, 0);
  const depositDays = [...new Set(deposits.map((e) => e.date))].sort();
  const totalDays = depositDays.length > 0 ? diffInDaysUTC(depositDays[0], depositDays[depositDays.length - 1]) + 1 : 0;

  // Longest streak
  let longestStreak = 0;
  let current = 0;
  for (let i = 0; i < depositDays.length; i++) {
    if (i === 0 || diffInDaysUTC(depositDays[i - 1], depositDays[i]) === 1) {
      current++;
      longestStreak = Math.max(longestStreak, current);
    } else {
      current = 1;
    }
  }

  const amounts = deposits.map((e) => e.amount);
  const averageDeposit = amounts.length > 0 ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) : 0;

  const biggestDeposit = amounts.length > 0 ? Math.max(...amounts) : 0;

  const firstDepositDate = depositDays.length > 0 ? depositDays[0] : null;
  const lastDepositDate = depositDays.length > 0 ? depositDays[depositDays.length - 1] : null;

  // Mensaje emocional
  const emotionalMessage = generateEmotionalMessage({
    totalSaved,
    totalDays,
    longestStreak,
    totalDeposits: deposits.length,
  });

  return {
    totalSaved,
    totalDays,
    longestStreak,
    totalDeposits: deposits.length,
    totalWithdrawals: withdrawals.length,
    averageDeposit,
    biggestDeposit,
    firstDepositDate,
    lastDepositDate,
    emotionalMessage,
  };
}

function generateEmotionalMessage(stats: {
  totalSaved: number;
  totalDays: number;
  longestStreak: number;
  totalDeposits: number;
}): string {
  const { totalSaved, totalDays, longestStreak, totalDeposits } = stats;

  if (totalSaved === 0) {
    return "Aún no hay depósitos. ¡La próxima vez será!";
  }

  if (longestStreak >= 30) {
    return `¡Increíble! Ahorraste durante ${totalDays} días y tu racha más larga fue de ${longestStreak} días seguidos. Eres una leyenda del ahorro.`;
  }

  if (longestStreak >= 7) {
    return `¡Muy bien! Ahorraste durante ${totalDays} días y mantuviste una racha de ${longestStreak} días seguidos. ¡Esa constancia vale oro!`;
  }

  if (totalDeposits >= 10) {
    return `¡Buen trabajo! Hiciste ${totalDeposits} depósitos en ${totalDays} días. Cada pequeño paso cuenta.`;
  }

  if (totalSaved > 0) {
    return `¡Empezaste! Ahorraste $${totalSaved.toLocaleString("es-CL")} en ${totalDays} días. El primer paso es el más importante. `;
  }

  return "Gracias por usar Savemony. ¡Vuelve pronto!";
}

/**
 * Genera datos para un gráfico simple de evolución del ahorro.
 * Devuelve puntos acumulados por día.
 */
export interface SavingsEvolutionPoint {
  date: ISODate;
  accumulated: number;
}

export function getSavingsEvolution(entries: Entry[]): SavingsEvolutionPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const dailyMap = new Map<ISODate, number>();

  for (const e of sorted) {
    const delta = e.type === "deposit" ? e.amount : -e.amount;
    dailyMap.set(e.date, (dailyMap.get(e.date) || 0) + delta);
  }

  const dates = Array.from(dailyMap.keys()).sort();
  let accumulated = 0;
  return dates.map((date) => {
    accumulated += dailyMap.get(date) ?? 0;
    return { date, accumulated };
  });
}
