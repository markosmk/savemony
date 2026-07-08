import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useSheetStoreInternal } from "@/stores/sheet/use-sheet-store";

export function SheetManager() {
  const { isOpen, title, description, content, side, className, closeSheet } = useSheetStoreInternal();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent side={side} className={cn("overflow-y-auto gap-0", className)}>
        {(title || description) && (
          <SheetHeader>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
        )}
        {!title && <SheetTitle className="sr-only">Menú lateral</SheetTitle>}
        {!description && <SheetDescription className="sr-only">Contenido lateral interactivo</SheetDescription>}
        <div className="flex-1">{typeof content === "function" ? content(closeSheet) : content}</div>
      </SheetContent>
    </Sheet>
  );
}
