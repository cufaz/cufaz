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
  UserCheck,
  LogOut,
  Loader2,
  Menu,
  X,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import logo from "@/assets/cufa-z-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AuthLoadingOverlay } from "@/components/site/AuthLoadingOverlay";

const nav = [
  { to: "/gestor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/gestor/polos", label: "Polos", icon: Building2 },
  { to: "/gestor/atividades", label: "Atividades", icon: Layers },
  { to: "/gestor/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/gestor/gestores", label: "Gestores", icon: UserCheck },
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
  void fetching;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingPedidosCount, setPendingPedidosCount] = useState<number>(0);

  useEffect(() => {
    function calcPending() {
      try {
        const stored = localStorage.getItem("cufa_compras_polo");
        if (stored) {
          const list = JSON.parse(stored);
          const pend = list.filter((p: any) => p.status === "pendente").length;
          setPendingPedidosCount(pend);
          return;
        }
      } catch {}
      setPendingPedidosCount(0);
    }

    calcPending();
    window.addEventListener("cufa_pedidos_updated", calcPending);
    window.addEventListener("storage", calcPending);
    return () => {
      window.removeEventListener("cufa_pedidos_updated", calcPending);
      window.removeEventListener("storage", calcPending);
    };
  }, []);

  async function sair() {
    setIsLoggingOut(true);
    await new Promise((r) => setTimeout(r, 650));
    await queryClient.cancelQueries();
    queryClient.clear();
    try {
      localStorage.removeItem("cufa_logged_user");
      localStorage.removeItem("cufa_logged_role");
      localStorage.removeItem("cufa_logged_email");
      localStorage.removeItem("cufa_polo_atribuido");
      localStorage.removeItem("cufa_master_authenticated");
      await supabase.auth.signOut();
    } catch {}
    window.location.href = "/";
  }

  function handleLimparCache() {
    try {
      localStorage.removeItem("cufa_deleted_lancamentos");
      localStorage.removeItem("cufa_lancamentos_custom");
      localStorage.removeItem("cufa_deleted_categorias");
      localStorage.removeItem("cufa_categorias_pedidos");
      localStorage.removeItem("cufa_compras_polo");
      window.dispatchEvent(new Event("cufa_pedidos_updated"));
      window.dispatchEvent(new Event("cufa_categorias_updated"));
      window.dispatchEvent(new Event("storage"));
    } catch {}
    toast.success("Cache limpo! Dados oficiais do sistema restaurados.");
    setTimeout(() => {
      window.location.reload();
    }, 400);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row font-sans">
      <AuthLoadingOverlay open={isLoggingOut} message="Encerrando sessão com segurança..." />

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

      {/* Left Vertical Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 shrink-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div>
          {/* Header & Logo + User Info Directly Below (Anexo 1 & 2) */}
          <div className="p-5 border-b border-border/60 space-y-3">
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

            {/* Profile Card & Sair button directly below logo */}
            <div className="pt-2 border-t border-border/40 space-y-2">
              <div className="rounded-xl bg-muted/50 p-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Gestor Conectado</p>
                  <p className="text-[10px] text-muted-foreground truncate font-medium">gestor@cufa.com.br</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-xs font-bold text-destructive hover:bg-destructive/10 border-destructive/20 h-8"
                onClick={sair}
              >
                <LogOut className="mr-1.5 size-3.5" /> Sair do Painel
              </Button>
            </div>
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
                    "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition-all",
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
                  {n.label === "Pedidos" && pendingPedidosCount > 0 ? (
                    <Badge className="ml-auto bg-amber-500 hover:bg-amber-600 font-extrabold text-[11px] text-white px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      {pendingPedidosCount}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar status info */}
        <div className="p-4 border-t border-border/60">
          <p className="text-[10px] font-bold text-center text-muted-foreground">
            CUFA Sistema de Gestão v2.0
          </p>
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Top Limpar Cache Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLimparCache}
              title="Restaurar dados originais do sistema e limpar cache"
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white font-bold text-xs"
            >
              <RotateCcw className="mr-1.5 size-3.5" /> Limpar Cache
            </Button>
            {actions}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
