import { useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import logo from "@/assets/cufa-z-logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AuthLoadingOverlay } from "@/components/site/AuthLoadingOverlay";

interface ProfessorShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function ProfessorShell({
  children,
  title,
  description,
  actions,
}: ProfessorShellProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profNome, setProfNome] = useState(() => {
    return localStorage.getItem("cufa_professor_nome") || "Prof.ª Santana Silva";
  });

  const [profPolo] = useState(() => {
    return localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha";
  });

  const [profFoto, setProfFoto] = useState<string>(() => {
    const email = (localStorage.getItem("cufa_logged_user") || "").toLowerCase();
    const fUser = localStorage.getItem(`cufa_perfil_foto_${email}`);
    if (fUser && !fUser.includes("unsplash.com")) return fUser;
    const fGlobal = localStorage.getItem("cufa_perfil_foto");
    if (fGlobal && !fGlobal.includes("unsplash.com")) return fGlobal;
    return "";
  });

  useEffect(() => {
    function loadProfState() {
      const email = (localStorage.getItem("cufa_logged_user") || "").toLowerCase();
      const fUser = localStorage.getItem(`cufa_perfil_foto_${email}`);
      const fGlobal = localStorage.getItem("cufa_perfil_foto");
      setProfFoto((fUser && !fUser.includes("unsplash.com")) ? fUser : ((fGlobal && !fGlobal.includes("unsplash.com")) ? fGlobal : ""));

      const savedName = localStorage.getItem("cufa_professor_nome");
      if (savedName) setProfNome(savedName);
    }

    loadProfState();
    window.addEventListener("cufa_perfil_foto_updated", loadProfState);
    return () => {
      window.removeEventListener("cufa_perfil_foto_updated", loadProfState);
    };
  }, []);

  const [notifOpen, setNotifOpen] = useState(false);

  async function handleSair() {
    setIsLoggingOut(true);
    await new Promise((r) => setTimeout(r, 5200));
    try {
      localStorage.removeItem("cufa_logged_user");
      localStorage.removeItem("cufa_logged_role");
      localStorage.removeItem("cufa_logged_email");
      await supabase.auth.signOut();
    } catch {}
    window.location.href = "/";
  }

  const menuItems = [
    {
      to: "/professor",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      to: "/professor/atividades",
      label: "Minhas Atividades",
      icon: BookOpen,
    },
    {
      to: "/professor/chamada",
      label: "Chamada / Frequência",
      icon: ClipboardCheck,
    },
    {
      to: "/professor/perfil",
      label: "Meu Perfil",
      icon: User,
    },
    {
      to: "/professor/oportunidades",
      label: "Vagas para Ministrar",
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex flex-col font-sans">
      <AuthLoadingOverlay open={isLoggingOut} message="Encerrando sessão do professor..." />

      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/professor" className="flex items-center gap-2">
              <img src={logo} alt="CUFA Logo" className="h-9 w-auto" />
              <div className="hidden sm:block leading-none">
                <span className="block text-xs font-black tracking-wider text-primary uppercase">
                  Painel do Instrutor / Professor
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">
                  {profPolo}
                </span>
              </div>
            </Link>

            <Badge
              variant="outline"
              className="hidden md:flex items-center gap-1.5 border-primary/30 bg-primary/10 text-primary font-bold text-xs py-1 px-3"
            >
              <GraduationCap className="size-3.5" />
              Professor
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Bell Icon */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="size-5" />
              </Button>

              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 rounded-2xl border border-border bg-card p-4 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="flex items-center gap-2 border-b border-border pb-3 mb-3">
                      <Bell className="size-4 text-primary" />
                      <h4 className="font-extrabold text-sm text-foreground">Notificações</h4>
                    </div>
                    <p className="text-xs text-muted-foreground text-center py-3">
                      Nenhuma nova notificação por enquanto.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-2">
              <Avatar className="size-8 sm:size-9 border border-primary/20">
                <AvatarImage src={profFoto} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {profNome.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-none">
                <span className="block text-xs font-bold text-foreground">{profNome}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{profPolo}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-destructive hover:bg-destructive/10 hidden sm:flex"
              onClick={handleSair}
            >
              <LogOut className="size-4 mr-1" /> Sair
            </Button>

            {/* Mobile Hamburger Menu Button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden size-9 rounded-xl border-border shrink-0 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Collapsible Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-2 animate-in slide-in-from-top-2">
            <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Menu do Professor — Unidade {profPolo}
            </div>
            {menuItems.map((item) => {
              const isActive =
                item.to === "/professor"
                  ? currentPath === "/professor" || currentPath === "/professor/"
                  : currentPath.startsWith(item.to);

              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? "bg-brand-gradient text-white shadow-brand"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="pt-2 border-t border-border mt-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-xs font-bold text-destructive hover:bg-destructive/10"
                onClick={handleSair}
              >
                <LogOut className="size-4 mr-2" /> Sair do Painel
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="w-64 border-r border-border/80 bg-background/50 backdrop-blur-sm hidden md:flex flex-col justify-between p-4 shrink-0">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Navegação do Professor
            </div>
            {menuItems.map((item) => {
              const isActive =
                item.to === "/professor"
                  ? currentPath === "/professor" || currentPath === "/professor/"
                  : currentPath.startsWith(item.to);

              const Icon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? "bg-brand-gradient text-white shadow-brand"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-3 bg-muted/30 border border-border rounded-xl">
            <span className="text-[11px] font-extrabold text-foreground block">Professor Ativo</span>
            <span className="text-[10px] text-muted-foreground block">{profNome}</span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">{title}</h1>
              {description && (
                <p className="text-xs text-muted-foreground font-medium mt-1">{description}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
