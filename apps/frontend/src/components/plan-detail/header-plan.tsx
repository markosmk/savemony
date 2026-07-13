import { useNavigate } from "@tanstack/react-router";
import { ChevronLeftIcon, PauseIcon, PlayIcon, Share2Icon, SparklesIcon } from "lucide-react";
import { motion } from "motion/react";

import { CategoryBadge } from "@/components/shared/category-badge";
import { Button, ButtonLoading } from "@/components/ui/button";
import { calculateLevel, cn } from "@/lib/utils";
import type { PlanWithCells } from "@/types/app";

interface HeaderPlanProps {
  plan: PlanWithCells;
  onShareOpen: () => void;
  onTogglePause: () => void;
  isTogglingPause: boolean;
}

export function HeaderPlan({ plan, onShareOpen, onTogglePause, isTogglingPause }: HeaderPlanProps) {
  const navigate = useNavigate();
  const level = calculateLevel(plan.progressPercent);

  // Deadline countdown
  const deadlineText = plan.deadline
    ? (() => {
        const now = new Date();
        const dl = new Date(plan.deadline);
        const diffMs = dl.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return "Vencido";
        if (diffDays === 1) return "1 día restante";
        if (diffDays < 30) return `${diffDays} días restantes`;
        const diffMonths = Math.ceil(diffDays / 30);
        return `${diffMonths} mes${diffMonths > 1 ? "es" : ""} restante${diffMonths > 1 ? "s" : ""}`;
      })()
    : null;

  return (
    <div className="mb-6 flex items-start gap-3">
      <Button variant="secondary" size="icon" onClick={() => navigate({ to: "/plans" })}>
        <ChevronLeftIcon className="size-5" />
      </Button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {/* Floating decoration emoji */}
          <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">{plan.title}</h1>
          {/* Level badge */}
          <motion.div
            key={level}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="level-badge-shine flex h-6 min-w-6 items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-amber-500 px-1.5 text-[10px] font-bold text-white shadow-sm sm:h-7 sm:min-w-7 sm:text-xs"
          >
            <SparklesIcon className="mr-0.5 size-2.5 sm:size-3" />
            {level}
          </motion.div>
          {/* Floating decoration */}
          <motion.span className="animate-float-decoration text-sm hidden sm:inline-block" aria-hidden="true">
            {plan.progressPercent >= 75
              ? "🌟"
              : plan.progressPercent >= 50
                ? "✨"
                : plan.progressPercent >= 25
                  ? "🌱"
                  : "💫"}
          </motion.span>
        </div>
        {deadlineText && <p className="mt-0.5 text-sm text-muted-foreground">{deadlineText}</p>}
        {plan.category && (
          <div className="mt-0.5">
            <CategoryBadge category={plan.category} />
          </div>
        )}
      </div>
      {/* Share button */}
      <Button variant="outline" size="icon" onClick={onShareOpen} className="shrink-0 w-8 h-8">
        <Share2Icon className="size-4" />
      </Button>
      {/* Pause/Resume Toggle */}
      {plan.status !== "completed" && plan.status !== "abandoned" && (
        <ButtonLoading
          variant="outline"
          size="sm"
          onClick={onTogglePause}
          isPending={isTogglingPause}
          className={cn(
            "shrink-0 gap-1.5",
            plan.status === "paused"
              ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-500"
              : "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-500",
          )}
        >
          {plan.status === "paused" ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
          <span className="hidden sm:inline">{plan.status === "paused" ? "Reanudar" : "Pausar"}</span>
        </ButtonLoading>
      )}
    </div>
  );
}
