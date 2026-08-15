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
  Menu,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row relative">
      {/* Centered Circle Loading Spinner Overlay for Page Transitions (Anexo 5) */}
      {carregando ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs">
          <Loader2 className="size-12 animate-spin text-primary" />
          <p className="mt-3 text-sm font-bold text-foreground">Carregando informações...</p>
        </div>
      ) : null}

      {/* Mobile Top Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <Link to="/gestor" className="flex items-center gap-2">
          <img src={logo} alt="CUFA" className="h-8 w-auto object-contain" />
          <span className="text-xs font-black uppercase text-primary">PAINEL DO GESTOR</span>
        </Link>
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setMobileOpen((v) => !v)}
          className="grid size-9 place-items-center rounded-lg border border-border"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Left Vertical Sidebar (Anexo 2) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div>
          {/* Header & Logo */}
          <div className="p-6 border-b border-border/60">
            <Link to="/gestor" className="flex items-center gap-3">
              <img src={logo} alt="CUFA" className="h-10 w-auto object-contain" />
              <div>
                <span className="block text-xs font-black uppercase tracking-wider text-primary">
                  PAINEL DO GESTOR
                </span>
                <span className="block text-[10px] text-muted-foreground font-semibold">
                  Central Única das Favelas
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              const indo = pendingTo === n.to || (pendingTo !== null && !n.exact && pendingTo.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to as "/gestor"}
                  preload="intent"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                    active || indo
                      ? "bg-primary text-white shadow-brand"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {indo ? (
                    <Loader2 className="size-4 animate-spin shrink-0" />
                  ) : (
                    <n.icon className="size-4 shrink-0" />
                  )}
                  <span>{n.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar Profile & Logout */}
        <div className="p-4 border-t border-border/60 space-y-3">
          <div className="rounded-xl bg-muted/40 p-3 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">Gestor Conectado</p>
              <p className="text-[10px] text-muted-foreground truncate">gestor@cufa.com.br</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={sair}
          >
            <LogOut className="mr-2 size-4" /> Sair do Painel
          </Button>
        </div>
      </aside>

      {/* Main Content View */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{title}</h1>
            {description ? (
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground font-medium">{description}</p>
            ) : null}
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
