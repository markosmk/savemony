import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";

import { authService, useAuth } from "@/services/auth.hooks";

export const Route = createFileRoute("/_private")({
  beforeLoad: async ({ context }) => {
    // look if session exists
    let session = context.queryClient.getQueryData(["auth", "session"]);

    // if not, fetch it once (its saved in cache)
    if (!session) {
      session = await context.queryClient.fetchQuery({
        queryKey: ["auth", "session"],
        queryFn: authService.getSession,
        staleTime: Infinity,
      });
    }

    // if session doesn't exist, redirect to login
    if (!session) {
      throw redirect({ to: "/login" });
    }
  },
  component: PrivateLayout,
});

function PrivateLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="p-5">
      <nav className="flex items-center gap-4 mb-5 pb-2 border-b border-gray-300">
        <Link to="/panel">Panel</Link>
        <Link to="/plans">Planes</Link>
        <Link to="/challenges">Retos</Link>
        <Link to="/achievements">Logros</Link>
        <Link to="/settings">Configuración</Link>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <span>{user?.email}</span>
          <button type="button" onClick={() => signOut.mutate()} disabled={signOut.isPending}>
            {signOut.isPending ? "Saliendo..." : "Cerrar sesión"}
          </button>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
