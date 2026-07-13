import { createFileRoute } from "@tanstack/react-router";
import { BanknoteIcon, HistoryIcon, Share2Icon, ShuffleIcon, StickyNoteIcon } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { TimelineContent } from "@/components/dialogs/timeline-content";
import { QuickNoteForm } from "@/components/plan-detail/dialogs/quick-note-form";
import { QuickWithdrawForm } from "@/components/plan-detail/dialogs/quick-withdraw-form";
import { ShareContent } from "@/components/plan-detail/dialogs/share-content";
import { GridCellsPlan } from "@/components/plan-detail/grid-cells-plan";
import { HeaderPlan } from "@/components/plan-detail/header-plan";
import { LastTimelineEntry } from "@/components/plan-detail/last-timeline-entry";
// import { ProgressStatsSection } from "@/components/plan-detail/progress-stats-section";
import { StatsCurrentPlan } from "@/components/plan-detail/stats-current-plan";
// import { MilestoneRoadmap } from "@/components/shared/milestone-roadmap";
import { QuickDepositDialog } from "@/components/shared/quick-deposit-dialog";
// import { SavingsPredictor } from "@/components/shared/savings-predictor";
import { SavingsReminder } from "@/components/shared/savings-reminder";
import { AlertMessage } from "@/components/ui/alert";
// import { SavingsTrendsChart } from "@/components/shared/savings-trends-chart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlan, useRebalanceAll, useUpdatePlan } from "@/services/plans.hooks";
import { useConfirm } from "@/stores/confirm/use-confirm-store";
import { useModal } from "@/stores/modal/use-modal-store";
import { useSheet } from "@/stores/sheet/use-sheet-store";

export const Route = createFileRoute("/_private/plans/$planId")({
  component: PlanDetailPage,
});

function PlanDetailPage() {
  const { planId } = Route.useParams();
  const { data: plan, isLoading, error } = usePlan(planId);
  const { openModal, closeModal } = useModal();
  const confirm = useConfirm();
  const { openSheet } = useSheet();

  const currency = "ARS"; // FIXME.. currency must to be in store... read from settings
  const isRebalancing = false;
  const noteCount = 2;

  const updatePlan = useUpdatePlan();
  const rebalanceAll = useRebalanceAll();

  const handleTogglePause = () => {
    if (!plan) return null;
    updatePlan.mutate(
      {
        id: plan.id,
        data: {
          status: plan.status === "active" ? "paused" : "active",
        },
      },
      {
        onSuccess: () => {
          toast.success(`Plan ${plan.status === "active" ? "pausado" : "activado"}`);
        },
        onError: () => {
          toast.error(`Error al ${plan.status === "active" ? "pausar" : "activar"} el plan`);
        },
      },
    );
  };

  const handleOpenQuickDeposit = () => {
    openModal({
      title: "Depósito Rápido",
      description: "Selecciona un monto o ingresa uno personalizado. Se completará la celda pendiente más cercana.",
      content: plan ? (
        <QuickDepositDialog plan={plan} currency={currency} onDeposit={() => {}} onClose={closeModal} />
      ) : null,
    });
  };

  const handleOpenTimeline = () => {
    openSheet({
      title: "Timeline",
      description: "Historial de actividad del plan",
      side: "right",
      className: "sm:max-w-md",
      content: plan ? <TimelineContent plan={plan} /> : null,
    });
  };

  const handleOpenRebalance = () => {
    if (!plan) return;
    confirm({
      title: "Rebalancear Plan",
      message: "¿Estás seguro de que quieres rebalancear el plan?",
      action: async () => {
        await rebalanceAll.mutateAsync(plan.id);
      },
      // error: (error) => {
      // 	toast.error(error.message);
      // },
    });
  };

  const handleOpenWithdraw = () => {
    if (!plan) return;
    openModal({
      title: "Retirar de este plan",
      description: "Registra un retiro de tus ahorros. El monto se descontará de tu progreso actual.",
      content: (onCancel) => (
        <QuickWithdrawForm
          planId={plan.id}
          onCancel={onCancel}
          currentAmount={plan.currentAmount}
          currency={currency}
        />
      ),
    });
  };

  const handleOpenNote = () => {
    if (!plan) return;
    openModal({
      title: "Agregar Nota",
      content: (onCancel) => <QuickNoteForm planId={plan.id} onCancel={onCancel} />,
    });
  };

  const handleOpenShare = () => {
    openModal({
      title: "Compartir Plan",
      description: "Comparte tu progreso con tus amigos",
      content: plan ? <ShareContent plan={plan} /> : null,
    });
  };

  if (isLoading) {
    return (
      <div>
        <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          <Skeleton className="mb-6 h-8 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-52 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div>
        <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
          <AlertMessage variant="destructive" title="Error" message="No se pudo cargar el plan. Intenta de nuevo." />
        </main>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 py-6 pb-28 sm:px-6">
        {/* Paused Banner */}
        {plan.status === "paused" && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/30 px-4 py-3 text-center"
          >
            <p className="text-sm font-medium text-amber-700 dark:text-amber-500">Plan pausado</p>
            <p className="mt-0.5 text-xs text-amber-600">
              Las celdas están bloqueadas. Reanuda el plan para seguir ahorrando.
            </p>
          </motion.div>
        )}

        <HeaderPlan
          plan={plan}
          onShareOpen={handleOpenShare}
          onTogglePause={handleTogglePause}
          isTogglingPause={updatePlan.isPending}
        />

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
