import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/gestor")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      localStorage.removeItem("cufa_logged_user");
      localStorage.removeItem("cufa_master_authenticated");
      throw redirect({ to: "/auth", replace: true });
    }
    return { user: data.user };
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
