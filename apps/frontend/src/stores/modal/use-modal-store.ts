import type { ReactNode } from "react";
import { create } from "zustand";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";

interface ModalOptions {
  title?: string | ReactNode | null;
  description?: string | ReactNode | null;
  content: ReactNode | ((onClose: () => void) => ReactNode) | null;
  size?: ModalSize;
  /* apply class on Dialog */
  className?: string;
}

interface ModalState extends ModalOptions {
  isOpen: boolean;
}

interface ModalStore extends ModalState {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
}

let closeTimer: NodeJS.Timeout | null = null;

const useModalStoreInternal = create<ModalStore>((set) => ({
  isOpen: false,
  title: null,
  description: null,
  content: null,
  size: "md",
  className: "",

  openModal: (options) => {
    //  clear old timers if user double click fast
    if (closeTimer) clearTimeout(closeTimer);
    // load all heavy content in memory first
    set({
      isOpen: true,
      title: options.title ?? null,
      description: options.description ?? null,
      content: options.content,
      size: options.size ?? "md",
      className: options.className ?? "",
    });
  },
  closeModal: () => {
    set({ isOpen: false });

    // clean old timers
    if (closeTimer) clearTimeout(closeTimer);

    closeTimer = setTimeout(() => {
      set({
        title: null,
        description: null,
        content: null,
        size: "md",
        className: "",
      });
      closeTimer = null;
    }, 300);
  },
}));

function useModal() {
  const openModal = useModalStoreInternal((state) => state.openModal);
  const closeModal = useModalStoreInternal((state) => state.closeModal);
  // By not subscribing to 'isOpen', the component that calls useModal() NEVER re-renders.
  return { openModal, closeModal };
}

export { useModal, useModalStoreInternal };
