import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Layers,
  Wallet,
  ShoppingCart,
  Users,
  GraduationCap,
  LogOut,
  Loader2,
} from "lucide-react";
import type { ReactNode } from "react";

import logo from "@/assets/cufa-z-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";


const nav = [
  { to: "/gestor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/gestor/polos", label: "Polos", icon: Building2 },
  { to: "/gestor/atividades", label: "Atividades", icon: Layers },
  { to: "/gestor/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/gestor/pedidos", label: "Pedidos", icon: ShoppingCart },
  { to: "/gestor/alunos", label: "Alunos", icon: Users },
  { to: "/gestor/professores", label: "Professores", icon: GraduationCap },
] as { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[];

export function GestorShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const pendingTo = useRouterState({
    select: (s) => (s.status === "pending" ? s.location.pathname : null),
  });
  const fetching = useIsFetching();
  const carregando = fetching > 0 || pendingTo !== null;

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-dvh bg-surface">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        {carregando ? (
          <div className="absolute inset-x-0 top-0 h-0.5 overflow-hidden">
            <div className="h-full w-1/3 animate-[slide-in-right_1s_ease-in-out_infinite] bg-brand-gradient" />
          </div>
        ) : null}
        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
          <Link to="/gestor" className="flex min-w-0 items-center gap-2">
            <img src={logo} alt="CUFAZ" className="h-9 w-auto shrink-0 object-contain" />
            <span className="hidden truncate text-xs font-bold uppercase tracking-wide text-primary sm:block">
              Painel do Gestor
            </span>
          </Link>
          <Button size="sm" variant="ghost" className="shrink-0 font-semibold text-destructive" onClick={sair}>
            <LogOut className="mr-1 size-4" /> Sair
          </Button>
        </div>

        <nav className="mx-auto max-w-7xl overflow-x-auto px-2 pb-2">
          <ul className="flex min-w-max gap-1">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              const indo = pendingTo === n.to || (pendingTo !== null && !n.exact && pendingTo.startsWith(n.to));
              return (
                <li key={n.to}>
                  <Link
                    to={n.to as "/gestor"}
                    preload="intent"
                    className={cn(
                      "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                      active || indo
                        ? "bg-brand-gradient text-white shadow-brand"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    {indo ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <n.icon className="size-3.5" />
                    )}
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold sm:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );

}
