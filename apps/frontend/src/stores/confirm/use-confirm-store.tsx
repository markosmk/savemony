import type { ReactNode } from "react";
import { create } from "zustand";

interface ConfirmOptions {
  title?: string;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  content?: ReactNode | null;
  action?: () => Promise<void>;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolve: ((value: boolean) => void) | null;
}

interface ConfirmStore extends ConfirmState {
  ask: (options: ConfirmOptions) => Promise<boolean>;
  close: (result: boolean) => void;
}

const useConfirmStoreInternal = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  resolve: null,
  title: "¿Estás seguro?",
  message: "Esta acción no se puede deshacer.",
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  content: null,
  action: undefined,

  ask: (options) => {
    return new Promise((resolve) => {
      set({
        ...options,
        content: options.content ?? null,
        isOpen: true,
        resolve,
      });
    });
  },

  close: (result) => {
    const { resolve } = get();
    if (resolve) resolve(result); // response promise (true or false)

    // close modal but keep texts a little while for closing animation
    set({ isOpen: false, resolve: null });
  },
}));

// at not suscribe to `isOpen`, the component that call to `useConfirm()` never re-render
function useConfirm() {
  return useConfirmStoreInternal((state) => state.ask);
}

export { useConfirm, useConfirmStoreInternal };
