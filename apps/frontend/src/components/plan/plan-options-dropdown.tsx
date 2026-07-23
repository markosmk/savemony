import type { Plan } from "@savemony/shared";
import {
  AlertCircleIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  EllipsisVerticalIcon,
  SquarePenIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeletePlan, useStatusPlan } from "@/services/plans.hooks";
import { useConfirm } from "@/stores/confirm/use-confirm-store";
import { useModal } from "@/stores/modal/use-modal-store";
import { PlanUpdateForm } from "./plan-update-form";

export function PlanOptionsDropdown({ plan }: { plan: Plan }) {
  const { openModal } = useModal();
  const confirm = useConfirm();

  const mutateStatusPlan = useStatusPlan();
  const mutateDeletePlan = useDeletePlan();

  const handleArchive = () => {
    confirm({
      title: "Archivar Plan",
      message: "¿Estás seguro de que quieres archivar este plan?",
      content: (
        <>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/30">
            <div className="flex items-start gap-2">
              <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <p className="font-semibold">¿Qué significa archivar?</p>
                <ul className="mt-1 space-y-1 list-disc ml-3">
                  <li>El plan se ocultará de tu lista principal</li>
                  <li>Todos los datos y progreso se conservarán</li>
                  <li>Puedes restaurarlo cuando quieras</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ),
      action: async () => {
        await mutateStatusPlan.mutateAsync({ id: plan.id, action: "archive" });
        toast.success("Plan Archivado");
      },
    });
  };

  const handleUnarchive = () => {
    confirm({
      title: "Reactivar Plan",
      message: "¿Estás seguro de que quieres reactivar este plan?",
      action: async () => {
        await mutateStatusPlan.mutateAsync({ id: plan.id, action: "reactivate" });
        toast.success("Plan Reactivado");
      },
    });
  };

  const handleDelete = () => {
    confirm({
      title: "Eliminar Plan",
      message: "¿Estás seguro de que quieres eliminar este plan?",
      confirmText: "Si, Eliminar",
      action: async () => {
        await mutateDeletePlan.mutateAsync(plan.id);
        toast.success("Se ha eliminado el plan.");
      },
    });
  };

  const handleEdit = () => {
    openModal({
      title: "Editar Plan",
      content: (closeModal) => <PlanUpdateForm initialValues={plan} onCancel={closeModal} />,
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <SquarePenIcon />
          Editar
        </DropdownMenuItem>
        {plan.status === "active" && (
          <DropdownMenuItem onClick={handleArchive}>
            <ArchiveIcon />
            Archivar
          </DropdownMenuItem>
        )}
        {plan.status === "archived" && (
          <DropdownMenuItem onClick={handleUnarchive}>
            <ArchiveRestoreIcon />
            Reactivar
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
          <Trash2Icon />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
