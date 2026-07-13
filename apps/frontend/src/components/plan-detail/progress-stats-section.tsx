import { BarChart3Icon, CalendarIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import { motion } from "motion/react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/constants/currencies";
import type { PlanWithCells } from "@/types/app";

export function ProgressStatsSection({ plan }: { plan: PlanWithCells }) {
  const currency = "CLP"; // TODO: fix this currency
  const completedCellsList = plan.cells.filter((c) => c.status === "completed" && c.completedAt);
  if (completedCellsList.length === 0) return null;

  const uniqueDays = new Set(completedCellsList.map((c) => c.completedAt?.slice(0, 10)).filter(Boolean)).size;

  const amounts = completedCellsList.map((c) => c.amount);
  const avgPerCell = plan.targetAmount / (plan.totalCells || 1);
  const maxAmount = Math.max(...amounts);
  const minAmount = Math.min(...amounts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      <Card className="py-3">
        <CardContent className="flex flex-col items-center gap-1 py-1 px-3 text-center">
          <CalendarIcon className="size-5 text-emerald-500" />
          <p className="font-bold text-foreground">{uniqueDays}</p>
          <p className="text-xs leading-1 text-muted-foreground">Días activos</p>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="flex flex-col items-center gap-1 py-1 px-3 text-center">
          <BarChart3Icon className="size-5 text-primary" />
          <p className="font-bold text-foreground">{formatCurrency(avgPerCell, currency)}</p>
          <p className="text-xs leading-1 text-muted-foreground">Promedio por celda</p>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="flex flex-col items-center gap-1 py-1 px-3 text-center">
          <TrendingUpIcon className="size-5 text-amber-500" />
          <p className="font-bold text-foreground">{formatCurrency(maxAmount, currency)}</p>
          <p className="text-xs leading-1 text-muted-foreground">Monto más alto</p>
        </CardContent>
      </Card>
      <Card className="py-3">
        <CardContent className="flex flex-col items-center gap-1 py-1 px-3 text-center">
          <TrendingDownIcon className="size-5 text-rose-400" />
          <p className="font-bold text-foreground">{formatCurrency(minAmount, currency)}</p>
          <p className="text-xs leading-1 text-muted-foreground">Monto más bajo</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
