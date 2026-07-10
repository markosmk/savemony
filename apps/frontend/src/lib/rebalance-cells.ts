import type { RebalanceMode } from "@/types/app";

// Rebalancing algorithm
export function rebalanceCells(
	cells: { id: string; amount: number; status: string; isLocked: boolean }[],
	totalTarget: number,
	mode: RebalanceMode,
	minAmount: number = 0,
	maxAmount: number = 0,
): { id: string; amount: number }[] {
	const pendingCells = cells.filter(
		(c) => c.status === "pending" && !c.isLocked,
	);
	const lockedCells = cells.filter(
		(c) => c.isLocked || c.status === "completed",
	);

	const lockedTotal = lockedCells.reduce((sum, c) => sum + c.amount, 0);
	const remainingTarget = totalTarget - lockedTotal;

	if (pendingCells.length === 0 || remainingTarget <= 0) {
		return cells.map((c) => ({ id: c.id, amount: c.amount }));
	}

	const baseAmount = remainingTarget / pendingCells.length;

	switch (mode) {
		case "proportional":
			return rebalanceProportional(
				cells,
				pendingCells,
				baseAmount,
				minAmount,
				maxAmount,
			);
		case "random":
			return rebalanceRandom(
				cells,
				pendingCells,
				remainingTarget,
				minAmount,
				maxAmount,
			);
		default:
			return rebalanceProportional(
				cells,
				pendingCells,
				baseAmount,
				minAmount,
				maxAmount,
			);
	}
}

function rebalanceProportional(
	allCells: { id: string; amount: number; status: string; isLocked: boolean }[],
	pendingCells: {
		id: string;
		amount: number;
		status: string;
		isLocked: boolean;
	}[],
	baseAmount: number,
	minAmount: number,
	maxAmount: number,
): { id: string; amount: number }[] {
	// Sort pending cells by current amount descending for proportional reduction
	const sorted = [...pendingCells].sort((a, b) => b.amount - a.amount);
	const result = allCells.map((c) => ({ id: c.id, amount: c.amount }));

	let remaining = baseAmount * pendingCells.length;
	const pendingIds = new Set(pendingCells.map((c) => c.id));

	for (let i = 0; i < sorted.length; i++) {
		const cell = sorted[i];
		const idx = result.findIndex((r) => r.id === cell.id);
		const effectiveMin = minAmount || 1;
		const effectiveMax = maxAmount || baseAmount * 3;

		let newAmount: number;
		if (i === sorted.length - 1) {
			// Last cell gets the remainder
			newAmount = Math.max(effectiveMin, remaining);
		} else {
			// Proportional to current amount
			const proportion =
				cell.amount / (pendingCells.reduce((s, c) => s + c.amount, 0) || 1);
			newAmount = Math.max(
				effectiveMin,
				Math.min(effectiveMax, Math.floor(remaining * proportion)),
			);
		}

		result[idx].amount = newAmount;
		remaining -= newAmount;
	}

	return result;
}

function rebalanceRandom(
	allCells: { id: string; amount: number; status: string; isLocked: boolean }[],
	pendingCells: {
		id: string;
		amount: number;
		status: string;
		isLocked: boolean;
	}[],
	remainingTarget: number,
	minAmount: number,
	maxAmount: number,
): { id: string; amount: number }[] {
	const result = allCells.map((c) => ({ id: c.id, amount: c.amount }));
	const effectiveMin = minAmount || 1;
	const effectiveMax =
		maxAmount || (remainingTarget / pendingCells.length) * 2.5;

	let remaining = remainingTarget;
	const shuffled = [...pendingCells].sort(() => Math.random() - 0.5);

	for (let i = 0; i < shuffled.length; i++) {
		const cell = shuffled[i];
		const idx = result.findIndex((r) => r.id === cell.id);

		let newAmount: number;
		if (i === shuffled.length - 1) {
			newAmount = Math.max(effectiveMin, remaining);
		} else {
			const avgRemaining = remaining / (shuffled.length - i);
			const variance = avgRemaining * 0.5;
			newAmount = Math.max(
				effectiveMin,
				Math.min(
					effectiveMax,
					Math.floor(avgRemaining + (Math.random() * variance * 2 - variance)),
				),
			);
		}

		result[idx].amount = newAmount;
		remaining -= newAmount;
	}

	return result;
}
