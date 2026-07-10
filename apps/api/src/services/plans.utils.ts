import type { AmountMode, RebalanceMode, SavingsMethod } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GenerateGridOptions {
  method: SavingsMethod;
  target: number;
  rows: number;
  cols: number;
  minAmount?: number;
  maxAmount?: number;
  preferredAmounts?: number[];
  roundingMultiple?: number;
  amountMode?: AmountMode;
}

export interface RebalanceOptions {
  cells: { id: string; amount: number; status: string; isLocked: boolean | number }[];
  totalTarget: number;
  mode: RebalanceMode;
  minAmount?: number;
  maxAmount?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeToTarget(amounts: number[], target: number): number[] {
  const result = [...amounts];
  const sum = result.reduce((a, b) => a + b, 0);
  const diff = target - sum;

  if (diff !== 0 && result.length > 0) {
    result[result.length - 1] += diff;

    if (result[result.length - 1] < 1) {
      const base = Math.floor(target / result.length);
      const rem = target - base * result.length;
      return Array.from({ length: result.length }, (_, i) => base + (i < rem ? 1 : 0));
    }
  }
  return result;
}

// ─── Generators ──────────────────────────────────────────────────────────────

function generateRandomGrid(target: number, total: number, min: number, max: number) {
  if (total <= 0) return [];
  const amounts: number[] = [];
  let remaining = target;

  for (let i = 0; i < total; i++) {
    const isLast = i === total - 1;
    if (isLast) {
      amounts.push(Math.max(min || 1, Math.round(remaining)));
      break;
    }

    const cellsLeft = total - i;
    const avg = remaining / cellsLeft;
    const effectiveMin = Math.max(min || 1, Math.floor(avg * 0.2));
    const minReserve = (cellsLeft - 1) * (min || 1);
    const effectiveMax =
      max > 0 ? Math.min(max, remaining - minReserve) : Math.min(Math.floor(avg * 2.5), remaining - minReserve);

    const amount =
      effectiveMax >= effectiveMin
        ? Math.floor(Math.random() * (effectiveMax - effectiveMin + 1)) + effectiveMin
        : effectiveMin;

    amounts.push(amount);
    remaining -= amount;
  }

  return shuffle(normalizeToTarget(amounts, target));
}

function generateCustomGrid(
  target: number,
  total: number,
  min: number,
  max: number,
  preferredAmounts?: number[],
): number[] {
  if (!preferredAmounts || preferredAmounts.length === 0) {
    return generateRandomGrid(target, total, min, max);
  }

  const clean = [...new Set(preferredAmounts)].sort((a, b) => a - b);

  const amounts: number[] = [];
  let remaining = target;

  for (let i = 0; i < total; i++) {
    const isLast = i === total - 1;
    if (isLast) {
      let last = Math.max(min || 1, remaining);
      if (max > 0) last = Math.min(last, max);

      if (!clean.includes(last)) {
        const candidates = clean.filter((p) => {
          const diff = p - last;
          return amounts.some((prev) => {
            const swapped = prev - diff;
            return (min === 0 || swapped >= min) && (max === 0 || swapped <= max) && swapped >= 1;
          });
        });
        if (candidates.length > 0) {
          const pick = candidates.reduce((prev, curr) => (Math.abs(curr - last) < Math.abs(prev - last) ? curr : prev));
          const diff = pick - last;
          for (let j = 0; j < amounts.length; j++) {
            const swapped = amounts[j] - diff;
            if ((min === 0 || swapped >= min) && (max === 0 || swapped <= max) && swapped >= 1) {
              amounts[j] = swapped;
              last = pick;
              break;
            }
          }
        }
      }
      amounts.push(last);
      break;
    }

    const cellsLeft = total - i;
    const minReserve = (cellsLeft - 1) * (min || 1);

    const valid = clean.filter((p) => p <= remaining - minReserve);
    let amount: number;
    if (valid.length > 0) {
      amount = valid[Math.floor(Math.random() * valid.length)];
    } else {
      amount = Math.min(remaining - minReserve, clean[clean.length - 1]);
      amount = Math.max(min || 1, amount);
    }

    if (max > 0) amount = Math.min(amount, max);
    amounts.push(amount);
    remaining -= amount;
  }

  return shuffle(normalizeToTarget(amounts, target));
}

function generateClassicPattern(
  target: number,
  total: number,
  classicCount: number,
  patternFn: (i: number) => number,
): number[] {
  if (total === classicCount) {
    const classicSum = Array.from({ length: classicCount }, (_, i) => patternFn(i)).reduce((a, b) => a + b, 0);
    const scale = target / classicSum;
    const amounts = Array.from({ length: classicCount }, (_, i) => Math.max(1, Math.round(patternFn(i) * scale)));
    return shuffle(normalizeToTarget(amounts, target));
  }

  const amounts = Array.from({ length: total }, (_, i) => {
    const progress = (i + 1) / total;
    return Math.max(1, Math.floor((target / total) * (0.5 + progress)));
  });
  return shuffle(normalizeToTarget(amounts, target));
}

function generate52Weeks(target: number, total: number): number[] {
  return generateClassicPattern(target, total, 52, (i) => i + 1);
}

function generate100Envelopes(target: number, total: number): number[] {
  return generateClassicPattern(target, total, 100, (i) => i + 1);
}

function generate3Months(target: number, total: number): number[] {
  if (total === 90) {
    const days = [1, 2, 3, 4, 5];
    const weeks = Math.ceil(total / 5);
    const classicTotal = 15 * weeks;
    const scale = target / classicTotal;
    const amounts = Array.from({ length: total }, (_, i) => Math.max(1, Math.round(days[i % 5] * scale)));
    return normalizeToTarget(amounts, target);
  }

  const amounts = Array.from({ length: total }, (_, i) => {
    const progress = (i + 1) / total;
    return Math.max(1, Math.floor((target / total) * (0.5 + progress)));
  });
  return shuffle(normalizeToTarget(amounts, target));
}

// function generateNoSpend(target: number, total: number): number[] {
//   const base = Math.floor(target / total);
//   const amounts = Array.from({ length: total }, () => Math.max(1, base + Math.floor(Math.random() * base * 0.3)));
//   return shuffle(normalizeToTarget(amounts, target));
// }

function generateRounding(target: number, total: number, min: number, max: number, roundingMultiple: number): number[] {
  if (roundingMultiple <= 1 || total <= 0) {
    return generateRandomGrid(target, total, min, max);
  }

  // Generar base aleatoria
  let amounts = generateRandomGrid(target, total, min, max);

  // Redondear cada uno al múltiplo más cercano
  amounts = amounts.map((a) => {
    const down = Math.floor(a / roundingMultiple) * roundingMultiple;
    const up = Math.ceil(a / roundingMultiple) * roundingMultiple;
    const closest = a - down < up - a ? down : up;
    return Math.max(closest, roundingMultiple);
  });

  // Ajustar diferencia sumando/restando múltiplos
  const currentSum = amounts.reduce((s, a) => s + a, 0);
  let diff = target - currentSum;
  let safety = 0;

  while (diff !== 0 && safety < 1000) {
    const idx = Math.floor(Math.random() * total);
    const current = amounts[idx];

    if (diff > 0) {
      const newVal = current + roundingMultiple;
      const maxLimit = max > 0 ? max : Infinity;
      if (newVal <= maxLimit) {
        amounts[idx] = newVal;
        diff -= roundingMultiple;
      }
    } else {
      const newVal = current - roundingMultiple;
      const minLimit = min > 0 ? min : roundingMultiple;
      if (newVal >= minLimit) {
        amounts[idx] = newVal;
        diff += roundingMultiple;
      }
    }
    safety++;
    if (Math.abs(diff) < roundingMultiple) break;
  }

  // Último recurso: normalizeToTarget puede romper múltiplos
  // Pero si diff < roundingMultiple, no podemos ajustar más sin romper
  // En ese caso, dejamos que normalizeToTarget arregle la suma
  // y aceptamos que UNA celda puede no ser múltiplo exacto
  return normalizeToTarget(amounts, target);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function generateGrid(options: GenerateGridOptions): number[] {
  const {
    method,
    target,
    rows,
    cols,
    minAmount = 0,
    maxAmount = 0,
    preferredAmounts = [],
    roundingMultiple = 1,
    amountMode = "range",
  } = options;

  // console.log({ options });

  const totalCells = rows * cols;

  if (target <= 0) throw new Error("Target amount must be > 0");
  if (totalCells <= 0) throw new Error("Grid must have at least 1 cell");

  // Métodos clásicos: montos fijos
  switch (method) {
    case "52_weeks":
      return generate52Weeks(target, totalCells);
    case "100_envelopes":
      return generate100Envelopes(target, totalCells);
    case "3_months":
      return generate3Months(target, totalCells);
  }

  // Métodos variables: custom_grid y no_spend usan amountMode
  if (method === "custom_grid" || method === "no_spend") {
    if (amountMode === "rounding" && roundingMultiple > 1) {
      return generateRounding(target, totalCells, minAmount, maxAmount, roundingMultiple);
    }
    if (amountMode === "preferred" && preferredAmounts.length > 0) {
      return generateCustomGrid(target, totalCells, minAmount, maxAmount, preferredAmounts);
    }
    return generateRandomGrid(target, totalCells, minAmount, maxAmount);
  }

  return generateRandomGrid(target, totalCells, minAmount, maxAmount);

  // switch (method) {
  //   case "custom_grid":
  //     return generateCustomGrid(target, totalCells, minAmount, maxAmount, preferredAmounts);
  //   case "52_weeks":
  //     return generate52Weeks(target, totalCells);
  //   case "100_envelopes":
  //     return generate100Envelopes(target, totalCells);
  //   case "3_months":
  //     return generate3Months(target, totalCells);
  //   case "no_spend":
  //     // return generateNoSpend(target, totalCells);

  //     // no_spend usa amountMode igual que custom_grid
  //     if (amountMode === "rounding" && roundingMultiple > 1) {
  //       return generateRounding(target, totalCells, minAmount, maxAmount, roundingMultiple);
  //     }
  //     if (amountMode === "preferred" && preferredAmounts.length > 0) {
  //       return generateCustomGrid(target, totalCells, minAmount, maxAmount, preferredAmounts);
  //     }
  //     return generateRandomGrid(target, totalCells, minAmount, maxAmount);

  //   // case "rounding":
  //   //   // return generateRounding(target, totalCells, minAmount, maxAmount, roundingMultiple);
  //   //   if (amountMode === "rounding" && roundingMultiple > 1) {
  //   //     return generateRounding(target, totalCells, minAmount, maxAmount, roundingMultiple);
  //   //   }
  //   //   if (amountMode === "preferred" && preferredAmounts.length > 0) {
  //   //     return generateCustomGrid(target, totalCells, minAmount, maxAmount, preferredAmounts);
  //   //   }
  //   //   return generateRandomGrid(target, totalCells, minAmount, maxAmount);
  //   default:
  //     return generateCustomGrid(target, totalCells, minAmount, maxAmount, preferredAmounts);
  // }
}

// ─── Rebalancing ─────────────────────────────────────────────────────────────

export function rebalanceCells(options: RebalanceOptions): { id: string; amount: number }[] {
  const { cells, totalTarget, mode, minAmount = 0, maxAmount = 0 } = options;

  const normalized = cells.map((c) => ({
    id: c.id,
    amount: c.amount,
    status: c.status,
    isLocked: Boolean(c.isLocked),
  }));

  const pending = normalized.filter((c) => c.status === "pending" && !c.isLocked);
  const lockedSum = normalized
    .filter((c) => c.isLocked || c.status === "completed")
    .reduce((sum, c) => sum + c.amount, 0);

  const remaining = totalTarget - lockedSum;
  const safeRemaining = Math.max(remaining, pending.length);
  const base = pending.length > 0 ? safeRemaining / pending.length : 0;

  const effectiveMin = Math.max(minAmount || 1, 1);
  const rawMax = maxAmount > 0 ? maxAmount : Math.max(effectiveMin + 1, Math.floor(base * 1.5));
  const minRequiredMax = pending.length > 0 ? Math.ceil(safeRemaining / pending.length) : rawMax;
  const effectiveMax = Math.max(rawMax, minRequiredMax);

  if (pending.length === 0) {
    return normalized.map((c) => ({ id: c.id, amount: c.amount }));
  }

  if (mode === "proportional") {
    return rebalanceProportional(normalized, pending, safeRemaining, effectiveMin, effectiveMax);
  } else {
    return rebalanceRandom(normalized, pending, safeRemaining, effectiveMin, effectiveMax);
  }
}

function rebalanceProportional(
  all: Array<{ id: string; amount: number; status: string; isLocked: boolean }>,
  pending: Array<{ id: string; amount: number; status: string; isLocked: boolean }>,
  safeRemaining: number,
  effectiveMin: number,
  effectiveMax: number,
): { id: string; amount: number }[] {
  const result = all.map((c) => ({ id: c.id, amount: c.amount }));
  if (pending.length === 0) return result;

  const originalTotal = pending.reduce((s, p) => s + p.amount, 0) || 1;
  let assignedSum = 0;

  for (let i = 0; i < pending.length; i++) {
    const p = pending[i];
    const idx = result.findIndex((r) => r.id === p.id);
    const proportion = p.amount / originalTotal;
    const rawAmount = safeRemaining * proportion;

    let amount: number;
    if (i < pending.length - 1) {
      amount = Math.max(effectiveMin, Math.min(effectiveMax, Math.round(rawAmount)));
      result[idx].amount = amount;
      assignedSum += amount;
    } else {
      amount = safeRemaining - assignedSum;
      result[idx].amount = Math.max(effectiveMin, Math.min(effectiveMax, amount));
    }
  }

  return result;
}

function rebalanceRandom(
  all: Array<{ id: string; amount: number; status: string; isLocked: boolean }>,
  pending: Array<{ id: string; amount: number; status: string; isLocked: boolean }>,
  safeRemaining: number,
  effectiveMin: number,
  effectiveMax: number,
): { id: string; amount: number }[] {
  const result = all.map((c) => ({ id: c.id, amount: c.amount }));
  if (pending.length === 0) return result;

  let pool = safeRemaining;
  const shuffled = [...pending].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i++) {
    const cell = shuffled[i];
    const idx = result.findIndex((r) => r.id === cell.id);
    const isLast = i === shuffled.length - 1;

    if (isLast) {
      result[idx].amount = Math.max(effectiveMin, pool);
      break;
    }

    const cellsLeft = shuffled.length - i;
    const minReserve = (cellsLeft - 1) * effectiveMin;
    const avg = pool / cellsLeft;
    const variance = avg * 0.3;

    const minRandom = Math.max(effectiveMin, Math.floor(avg - variance));
    const maxRandom = Math.min(effectiveMax, Math.ceil(avg + variance), pool - minReserve);

    let amount: number;
    if (maxRandom <= minRandom) {
      amount = minRandom;
    } else {
      amount = Math.floor(Math.random() * (maxRandom - minRandom + 1)) + minRandom;
    }

    result[idx].amount = amount;
    pool -= amount;
  }

  return result;
}
