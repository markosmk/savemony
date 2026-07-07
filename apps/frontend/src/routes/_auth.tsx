import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authService } from "@/services/auth.hooks";

export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context }) => {
    // if session exists, redirect to panel
    let session = context.queryClient.getQueryData(["auth", "session"]);

    if (!session) {
      session = await context.queryClient.fetchQuery({
        queryKey: ["auth", "session"],
        queryFn: authService.getSession,
        staleTime: Infinity,
      });
    }

    if (session) {
      throw redirect({ to: "/panel" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Outlet />
    </div>
  );
}
