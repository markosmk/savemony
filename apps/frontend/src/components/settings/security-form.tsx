import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type UpdatePasswordPayload, updatePasswordSchema } from "@savemony/shared";
import { LockIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AnimatedDiv } from "@/components/animated-div";
import { ButtonLoading } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldController } from "@/components/ui/field-controller";
import { InputPassword } from "@/components/ui/input";
import { useUpdatePassword } from "@/services/account.hooks";

export function SecurityForm() {
  const updatePassword = useUpdatePassword();

  const form = useForm<UpdatePasswordPayload>({
    resolver: standardSchemaResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = (values: UpdatePasswordPayload) => {
    updatePassword.mutate(values, {
      onSuccess: () => toast.success("Configuración guardada"),
      onError: () => toast.error("Error al guardar"),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <AnimatedDiv custom={0}>
        <Card className="mb-4 overflow-hidden gap-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
                <LockIcon className="size-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FieldController
              control={form.control}
              label="Contraseña actual"
              name="currentPassword"
              render={(field) => <InputPassword {...field} />}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FieldController
                control={form.control}
                label="Nueva contraseña"
                name="newPassword"
                render={(field) => <InputPassword {...field} />}
              />
              <FieldController
                control={form.control}
                label="Confirmar nueva contraseña"
                name="confirmNewPassword"
                render={(field) => <InputPassword {...field} />}
              />
            </div>

            <ButtonLoading type="submit" isPending={updatePassword.isPending} disabled={!form.formState.isDirty}>
              Actualizar contraseña
            </ButtonLoading>
          </CardContent>
        </Card>
      </AnimatedDiv>
    </form>
  );
}
