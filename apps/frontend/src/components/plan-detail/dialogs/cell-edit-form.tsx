import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type EditCellPayload, editCellSchema } from "@savemony/shared";
import { useForm } from "react-hook-form";

import { Button, ButtonLoading } from "@/components/ui/button";
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field";
import { FieldController } from "@/components/ui/field-controller";
import { InputNumber } from "@/components/ui/input-number";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useEditCellAndRebalance } from "@/services/cells.hooks";
import type { CellData } from "@/types/app";

interface CellEditFormProps {
  planId: string;
  cell: CellData;
  onCancel: () => void;
}
export function CellEditForm({ planId, cell, onCancel }: CellEditFormProps) {
  const editCell = useEditCellAndRebalance();

  const form = useForm<EditCellPayload>({
    resolver: standardSchemaResolver(editCellSchema),
    defaultValues: {
      planId: planId,
      newAmount: cell.amount,
      rebalanceMode: "proportional",
    },
  });

  const handleConfirmEdit = async (data: EditCellPayload) => {
    editCell.mutate(
      {
        planId: planId,
        cellId: cell.id,
        newAmount: data.newAmount,
        rebalanceMode: data.rebalanceMode,
      },
      {
        onSuccess: () => {
          onCancel();
        },
      },
    );
  };

  return (
    <form onSubmit={form.handleSubmit(handleConfirmEdit)} className="space-y-4">
      <FieldController
        control={form.control}
        name="newAmount"
        label="Monto"
        render={(field) => <InputNumber {...field} />}
      />

      <FieldController
        control={form.control}
        name="rebalanceMode"
        render={({ value, onChange, ...field }) => (
          <RadioGroup value={value} className="w-fit" onValueChange={onChange} {...field}>
            <Field orientation="horizontal">
              <RadioGroupItem value="proportional" id="proportional" />
              <FieldContent>
                <FieldLabel htmlFor="proportional">Proporcional</FieldLabel>
                <FieldDescription className="text-xs">Mantiene las proporciones originales.</FieldDescription>
              </FieldContent>
            </Field>

            <Field orientation="horizontal">
              <RadioGroupItem value="random" id="random" />
              <FieldContent>
                <FieldLabel htmlFor="random">Aleatorio</FieldLabel>
                <FieldDescription className="text-xs">
                  Rebalancea de forma aleatoria entre celdas pendientes.
                </FieldDescription>
              </FieldContent>
            </Field>
          </RadioGroup>
        )}
      />

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <ButtonLoading
          type="submit"
          disabled={!form.formState.isValid || !form.formState.isDirty}
          isPending={editCell.isPending}
        >
          Confirmar
        </ButtonLoading>
      </div>
    </form>
  );
}
