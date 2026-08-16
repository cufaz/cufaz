import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const localUser = localStorage.getItem("cufa_logged_user");
      if (localUser) {
        return { user: { id: "local-user", email: localUser } };
      }
    }

    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) return { user: data.user };
    } catch {}

    throw redirect({ to: "/auth" });
  },
  component: () => <Outlet />,
});
