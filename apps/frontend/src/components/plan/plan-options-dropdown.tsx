import type { Plan } from "@savemony/shared";
import { ArchiveIcon, ArchiveRestoreIcon, EllipsisVerticalIcon, SquarePenIcon, Trash2Icon } from "lucide-react";
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
