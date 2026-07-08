import type { ReactNode } from "react";
import { create } from "zustand";

interface DrawerOptions {
  title?: string | ReactNode | null;
  description?: string | ReactNode | null;
  content: ReactNode | ((onClose: () => void) => ReactNode) | null;
  /* apply class on DrawerContent */
  className?: string;
}

interface DrawerState extends DrawerOptions {
  isOpen: boolean;
}

interface DrawerStore extends DrawerState {
  openDrawer: (options: DrawerOptions) => void;
  closeDrawer: () => void;
}

let closeTimer: NodeJS.Timeout | null = null;

const useDrawerStoreInternal = create<DrawerStore>((set) => ({
  isOpen: false,
  title: null,
  description: null,
  content: null,
  className: "",

  openDrawer: (options) => {
    if (closeTimer) clearTimeout(closeTimer);
    set({
      isOpen: true,
      title: options.title ?? null,
      description: options.description ?? null,
      content: options.content,
      className: options.className ?? "",
    });
  },
  closeDrawer: () => {
    set({ isOpen: false });

    if (closeTimer) clearTimeout(closeTimer);

    closeTimer = setTimeout(() => {
      set({
        title: null,
        description: null,
        content: null,
        className: "",
      });
      closeTimer = null;
    }, 300);
  },
}));

function useDrawer() {
  const openDrawer = useDrawerStoreInternal((state) => state.openDrawer);
  const closeDrawer = useDrawerStoreInternal((state) => state.closeDrawer);
  return { openDrawer, closeDrawer };
}

export { useDrawer, useDrawerStoreInternal };
