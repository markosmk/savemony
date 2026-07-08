import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useDrawerStoreInternal } from "@/stores/drawer/use-drawer-store";

export function DrawerManager() {
  const { isOpen, title, description, content, className, closeDrawer } = useDrawerStoreInternal();

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className={cn("max-h-[90vh]", className)}>
        {(title || description) && (
          <DrawerHeader>
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
        )}
        {!title && <DrawerTitle className="sr-only">Panel inferior</DrawerTitle>}
        {!description && <DrawerDescription className="sr-only">Contenido interactivo inferior</DrawerDescription>}
        <div className="mx-auto w-full max-w-lg overflow-y-auto p-4 pt-0">
          {typeof content === "function" ? content(closeDrawer) : content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
