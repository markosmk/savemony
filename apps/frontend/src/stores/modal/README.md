# Global Modal Manager

Sistema global para renderizar `<Dialog>` dinámicos sin ensuciar el árbol de componentes. 

**Arquitectura:** Usamos el patrón de "Smart Wrappers" (Controladores) inyectados dentro de "Dumb Components" (Vistas).

## Instalación

Coloca el `<ModalManager />` en el archivo de diseño raíz (`layout.tsx` o `App.tsx`).

\`\`\`tsx
import { ModalManager } from "@/stores/modal/modal-manager";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ModalManager />
      </body>
    </html>
  );
}
\`\`\`

## Cómo usarlo

El hook `useModal` te da acceso a los controles. Al no estar suscrito al estado `isOpen`, invocar este hook **no causa re-renderizados** en tus componentes.

\`\`\`tsx
import { useModal } from "@/stores/modal/use-modal-store";
import { IngredientDialogContent } from "../dialogs/IngredientDialogContent";

export function IngredientList() {
  const { openModal, closeModal } = useModal();

  const handleCreate = () => {
    openModal({
      title: "Crear Ingrediente",
      description: "Añade un nuevo ingrediente para tus recetas.",
      // Le pasamos closeModal para que el contenido pueda cerrarse a sí mismo
      content: <IngredientDialogContent onClose={closeModal} />
    });
  };

  return <button onClick={handleCreate}>Nuevo Ingrediente</button>;
}
\`\`\`

### Cierre Automático tras Guardar

En tu componente Wrapper (`IngredientDialogContent`), simplemente invocas la función `onClose` cuando tu mutación es exitosa:

\`\`\`tsx
export function IngredientDialogContent({ onClose }) {
  const mutation = useCreateIngredient();

  const handleSave = async (data) => {
    await mutation.mutateAsync(data);
    onClose(); // El modal se cierra tras guardar correctamente
  };

  return <IngredientForm onSubmit={handleSave} onCancel={onClose} />;
}
\`\`\`