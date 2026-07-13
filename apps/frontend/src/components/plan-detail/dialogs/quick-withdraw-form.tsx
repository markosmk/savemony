import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type TimelineEntryPayload, timelineEntrySchema } from "@savemony/shared";
import { useForm } from "react-hook-form";

import { Button, ButtonLoading } from "@/components/ui/button";
import { CalendarInput } from "@/components/ui/calendar";
import { FieldController } from "@/components/ui/field-controller";
import { InputNumber } from "@/components/ui/input-number";
import { Textarea } from "@/components/ui/textarea";
import { useAddTimelineEntry } from "@/services/timeline.hooks";

interface QuickWithdrawFormProps {
  planId: string;
  onCancel: () => void;
}
export function QuickWithdrawForm({ planId, onCancel }: QuickWithdrawFormProps) {
  const addTimelineEntry = useAddTimelineEntry();

  const form = useForm<TimelineEntryPayload>({
    resolver: standardSchemaResolver(timelineEntrySchema),
    defaultValues: {
      type: "withdraw",
      amount: 0,
      description: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const handleConfirm = async (data: TimelineEntryPayload) => {
    addTimelineEntry.mutate(
      {
        planId: planId,
        ...data,
      },
      {
        onSuccess: () => {
          onCancel();
        },
      },
    );
  };

  return (
    <form onSubmit={form.handleSubmit(handleConfirm)} className="space-y-4">
      <FieldController
        control={form.control}
        name="amount"
        label="Monto a retirar"
        render={(field) => <InputNumber {...field} onFocus={(e) => e.target.select()} />}
      />

      <FieldController
        control={form.control}
        name="description"
        label="Motivo del retiro"
        render={(field) => <Textarea placeholder="Ej: Retiro para gastos personales" {...field} />}
      />

      <FieldController
        control={form.control}
        name="date"
        label="Fecha del retiro"
        render={(field) => <CalendarInput placeholder="Selecciona una fecha" {...field} />}
      />

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <ButtonLoading
          type="submit"
          disabled={!form.formState.isValid || !form.formState.isDirty}
          isPending={addTimelineEntry.isPending}
        >
          Confirmar
        </ButtonLoading>
      </div>
    </form>
  );
}
