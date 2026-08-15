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
  const fetchMe = useServerFn(getMe);
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe({}) });

  if (isLoading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.roles.includes("gestor")) {
    return (
      <div className="grid min-h-dvh place-items-center px-4">
        <div className="max-w-sm text-center">
          <ShieldAlert className="mx-auto size-10 text-primary" />
          <h1 className="mt-3 text-xl font-bold">Área restrita ao gestor</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta não possui permissão de gestor da plataforma CUFAZ.
          </p>
          <Button asChild className="mt-5 bg-brand-gradient font-bold text-white">
            <Link to="/">Voltar ao site</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
