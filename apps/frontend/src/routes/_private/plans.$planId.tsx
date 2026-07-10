import { createFileRoute } from "@tanstack/react-router";
import { BanknoteIcon, HistoryIcon, Share2Icon, ShuffleIcon, StickyNoteIcon } from "lucide-react";
import { motion } from "motion/react";

import { TimelineContent } from "@/components/dialogs/timeline-content";
import { GridCellsPlan } from "@/components/plan-detail/grid-cells-plan";
import { HeaderPlan } from "@/components/plan-detail/header-plan";
import { LastTimelineEntry } from "@/components/plan-detail/last-timeline-entry";
// import { ProgressStatsSection } from "@/components/plan-detail/progress-stats-section";
import { StatsCurrentPlan } from "@/components/plan-detail/stats-current-plan";
// import { MilestoneRoadmap } from "@/components/shared/milestone-roadmap";
import { QuickDepositDialog } from "@/components/shared/quick-deposit-dialog";
// import { SavingsPredictor } from "@/components/shared/savings-predictor";
import { SavingsReminder } from "@/components/shared/savings-reminder";
// import { SavingsTrendsChart } from "@/components/shared/savings-trends-chart";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/services/plans.hooks";
import { useModal } from "@/stores/modal/use-modal-store";
import { useSheet } from "@/stores/sheet/use-sheet-store";

export const Route = createFileRoute("/_private/plans/$planId")({
  component: PlanDetailPage,
});

function PlanDetailPage() {
  const { planId } = Route.useParams();
  const { data: plan, isLoading } = usePlan(planId);
  const { openModal, closeModal } = useModal();
  const { openSheet } = useSheet();

  const currency = "ARS"; // FIXME.. currency must to be in store... read from settings
  const isRebalancing = false;
  const noteCount = 2;

  const handleOpenQuickDeposit = () => {
    openModal({
      title: "Depósito Rápido",
      description: "Selecciona un monto o ingresa uno personalizado. Se completará la celda pendiente más cercana.",
      content: plan ? (
        <QuickDepositDialog plan={plan} currency={currency} onDeposit={() => {}} onClose={closeModal} />
      ) : null,
    });
  };

  const handleOpenRebalance = () => {};

  const handleOpenTimeline = () => {
    openSheet({
      title: "Timeline",
      description: "Historial de actividad del plan",
      side: "right",
      className: "sm:max-w-md",
      content: plan ? <TimelineContent plan={plan} /> : null,
    });
  };

  const handleOpenWithdraw = () => {};
  const handleOpenNote = () => {};
  const handleOpenShare = () => {};

  if (isLoading) return <p>Cargando plan...</p>;
  if (!plan) return <p>Plan no encontrado</p>;

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 py-6 pb-28 sm:px-6">
        {/* Paused Banner */}
        {plan.status === "paused" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center"
          >
            <p className="text-sm font-medium text-amber-700">Plan pausado</p>
            <p className="mt-0.5 text-xs text-amber-600">
              Las celdas están bloqueadas. Reanuda el plan para seguir ahorrando.
            </p>
          </motion.div>
        )}

        <HeaderPlan plan={plan} onShareOpen={() => {}} onTogglePause={() => {}} isTogglingPause={false} />

        <StatsCurrentPlan plan={plan} currency={currency} />

        {/* <MilestoneRoadmap
          progressPercent={plan.progressPercent}
          targetAmount={plan.targetAmount}
          currency={currency}
        /> */}

        {/* <ProgressStatsSection plan={plan} /> */}

        {/* <SavingsPredictor planId={plan.id} currency={currency} progressPercent={plan.progressPercent} /> */}

        {/* Smart Savings Reminder */}
        <SavingsReminder plan={plan} variant="compact" currency={currency} />

        {/* Savings Trends Chart */}
        {/* <SavingsTrendsChart plan={plan} /> */}

        {/* Last Timeline Entry */}
        {plan.timelines && plan.timelines.length > 0 && (
          <LastTimelineEntry entry={plan.timelines[0]} currency={currency} />
        )}

        <GridCellsPlan plan={plan} />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-around gap-1 px-2 py-2.5 sm:gap-2 sm:px-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenQuickDeposit}
            disabled={plan.status !== "active"}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <BanknoteIcon className="size-4" />
            <span className="hidden sm:inline">Depósito</span>
            <span className="sm:hidden">Dep.</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenRebalance}
            disabled={isRebalancing || plan.status !== "active"}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <ShuffleIcon className="size-4" />
            <span className="hidden sm:inline">Aleatorizar</span>
            <span className="sm:hidden">Aleat.</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenTimeline} className="gap-1.5 text-xs sm:text-sm">
            <HistoryIcon className="size-4" />
            <span className="hidden sm:inline">Timeline</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenWithdraw}
            disabled={plan.status !== "active"}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <BanknoteIcon className="size-4" />
            <span className="hidden sm:inline">Retiro</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenNote} className="relative gap-1.5 text-xs sm:text-sm">
            <div className="relative">
              <StickyNoteIcon className="size-4" />
              {noteCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white">
                  {noteCount}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Notas</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleOpenShare} className="gap-1.5 text-xs sm:text-sm">
            <Share2Icon className="size-4" />
            <span className="hidden sm:inline">Compartir</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
