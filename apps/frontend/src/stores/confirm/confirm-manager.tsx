import { useState } from "react";
import { Loader2Icon } from "lucide-react";

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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="mt-2 text-sm text-muted-foreground">
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
            disabled={isPending}
            onClick={() => {
              setError(null);
              close(false);
            }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isPending ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isPending ? "Procesando..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
