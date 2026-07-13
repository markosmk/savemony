// import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
// import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import "../styles.css";
import type { QueryClient } from "@tanstack/react-query";

import { ScrollToTop } from "@/components/shared/scroll-to-top";
import { ConfirmManager } from "@/stores/confirm/confirm-manager";
import { DrawerManager } from "@/stores/drawer/drawer-manager";
import { ModalManager } from "@/stores/modal/modal-manager";
import { SheetManager } from "@/stores/sheet/sheet-manager";

interface RouterContext {
  queryClient: QueryClient;
}
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <Outlet />
      {/* <TanStackRouterDevtoolsPanel /> */}
      <ModalManager />
      <SheetManager />
      <DrawerManager />
      <ConfirmManager />
      <ScrollToTop />
    </>
  );
}
