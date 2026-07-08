import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type ModalSize, useModalStoreInternal } from "@/stores/modal/use-modal-store";

const sizeClasses: Record<ModalSize, string> = {
  sm: "sm:max-w-sm", // 384px
  md: "sm:max-w-md", // 448px (Por defecto)
  lg: "sm:max-w-lg", // 512px
  xl: "sm:max-w-xl", // 576px
  "2xl": "sm:max-w-2xl", // 672px
  "3xl": "sm:max-w-3xl", // 768px
  "4xl": "sm:max-w-4xl", // 896px
  full: "sm:max-w-[95vw]",
};

export function ModalManager() {
  const { isOpen, title, description, content, size, className, closeModal } = useModalStoreInternal();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className={cn("max-h-[90vh] overflow-y-auto", sizeClasses[size ?? "md"], className)}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {!title && <DialogTitle className="sr-only">Cuadro de diálogo</DialogTitle>}
        {!description && <DialogDescription className="sr-only">Contenido interactivo</DialogDescription>}
        <div className="mt-2">{typeof content === "function" ? content(closeModal) : content}</div>
      </DialogContent>
    </Dialog>
  );
}
