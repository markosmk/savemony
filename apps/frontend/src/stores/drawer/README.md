# Global Drawer Manager

Sistema global para renderizar `<Drawer>` (paneles inferiores / bottom sheets) dinámicos, ideal para experiencias móviles.

## Instalación

El `<DrawerManager />` debe estar en el componente raíz (normalmente `__root.tsx`).

```tsx
import { DrawerManager } from "@/stores/drawer/drawer-manager";

export function Root() {
  return (
    <>
      <Outlet />
      <DrawerManager />
    </>
  );
}
```

## Cómo usarlo

Utiliza el hook `useDrawer` para controlar los paneles inferiores.

```tsx
import { useDrawer } from "@/stores/drawer/use-drawer-store";

export function TransactionAction() {
  const { openDrawer, closeDrawer } = useDrawer();

  const handleAction = () => {
    openDrawer({
      title: "Confirmar Retiro",
      description: "Esta acción no se puede deshacer.",
      content: (close) => (
        <div className="p-4">
          <p>¿Estás seguro de que quieres retirar tus fondos?</p>
          <Button onClick={close}>Confirmar</Button>
        </div>
      )
    });
  };

  return <button onClick={handleAction}>Retirar</button>;
}
```

### Características
- **Optimizado para móvil**: Utiliza `vaul` para una experiencia táctil fluida.
- **Auto-limpieza**: Al igual que los otros managers, limpia el estado interno después de la animación de cierre.
- **Acceso global**: Abre drawers desde cualquier parte de la aplicación sin props drilling.
