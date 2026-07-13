import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteAccount } from "@/services/account.hooks";
import type { UserAuth } from "@/services/auth.hooks";
import { useConfirm } from "@/stores/confirm/use-confirm-store";

export function DeleteAccountSection({ user }: { user: UserAuth }) {
  const deleteAccount = useDeleteAccount();
  const confirm = useConfirm();

  const handleDelete = () => {
    confirm({
      title: "Eliminar cuenta",
      message:
        "¿Estás seguro de que quieres eliminar tu cuenta? Todos tus datos, planes y progreso se eliminarán de forma permanente. Esta acción no se puede deshacer.",
      action: async () => {
        deleteAccount.mutateAsync(user.id, {
          onSuccess: () => toast.success("Cuenta eliminada"),
          onError: () => toast.error("Error al eliminar cuenta"),
        });
      },
    });
  };

  return (
    <Card className="mb-4 border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
          <AlertTriangle className="size-4" />
          Zona de Peligro
        </CardTitle>
        <CardDescription className="text-red-600/80 dark:text-red-400/70">Acciones irreversibles</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Borrar cuenta</p>
            <p className="text-xs text-red-600/70 dark:text-red-400/60">
              Se eliminarán todos tus datos, planes y progreso de forma permanente. Esta acción no se puede deshacer.
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Borrar cuenta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
