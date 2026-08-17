import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/gestor")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const localUser = localStorage.getItem("cufa_logged_user");
      if (localUser) {
        return { user: { id: "local-gestor", email: localUser } };
      }
    }

    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch {}

    throw redirect({ to: "/auth", replace: true });
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
