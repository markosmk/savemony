import type { ReactNode } from "react";
import { create } from "zustand";

export type SheetSide = "top" | "right" | "bottom" | "left";

interface SheetOptions {
  title?: string | ReactNode | null;
  description?: string | ReactNode | null;
  content: ReactNode | ((onClose: () => void) => ReactNode) | null;
  side?: SheetSide;
  /* apply class on SheetContent */
  className?: string;
}

interface SheetState extends SheetOptions {
  isOpen: boolean;
}

interface SheetStore extends SheetState {
  openSheet: (options: SheetOptions) => void;
  closeSheet: () => void;
}

let closeTimer: NodeJS.Timeout | null = null;

const useSheetStoreInternal = create<SheetStore>((set) => ({
  isOpen: false,
  title: null,
  description: null,
  content: null,
  side: "right",
  className: "",

  openSheet: (options) => {
    if (closeTimer) clearTimeout(closeTimer);
    set({
      isOpen: true,
      title: options.title ?? null,
      description: options.description ?? null,
      content: options.content,
      side: options.side ?? "right",
      className: options.className ?? "",
    });
  },
  closeSheet: () => {
    set({ isOpen: false });

    if (closeTimer) clearTimeout(closeTimer);

    closeTimer = setTimeout(() => {
      set({
        title: null,
        description: null,
        content: null,
        side: "right",
        className: "",
      });
      closeTimer = null;
    }, 300);
  },
}));

function useSheet() {
  const openSheet = useSheetStoreInternal((state) => state.openSheet);
  const closeSheet = useSheetStoreInternal((state) => state.closeSheet);
  return { openSheet, closeSheet };
}

export { useSheet, useSheetStoreInternal };
