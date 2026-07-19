import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ButtonLoading } from "@/components/ui/button";
import { useConfirmStoreInternal } from "./use-confirm-store";

export function ConfirmManager() {
  const { isOpen, title, message, confirmText, cancelText, close, action, content } = useConfirmStoreInternal();

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!action) {
      close(true);
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      await action();
      setIsPending(false);
      close(true); // close for success
    } catch (err) {
      setIsPending(false);
      // show error in modal
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && close(false)}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">
              {message}
              {error && (
                <div className="mt-3 p-2 bg-destructive/10 text-destructive rounded-md text-xs font-medium">
                  {error}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {content}
        <AlertDialogFooter>
          <AlertDialogCancel
            variant="secondary"
            disabled={isPending}
            onClick={() => {
              setError(null);
              close(false);
            }}
          >
            {cancelText}
          </AlertDialogCancel>
          <ButtonLoading onClick={handleConfirm} variant="destructive" isPending={isPending}>
            {confirmText}
          </ButtonLoading>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
