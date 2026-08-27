import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getCachedUser, hasRoleCached } from "@/lib/authGuard";

export const Route = createFileRoute("/_authenticated/gestor")({
  ssr: false,
  beforeLoad: async () => {
    let user = null;
    try {
      user = await getCachedUser();
    } catch {}

    if (!user) throw redirect({ to: "/auth", replace: true });

    const isGestor = await hasRoleCached(user.id, "gestor");
    if (!isGestor) throw redirect({ to: "/auth", replace: true });

    return { user };
  },
  component: GestorLayout,
  errorComponent: ({ error }) => (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="text-xl font-bold">Não foi possível carregar o painel</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
});

function GestorLayout() {
  return <Outlet />;
}
