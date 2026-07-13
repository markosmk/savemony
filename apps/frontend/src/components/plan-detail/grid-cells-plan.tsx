import { memo, useCallback, useMemo } from "react";
import { CheckIcon, LockIcon, PencilIcon, RotateCcwIcon } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { formatCompact } from "@/constants/currencies";
import { cn } from "@/lib/utils";
import { useToggleCell } from "@/services/cells.hooks";
import { useModal } from "@/stores/modal/use-modal-store";
import type { CellData, PlanWithCells } from "@/types/app";
import { CellEditForm } from "./dialogs/cell-edit-form";
import { getCellHeatClass, getHeatDotColor } from "./helpers";

interface GridCellsPlanProps {
  plan: PlanWithCells;
}

export function GridCellsPlan({ plan }: GridCellsPlanProps) {
  const currency = "ARS"; // TODO: get of config global
  const { openModal } = useModal();
  const toggle = useToggleCell();

  const handleCellToggle = useCallback(
    async (cell: CellData, action: "complete" | "uncomplete") => {
      try {
        await toggle.mutateAsync({ cellId: cell.id, action });
      } catch (err: unknown) {
        if ((err as Error).message === "MAX_CONCURRENT") {
          toast.error("Esperá un momento...", {
            description: "Máximo 3 celdas procesándose a la vez",
          });
        } else {
          toast.error((err as Error).message);
        }
      }
    },
    [toggle.mutateAsync],
  );

  const handleOpenEdit = (cell: CellData) => {
    openModal({
      title: `Editar celda #${cell.position + 1}`,
      description: `Cambiar el monto rebalanceará las demás celdas pendientes.`,
      content: (onClose) => <CellEditForm cell={cell} onCancel={onClose} planId={plan.id} />,
    });
  };

  const { minAmount, maxAmount } = useMemo(() => {
    const amounts = plan.cells.map((c) => c.amount);
    return {
      minAmount: Math.min(...amounts),
      maxAmount: Math.max(...amounts),
    };
  }, [plan.cells]);

  return (
    <Card className="mb-4 py-4">
      <CardContent className="p-0 px-3 sm:px-4">
        <div
          className="grid gap-1.5 sm:gap-2"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(max(64px, calc((100% - (${plan.gridCols} - 1) * 8px) / ${plan.gridCols})), 1fr))`,
          }}
        >
          {plan.cells.map((cell) => (
            <GridCell
              key={cell.id}
              cell={cell}
              currency={currency}
              minAmount={minAmount}
              maxAmount={maxAmount}
              totalCells={plan.totalCells}
              isLoading={toggle.isCellLoading(cell.id)}
              onAction={handleCellToggle}
              onEdit={handleOpenEdit}
            />
          ))}
        </div>

        {/* Heatmap Legend */}
        <div className="mt-3 flex items-center justify-between gap-4 text-xs text-muted-foreground">
          <p className="text-muted-foreground">Monto relativo</p>
          <div className="flex items-center gap-2">
            <LegendDot color="bg-emerald-400" label="Bajo" />
            <LegendDot color="bg-teal-400" label="Medio" />
            <LegendDot color="bg-amber-400" label="Alto" />
            <LegendDot color="bg-rose-400" label="Muy alto" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==========================================
// SUB-COMPONENTES
// ==========================================

interface GridCellProps {
  cell: CellData;
  currency: string;
  minAmount: number;
  maxAmount: number;
  totalCells: number;
  isLoading: boolean;
  onAction: (cell: CellData, action: "complete" | "uncomplete") => void;
  onEdit: (cell: CellData) => void;
}

const GridCell = memo(
  function GridCell({ cell, currency, minAmount, maxAmount, totalCells, isLoading, onAction, onEdit }: GridCellProps) {
    if (cell.isLockedAmount) return <LockedCell cell={cell} currency={currency} />;
    if (cell.status === "completed")
      return <CompletedCell cell={cell} currency={currency} isLoading={isLoading} onAction={onAction} />;
    return (
      <PendingCell
        cell={cell}
        currency={currency}
        minAmount={minAmount}
        maxAmount={maxAmount}
        totalCells={totalCells}
        isLoading={isLoading}
        onAction={onAction}
        onEdit={onEdit}
      />
    );
  },
  (prev, next) => {
    return (
      prev.cell.id === next.cell.id &&
      prev.cell.status === next.cell.status &&
      prev.cell.amount === next.cell.amount &&
      prev.cell.isLockedAmount === next.cell.isLockedAmount &&
      prev.isLoading === next.isLoading &&
      prev.currency === next.currency &&
      prev.minAmount === next.minAmount &&
      prev.maxAmount === next.maxAmount
    );
  },
);

function LockedCell({ cell, currency }: { cell: CellData; currency: string }) {
  return (
    <div className="relative flex aspect-square w-full flex-col items-center justify-center rounded-lg border border-muted bg-muted text-muted-foreground">
      <LockIcon className="mb-1 size-4 opacity-60" />
      <span className="text-[10px] font-medium sm:text-xs">{formatCompact(cell.amount, currency)}</span>
    </div>
  );
}

interface CompletedCellProps {
  cell: CellData;
  currency: string;
  isLoading: boolean;
  onAction: (cell: CellData, action: "uncomplete") => void;
}

function CompletedCell({ cell, currency, isLoading, onAction }: CompletedCellProps) {
  return (
    <motion.div
      layout
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.95 }}
      className="group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-emerald-200 bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-sm"
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]">
          <SpinnerLoader className="text-white" />
        </div>
      )}

      <CheckIcon className="absolute top-1.5 right-1.5 size-3.5 sm:size-4" />

      <CellAmount cell={cell} currency={currency} isLoading={isLoading} />

      {!isLoading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAction(cell, "uncomplete");
          }}
          className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium opacity-0 backdrop-blur-sm transition-all hover:bg-white/30 group-hover:opacity-100"
        >
          <RotateCcwIcon className="size-3" />
          <span className="hidden sm:inline">Deshacer</span>
        </button>
      )}
    </motion.div>
  );
}

interface PendingCellProps {
  cell: CellData;
  currency: string;
  minAmount: number;
  maxAmount: number;
  totalCells: number;
  isLoading: boolean;
  onAction: (cell: CellData, action: "complete") => void;
  onEdit: (cell: CellData) => void;
}

function PendingCell({
  cell,
  currency,
  minAmount,
  maxAmount,
  totalCells,
  isLoading,
  onAction,
  onEdit,
}: PendingCellProps) {
  const handleComplete = useCallback(() => {
    if (isLoading) return;
    onAction(cell, "complete");
  }, [cell, isLoading, onAction]);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isLoading) return;
      onEdit(cell);
    },
    [cell, isLoading, onEdit],
  );

  return (
    <motion.div
      layout
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-md",
        getCellHeatClass(cell.amount, minAmount, maxAmount),
        isLoading && "pointer-events-none",
      )}
    >
      {/* Botón principal: toda la celda */}
      <button
        type="button"
        onClick={handleComplete}
        disabled={isLoading}
        className="absolute inset-0 z-0 flex flex-col items-center justify-center"
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
            <SpinnerLoader />
          </div>
        )}
        <CellAmount cell={cell} currency={currency} isLoading={isLoading} />

        {/* Heat dot */}
        <span
          className={cn(
            "pointer-events-none absolute top-1.5 left-1.5 size-2 rounded-full",
            getHeatDotColor(cell.amount, minAmount, maxAmount),
          )}
        />

        {/* Milestone */}
        <MilestoneIndicator cell={cell} totalCells={totalCells} />
      </button>

      {/* Edit button */}
      {!isLoading && (
        <button
          type="button"
          onClick={handleEdit}
          className="absolute top-1 right-1 z-10 flex size-6 items-center justify-center rounded-full bg-white/80 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:bg-white hover:text-foreground group-hover:opacity-100 dark:bg-black/60"
        >
          <PencilIcon className="size-3" />
        </button>
      )}
    </motion.div>
  );
}

// COMPONENTES COMPARTIDOS

function CellAmount({ cell, currency, isLoading }: { cell: CellData; currency: string; isLoading: boolean }) {
  return (
    <div className={cn("flex flex-col items-center", isLoading && "opacity-30")}>
      <span className="text-xs font-semibold sm:text-sm">{formatCompact(cell.amount, currency)}</span>
      <span className="mt-0.5 text-[8px] text-muted-foreground sm:text-xs">#{cell.position + 1}</span>
    </div>
  );
}

function SpinnerLoader(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
      className={cn("size-8 text-foreground/50", props.className)}
      fill="currentColor"
    >
      <title>Loading Icon</title>
      <path d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity=".25" />
      <path d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z">
        <animateTransform
          attributeName="transform"
          type="rotate"
          dur="0.75s"
          values="0 12 12;360 12 12"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

// ==========================================
// MILESTONE INDICATOR
// ==========================================

interface MilestoneIndicatorProps {
  cell: CellData;
  totalCells: number;
}

function MilestoneIndicator({ cell, totalCells }: MilestoneIndicatorProps) {
  const milestones = [25, 50, 75];
  const cellProgress = Math.round(((cell.position + 1) / totalCells) * 100);
  const near = milestones.find((m) => Math.abs(cellProgress - m) <= 2);
  if (!near) return null;

  const colors = {
    25: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
    50: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-700",
    75: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
  };
  return (
    <div
      className={cn(
        "absolute bottom-1 left-1 right-1 z-10 rounded-md border px-1 py-0.5 text-center text-[9px] font-bold leading-tight sm:text-[10px]",
        colors[near as keyof typeof colors],
      )}
    >
      {near}% meta
    </div>
  );
}

// ==========================================
// LEGEND DOT
// ==========================================

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("size-2 rounded-full", color)} />
      {label}
    </span>
  );
}
