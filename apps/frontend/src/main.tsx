import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { Toaster } from "./components/ui/sonner";
import { queryClient } from "./lib/query-client";
import { routeTree } from "./routeTree.gen";

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  // Since we're using React Query, we don't want loader calls to ever be stale
  // This will ensure that the loader is always called when the route is preloaded or visited
  // defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("app");
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors />
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}
