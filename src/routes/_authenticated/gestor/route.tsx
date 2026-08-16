import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert } from "lucide-react";

import { getMe } from "@/lib/gestao.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/gestor")({
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
  if (typeof window !== "undefined") {
    const loggedUser = (localStorage.getItem("cufa_logged_user") || "").toLowerCase();
    const isMaster = localStorage.getItem("cufa_master_authenticated") === "true";
    const poloAtribuido = localStorage.getItem("cufa_polo_atribuido");

    // If user is Gestor Geral or Master Admin, grant access immediately
    if (
      loggedUser === "gestor@cufa.com.br" ||
      loggedUser === "master@cufa.com.br" ||
      isMaster
    ) {
      return <Outlet />;
    }

    // Check registered gestores list
    try {
      const stored = localStorage.getItem("cufa_gestores_lista");
      const list = stored ? JSON.parse(stored) : [];
      const matched = list.find((g: any) => String(g.email).toLowerCase() === loggedUser);

      if (matched) {
        if (matched.tipo === "geral") return <Outlet />;
        if (matched.tipo === "polo") {
          window.location.href = "/polo";
          return null;
        }
      }
    } catch {}

    // If user has a polo assigned and is NOT gestor geral, redirect to /polo
    if (poloAtribuido && loggedUser && loggedUser !== "gestor@cufa.com.br") {
      window.location.href = "/polo";
      return null;
    }
  }

  const fetchMe = useServerFn(getMe);
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  // Allow access for authenticated gestor or default fallback
  return <Outlet />;
}
