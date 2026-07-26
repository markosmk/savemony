import type { AnalyticsData } from "@savemony/shared";
import { FlameIcon, PiggyBankIcon, TargetIcon } from "lucide-react";
import { LayoutGroup, motion, type Variants } from "motion/react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/constants/currencies";

const fadeInUp: Variants = {};

interface StatsCardProps {
  data?: AnalyticsData;
  isLoading: boolean;
  currency: string;
}

export function StatsCard({ isLoading, data: stats, currency }: StatsCardProps) {
  if (isLoading) {
    return Array.from({ length: 4 }).map((_, i) => (
      <Skeleton key={i} className="h-24 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </Skeleton>
    ));
  }

  return (
    <LayoutGroup>
      <motion.div custom={0} variants={fadeInUp} initial="hidden" animate="visible">
        <Card className="gap-3 py-4 rounded-xl">
          <CardContent className="flex items-center gap-3 p-0 px-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
              <PiggyBankIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">Total Ahorrado</p>
              <motion.p
                layoutId="stat-total-saved"
                className="text-base font-semibold text-foreground"
                key={stats?.totalSaved ?? 0}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {formatCurrency(stats?.totalSaved ?? 0, currency)}
              </motion.p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div custom={1} variants={fadeInUp} initial="hidden" animate="visible">
        <Card className="gap-3 py-4 rounded-xl">
          <CardContent className="flex items-center gap-3 p-0 px-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/50">
              <TargetIcon className="size-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">Planes Activos</p>
              <motion.p
                layoutId="stat-active-plans"
                className="text-base font-semibold text-foreground"
                key={stats?.activePlans ?? 0}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {stats?.activePlans ?? 0}
              </motion.p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div custom={2} variants={fadeInUp} initial="hidden" animate="visible">
        <Card className="gap-3 py-4 rounded-xl">
          <CardContent className="flex items-center gap-3 p-0 px-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
              <FlameIcon className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">Racha Actual</p>
              <motion.p
                layoutId="stat-current-streak"
                className="text-base font-semibold text-foreground"
                key={stats?.topStats.longestStreak ?? 0}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {stats?.topStats.longestStreak ?? 0} días
              </motion.p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* <motion.div custom={3} variants={fadeInUp} initial="hidden" animate="visible">
        <Card className="gap-3 py-4 rounded-xl stat-card-rose card-hover-lift stat-animated-border card-shine">
          <CardContent className="flex items-center gap-3 p-0 px-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/50">
              <TrophyIcon className="size-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">Logros</p>
              <motion.p
                layoutId="stat-achievements"
                className="text-base font-semibold text-foreground"
                key={stats?.totalAchievements ?? 0}
                initial={{ scale: 1.08 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {stats?.totalAchievements ?? 0}
              </motion.p>
            </div>
          </CardContent>
        </Card> */}
      {/* </motion.div> */}
    </LayoutGroup>
  );
}
