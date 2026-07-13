// ──────────────────────────────────────────────
// Heatmap Helpers
// ──────────────────────────────────────────────

export function getCellHeatClass(
	amount: number,
	minAmount: number,
	maxAmount: number,
): string {
	if (maxAmount <= minAmount) return "";
	const ratio = (amount - minAmount) / (maxAmount - minAmount);
	if (ratio < 0.25)
		return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50";
	if (ratio < 0.5)
		return "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50";
	if (ratio < 0.75)
		return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50";
	return "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50";
}

export function getHeatDotColor(
	amount: number,
	minAmount: number,
	maxAmount: number,
): string {
	if (maxAmount <= minAmount) return "bg-emerald-400";
	const ratio = (amount - minAmount) / (maxAmount - minAmount);
	if (ratio < 0.25) return "bg-emerald-400";
	if (ratio < 0.5) return "bg-teal-400";
	if (ratio < 0.75) return "bg-amber-400";
	return "bg-rose-400";
}
