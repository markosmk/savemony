import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type TimelineEntryPayload, timelineEntrySchema } from "@savemony/shared";
import { useForm } from "react-hook-form";

import { Button, ButtonLoading } from "@/components/ui/button";
import { FieldController } from "@/components/ui/field-controller";
import { Textarea } from "@/components/ui/textarea";
import { useAddTimelineEntry } from "@/services/timeline.hooks";

interface QuickNoteFormProps {
  planId: string;
  onCancel: () => void;
}
export function QuickNoteForm({ planId, onCancel }: QuickNoteFormProps) {
  const addTimelineEntry = useAddTimelineEntry();

  const form = useForm<TimelineEntryPayload>({
    resolver: standardSchemaResolver(timelineEntrySchema),
    defaultValues: {
      type: "note",
      description: "",
      amount: undefined,
      date: undefined,
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
        name="description"
        label="Nota"
        description="Agrega una nota o comentario para este plan."
        render={(field) => <Textarea placeholder="Ej: Comentario sobre el plan" {...field} />}
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
