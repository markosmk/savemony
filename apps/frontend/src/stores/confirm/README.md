# Global Confirm Manager

Sistema global para manejar diálogos de confirmación, diseñado para mantener tus componentes limpios de estados `isOpen` y flujos de carga (`isPending`).

## Instalación

Coloca el `<ConfirmManager />` en el archivo de diseño raíz (`layout.tsx` o `App.tsx`), típicamente junto a tu `ModalManager`.

## Patrones de Uso

Este sistema soporta dos flujos de trabajo dependiendo de si tu acción requiere comunicarse con el backend (Asíncrona) o si es puramente local (Síncrona).

### Patrón 1: Acciones Asíncronas (Mutaciones / API) - RECOMENDADO
Úsalo cuando vas a modificar la base de datos. El Modal **no se cerrará** automáticamente; mostrará un spinner de carga, evitará clics duplicados y mostrará los errores del servidor si la petición falla.

\`\`\`tsx
import { useConfirm } from "@/stores/confirm/use-confirm-store";
import { useDeleteProduct } from "@/hooks/use-products";

export function ProductList() {
  const confirm = useConfirm();
  const deleteProduct = useDeleteProduct();

  const handleDelete = (id: string) => {
    confirm({
      title: "¿Eliminar producto?",
      message: "Esta acción es irreversible.",
      confirmText: "Eliminar",
      // Pasamos la función asíncrona directamente en "action"
      action: async () => {
        await deleteProduct.mutateAsync(id);
        toast.success("Producto eliminado");
      }
    });
  };

  return <button onClick={() => handleDelete('123')}>Eliminar</button>;
}
\`\`\`

### Patrón 2: Acciones Síncronas (Estado Local / Navegación)
Úsalo cuando solo necesitas una respuesta de "Sí/No" para ejecutar código inmediato (limpiar un formulario, navegar a otra ruta).

\`\`\`tsx
import { useConfirm } from "@/stores/confirm/use-confirm-store";
import { useRouter } from "next/navigation";

export function Form() {
  const confirm = useConfirm();
  const router = useRouter();

  const handleCancel = async () => {
    // Usamos el hook como una Promesa que pausa la ejecución
    const isConfirmed = await confirm({
      title: "¿Salir sin guardar?",
      message: "Perderás todos los cambios ingresados.",
      confirmText: "Salir"
    });

    if (isConfirmed) {
      router.push("/dashboard");
    }
  };

  return <button onClick={handleCancel}>Cancelar</button>;
}
\`\`\`

## Características
* **Seguridad contra doble clic:** El botón de confirmar se deshabilita mientras `action` se está resolviendo.
* **Manejo de Errores Integrado:** Si `action` arroja un error (`throw new Error(...)`), el modal lo atrapa y lo muestra en rojo bajo la descripción.
* **Cero Re-renders:** Extraer el hook `useConfirm()` no causa re-renderizados en tu componente cuando el diálogo se abre o cierra.