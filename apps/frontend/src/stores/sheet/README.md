# Global Sheet Manager

Sistema global para renderizar `<Sheet>` (paneles laterales) dinámicos de forma centralizada.

## Instalación

El `<SheetManager />` debe estar en el componente raíz (normalmente `__root.tsx` o `App.tsx`).

```tsx
import { SheetManager } from "@/stores/sheet/sheet-manager";

export function Root() {
  return (
    <>
      <Outlet />
      <SheetManager />
    </>
  );
}
```

## Cómo usarlo

Utiliza el hook `useSheet` para abrir y cerrar paneles laterales.

```tsx
import { useSheet } from "@/stores/sheet/use-sheet-store";
import { TimelineContent } from "@/components/dialogs/timeline-content";

export function PlanHeader({ plan }) {
  const { openSheet, closeSheet } = useSheet();

  const handleOpenTimeline = () => {
    openSheet({
      title: "Historial",
      description: "Actividad reciente de tu ahorro.",
      side: "right", // Opciones: "top", "right", "bottom", "left"
      className: "sm:max-w-md",
      content: <TimelineContent plan={plan} onClose={closeSheet} />
    });
  };

  return <button onClick={handleOpenTimeline}>Ver Historial</button>;
}
```

### Características
- **Auto-limpieza**: El contenido se desmonta automáticamente 300ms después de cerrarse para no consumir memoria.
- **Renderizado por función**: Puedes pasar una función a `content` que recibe `closeSheet` como argumento:
  `content: (close) => <MyComponent onClose={close} />`
- **Sin re-renders**: El uso de `useSheet` no provoca que tu componente se re-renderice cuando el estado del Sheet cambia.
