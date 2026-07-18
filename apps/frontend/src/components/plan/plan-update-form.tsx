import { valibotResolver } from "@hookform/resolvers/valibot";
import { type Plan, type UpdatePlanPayload, updatePlanSchema } from "@savemony/shared";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button, ButtonLoading } from "@/components/ui/button";
import { CalendarInput } from "@/components/ui/calendar";
import { CurrencyInput } from "@/components/ui/currency-input";
import { CurrencyMultipleInput } from "@/components/ui/currency-multiple-input";
import { FieldController } from "@/components/ui/field-controller";
import { GroupInput } from "@/components/ui/group-input";
import { Input } from "@/components/ui/input";
import { WeekdayPicker } from "@/components/ui/weekday-picker";
import { useUpdatePlan } from "@/services/plans.hooks";

export function PlanUpdateForm({ initialValues, onCancel }: { initialValues: Plan; onCancel: () => void }) {
  const form = useForm<UpdatePlanPayload>({
    resolver: valibotResolver(updatePlanSchema),
    defaultValues: {
      name: initialValues.name ?? "",
      goalAmount: initialValues.goalAmount ?? 0,
      endDate: initialValues.endDate ?? "",
      frequencyType: initialValues.frequencyType ?? "WEEKLY",
      customDays: initialValues.customDays ?? [],
      suggestedQuota: initialValues.suggestedQuota ?? 0,
      quickAmounts: initialValues.quickAmounts ?? [],
      // isFlexible: initialValues.isFlexible,
    },
  });

  const updateMutation = useUpdatePlan();

  function onSubmit(data: UpdatePlanPayload) {
    updateMutation.mutate(
      { id: initialValues.id, data },
      {
        onSuccess: () => {
          toast.success("Plan actualizado correctamente");
          onCancel();
        },
        onError: (error) => {
          toast.error("Error al actualizar el plan");
          console.log(error);
        },
      },
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FieldController
        control={form.control}
        name="name"
        label="Nombre del plan"
        render={(field) => <Input {...field} />}
      />
      <FieldController
        control={form.control}
        name="goalAmount"
        label="Monto de la meta"
        render={(field) => <CurrencyInput {...field} value={field.value ?? 0} />}
      />
      <FieldController
        control={form.control}
        name="endDate"
        label="Fecha límite"
        render={(field) => <CalendarInput {...field} />}
      />
      <FieldController
        control={form.control}
        name="frequencyType"
        label="Frecuencia"
        render={(field) => (
          <GroupInput {...field} value={field.value ?? "WEEKLY"} onValueChange={field.onChange} options={[]} />
        )}
      />
      <FieldController
        control={form.control}
        name="customDays"
        label="Días personalizados"
        render={(field) => <WeekdayPicker {...field} />}
      />
      <FieldController
        control={form.control}
        name="quickAmounts"
        label="Montos rápidos"
        render={(field) => <CurrencyMultipleInput {...field} value={field.value ?? []} />}
      />

      <FieldController
        control={form.control}
        name="suggestedQuota"
        label="Cuota sugerida"
        render={(field) => <CurrencyInput {...field} value={field.value ?? 0} />}
      />

      <div className="flex gap-2 justify-end w-full">
        <Button type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <ButtonLoading type="submit" isPending={form.formState.isSubmitting || updateMutation.isPending}>
          Guardar Cambios
        </ButtonLoading>
      </div>
    </form>
  );
}
