import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { type ProfileUpdatePayload, profileUpdateSchema } from "@savemony/shared";
import { BadgeCheckIcon, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AnimatedDiv } from "@/components/animated-div";
import { ButtonLoading } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldController } from "@/components/ui/field-controller";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "@/services/account.hooks";
import type { UserAuth } from "@/services/auth.hooks";

export function ProfileForm({ user }: { user: UserAuth }) {
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileUpdatePayload>({
    resolver: standardSchemaResolver(profileUpdateSchema),
    defaultValues: {
      name: user.name ?? "",
      email: user.email,
    },
  });

  const onSubmit = (values: ProfileUpdatePayload) => {
    updateProfile.mutate(values, {
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
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <User className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <FieldController
              control={form.control}
              name="name"
              label="Nombre"
              render={(field) => <Input {...field} placeholder="Tu nombre" />}
            />

            <FieldController
              control={form.control}
              name="email"
              label={
                <div className="flex items-center gap-1">
                  Email
                  <BadgeCheckIcon className="size-4 text-emerald-500" />
                </div>
              }
              description="El email no puede ser modificado"
              render={(field) => <Input {...field} placeholder="Tu email" disabled />}
            />

            <ButtonLoading type="submit" isPending={updateProfile.isPending} disabled={!form.formState.isDirty}>
              Guardar Cambios
            </ButtonLoading>
          </CardContent>
        </Card>
      </AnimatedDiv>
    </form>
  );
}
