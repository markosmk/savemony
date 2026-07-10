import type { PlanFrequency, SavingsMethod } from "@/types/app";

// Grid generation algorithms
export function generateGrid(
  method: SavingsMethod,
  targetAmount: number,
  rows: number,
  cols: number,
  minAmount: number = 0,
  maxAmount: number = 0,
  frequency: PlanFrequency = "daily",
): number[] {
  const totalCells = rows * cols;
  const baseAmount = Math.floor(targetAmount / totalCells);

  switch (method) {
    case "custom_grid":
      return generateCustomGrid(targetAmount, totalCells, baseAmount, minAmount, maxAmount);
    case "52_weeks":
      return generate52Weeks(targetAmount, totalCells);
    case "100_envelopes":
      return generate100Envelopes(targetAmount, totalCells);
    // case "365_days":
    // 	return generate365Days(targetAmount, totalCells);
    case "no_spend":
      return generateNoSpend(targetAmount, totalCells, frequency);
    default:
      return generateCustomGrid(targetAmount, totalCells, baseAmount, minAmount, maxAmount);
  }
}

function generateCustomGrid(target: number, total: number, base: number, min: number, max: number): number[] {
  const amounts: number[] = [];
  let remaining = target;

  // Generate varied amounts around the base
  for (let i = 0; i < total - 1; i++) {
    const isLastBatch = i >= total - 3;
    let amount: number;

    if (isLastBatch) {
      // Ensure last few cells absorb the remainder
      amount = Math.max(min || 1, Math.floor(base * 0.8));
    } else {
      // Add some randomness
      const variance = base * 0.5;
      amount = Math.max(
        min || 1,
        Math.min(max || base * 3, base + Math.floor(Math.random() * variance * 2 - variance)),
      );
    }
    amounts.push(amount);
    remaining -= amount;
  }

  // Last cell gets the remainder
  amounts.push(Math.max(min || 1, remaining));

  // Adjust to ensure exact total
  const currentTotal = amounts.reduce((a, b) => a + b, 0);
  if (currentTotal !== target) {
    const diff = target - currentTotal;
    amounts[amounts.length - 1] += diff;
  }

  // Shuffle
  for (let i = amounts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [amounts[i], amounts[j]] = [amounts[j], amounts[i]];
  }

  return amounts;
}

function generate52Weeks(target: number, total: number): number[] {
  // Classic: week 1 = $1, week 2 = $2, etc. Scale to target
  const classicTotal = (52 * 53) / 2; // 1378
  const scale = target / classicTotal;
  return Array.from({ length: Math.min(total, 52) }, (_, i) => Math.round((i + 1) * scale));
}

function generate100Envelopes(target: number, total: number): number[] {
  // Classic: numbers 1-100. Scale to target.
  const classicTotal = (100 * 101) / 2; // 5050
  const scale = target / classicTotal;
  const envelopes = Array.from({ length: Math.min(total, 100) }, (_, i) => Math.round((i + 1) * scale));
  // Shuffle
  for (let i = envelopes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [envelopes[i], envelopes[j]] = [envelopes[j], envelopes[i]];
  }
  return envelopes;
}

// function generate365Days(target: number, total: number): number[] {
// 	// $1 dom, $2 lun, $3 mar, ... $7 sáb (repeating weekly)
// 	const days = [1, 2, 3, 4, 5, 6, 7];
// 	const classicWeekly = days.reduce((a, b) => a + b, 0); // 28
// 	const weeks = Math.ceil(total / 7);
// 	const classicTotal = classicWeekly * weeks;
// 	const scale = target / classicTotal;
// 	return Array.from({ length: total }, (_, i) =>
// 		Math.round(days[i % 7] * scale),
// 	);
// }

function generateNoSpend(target: number, total: number, _frequency: PlanFrequency): number[] {
  const base = Math.floor(target / total);
  return Array.from({ length: total }, () => Math.max(1, base + Math.floor(Math.random() * base * 0.3)));
}
