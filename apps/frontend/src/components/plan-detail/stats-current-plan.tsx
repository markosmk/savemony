import { motion } from "motion/react";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/constants/currencies";
import { cn, getMotivationalQuote } from "@/lib/utils";
import type { PlanWithCells } from "@/types/app";

const radius = 54;
const circumference = 2 * Math.PI * radius;

export function StatsCurrentPlan({ plan, currency }: { plan: PlanWithCells; currency?: string }) {
  // Progress circle params
  const strokeDashoffset = circumference - (plan.progressPercent / 100) * circumference;

  const quote = getMotivationalQuote(plan.progressPercent);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <Card className="relative mb-6 gap-0 overflow-hidden py-0 border-0 shadow-lg">
        <CardContent className="relative flex items-center gap-4 p-4 sm:gap-6 sm:p-6">
          {/* Circular Progress with gradient stroke */}
          <div className={cn("relative shrink-0", plan.progressPercent > 75 && "progress-ring-glow")}>
            <svg width="128" height="128" viewBox="0 0 128 128" className="sm:h-36 sm:w-36">
              <title>Progreso del plan</title>
              <defs>
                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted-foreground/30"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                fill="none"
                stroke="url(#progress-gradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="progress-ring-gradient"
                transform="rotate(-90 64 64)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="gradient-text-emerald text-2xl font-extrabold sm:text-3xl">{plan.progressPercent}%</span>
              <span className="text-xs text-muted-foreground">completado</span>
            </div>
          </div>

          {/* Amounts & Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex gap-2 divide-x">
              <div className="pr-4">
                <p className="text-sm text-muted-foreground">Ahorrado</p>
                <p className="gradient-text-emerald text-lg font-extrabold">
                  {formatCurrency(plan.currentAmount, currency)}
                </p>
              </div>
              <div className="pl-4">
                <p className="text-sm text-muted-foreground">Meta</p>
                <p className="text-lg font-medium text-foreground">{formatCurrency(plan.targetAmount, currency)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {plan.streak > 0 && (
                <span className="text-base font-medium text-orange-500">
                  🔥 {plan.streak} día{plan.streak !== 1 ? "s" : ""}
                </span>
              )}
              <span className="text-base text-muted-foreground">
                {plan.completedCells}/{plan.totalCells} celdas
              </span>
            </div>
            {/* Enhanced motivational quote with gradient text */}
            <motion.div
              key={plan.progressPercent}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-1 rounded-lg bg-linear-to-r from-primary/20 via-emerald-500/20 to-transparent px-3 py-2"
            >
              <p className="text-sm font-semibold text-shimmer">&ldquo;{quote}&rdquo;</p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
