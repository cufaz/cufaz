import { useState, useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardCheck,
  ShoppingCart,
  Image as ImageIcon,
  User,
  LogOut,
  Building2,
  Bell,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import logo from "@/assets/cufa-z-logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AuthLoadingOverlay } from "@/components/site/AuthLoadingOverlay";

interface PoloResponsavelShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PoloResponsavelShell({
  children,
  title,
  description,
  actions,
}: PoloResponsavelShellProps) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleSair() {
    setIsLoggingOut(true);
    await new Promise((r) => setTimeout(r, 5200));
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

  // Active Polo assigned to this Responsável
  const [poloNome] = useState(() => {
    return localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha";
  });

  const [loggedUserEmail] = useState(() => {
    return (localStorage.getItem("cufa_logged_user") || "").toLowerCase();
  });

  function getValidLoggedName(email: string) {
    const clean = email.toLowerCase().trim();
    if (!clean) return "Responsável CUFA";

    try {
      const storedUserPerfil = localStorage.getItem(`cufa_responsavel_perfil_${clean}`);
      if (storedUserPerfil) {
        const p = JSON.parse(storedUserPerfil);
        if (p.nome) return p.nome;
      }

      const nameUser = localStorage.getItem(`cufa_logged_name_${clean}`);
      if (nameUser) return nameUser;

      const storedUsers = localStorage.getItem("cufa_usuarios_cadastrados");
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        if (Array.isArray(users)) {
          const found = users.find((u: any) => String(u.email || "").toLowerCase() === clean);
          if (found && found.nome) return found.nome;
        }
      }

      const storedGlobal = localStorage.getItem("cufa_responsavel_perfil");
      if (storedGlobal) {
        const p = JSON.parse(storedGlobal);
        if (p.email && p.email.toLowerCase() === clean && p.nome) return p.nome;
      }
    } catch {}

    const prefix = clean.split("@")[0] || "Responsável";
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }

  const [responsavelNome, setResponsavelNome] = useState(() => getValidLoggedName(loggedUserEmail));

  function getValidFoto() {
    const email = (localStorage.getItem("cufa_logged_user") || "").toLowerCase();
    if (!email) return "";

    try {
      const fUser = localStorage.getItem(`cufa_perfil_foto_${email}`);
      if (fUser && !fUser.includes("unsplash.com")) return fUser;

      const storedUserPerfil = localStorage.getItem(`cufa_responsavel_perfil_${email}`);
      if (storedUserPerfil) {
        const p = JSON.parse(storedUserPerfil);
        if (p.fotoUrl && !p.fotoUrl.includes("unsplash.com")) return p.fotoUrl;
      }

      const storedPerfil = localStorage.getItem("cufa_responsavel_perfil");
      if (storedPerfil) {
        const p = JSON.parse(storedPerfil);
        if (p.email?.toLowerCase() === email && p.fotoUrl && !p.fotoUrl.includes("unsplash.com")) {
          return p.fotoUrl;
        }
      }
    } catch {}

    return "";
  }

  const [responsavelFoto, setResponsavelFoto] = useState(() => getValidFoto());

  useEffect(() => {
    function syncState() {
      const email = (localStorage.getItem("cufa_logged_user") || "").toLowerCase();
      setResponsavelNome(getValidLoggedName(email));
      setResponsavelFoto(getValidFoto());
    }
    syncState();
    window.addEventListener("cufa_perfil_foto_updated", syncState);
    window.addEventListener("cufa_perfil_updated", syncState);
    window.addEventListener("storage", syncState);
    return () => {
      window.removeEventListener("cufa_perfil_foto_updated", syncState);
      window.removeEventListener("cufa_perfil_updated", syncState);
      window.removeEventListener("storage", syncState);
    };
  }, []);

  const [pendingProfCount, setPendingProfCount] = useState(0);

  // Notification Bell Popover State with localStorage persistence
  const [notifOpen, setNotifOpen] = useState(false);
  const [lidasIds, setLidasIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_notificacoes_lidas");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const [dynamicNotificacoes, setDynamicNotificacoes] = useState<any[]>([]);

  useEffect(() => {
    function loadNotifications() {
      const list: any[] = [];

      // 1. Check pending professor requests
      try {
        const storedProf = localStorage.getItem("cufa_professores_solicitacoes");
        const listProf: any[] = storedProf ? JSON.parse(storedProf) : [];
        const pendingProf = listProf.filter(
          (s: any) =>
            s.status === "pendente" &&
            (s.poloNome?.toLowerCase().includes(poloNome.toLowerCase()) ||
              poloNome.toLowerCase().includes(s.poloNome?.toLowerCase() || ""))
        );

        setPendingProfCount(pendingProf.length);
        pendingProf.forEach((s: any) => {
          list.push({
            id: `notif-prof-${s.id}`,
            titulo: "👨‍🏫 Professor Aguardando Aprovação",
            desc: `${s.professorNome} solicitou vínculo para a atividade ${s.atividadeNome}. Acesse "Atividades do Polo" para aprovar ou recusar.`,
            tempo: "Pendente",
          });
        });
      } catch {}

      // 2. Check approved purchase requests
      try {
        const storedPed = localStorage.getItem("cufa_compras_polo");
        const listPed: any[] = storedPed ? JSON.parse(storedPed) : [];
        const approvedPed = listPed.filter(
          (p: any) =>
            p.status === "aprovado" &&
            (p.polo_nome?.toLowerCase().includes(poloNome.toLowerCase()) ||
              poloNome.toLowerCase().includes(p.polo_nome?.toLowerCase() || ""))
        );

        approvedPed.forEach((p: any) => {
          list.push({
            id: `notif-ped-${p.id}`,
            titulo: "🛒 Pedido de Compra Aprovado",
            desc: `O pedido de "${p.item}" (R$ ${Number(p.valor_total || p.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) foi APROVADO pelo Gestor Geral!`,
            tempo: "Aprovado",
          });
        });
      } catch {}

      // 3. Add base reminders
      list.push(
        {
          id: "n1",
          titulo: "📋 Lembrete de Chamada Diária",
          desc: "Registre a frequência das turmas de hoje para manter os indicadores atualizados.",
          tempo: "Hoje",
        },
        {
          id: "n2",
          titulo: "🎓 Indicadores de Turmas",
          desc: "Acompanhe as matrículas ativas e a ocupação das vagas nas oficinas do polo.",
          tempo: "Ativo",
        }
      );

      setDynamicNotificacoes(list);
    }

    loadNotifications();

    window.addEventListener("cufa_professores_updated", loadNotifications);
    window.addEventListener("cufa_pedidos_updated", loadNotifications);
    window.addEventListener("storage", loadNotifications);
    return () => {
      window.removeEventListener("cufa_professores_updated", loadNotifications);
      window.removeEventListener("cufa_pedidos_updated", loadNotifications);
      window.removeEventListener("storage", loadNotifications);
    };
  }, [poloNome]);

  const notificacoes = dynamicNotificacoes.map((n) => ({
    ...n,
    lida: lidasIds.includes(n.id),
  }));

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  function marcarTodasLidas() {
    const todosIds = dynamicNotificacoes.map((n) => n.id);
    setLidasIds(todosIds);
    try {
      localStorage.setItem("cufa_notificacoes_lidas", JSON.stringify(todosIds));
    } catch {}
    setNotifOpen(false);
  }

  function marcarLida(id: string) {
    if (!lidasIds.includes(id)) {
      const novosIds = [...lidasIds, id];
      setLidasIds(novosIds);
      try {
        localStorage.setItem("cufa_notificacoes_lidas", JSON.stringify(novosIds));
      } catch {}
    }
    setNotifOpen(false);
  }

  const menuItems = [
    {
      to: "/polo",
      label: "Dashboard do Polo",
      icon: LayoutDashboard,
    },
    {
      to: "/polo/atividades",
      label: "Atividades do Polo",
      icon: BookOpen,
    },
    {
      to: "/polo/alunos",
      label: "Alunos Matriculados",
      icon: Users,
    },
    {
      to: "/polo/diario-classe",
      label: "Diário de Classe",
      icon: ClipboardCheck,
    },
    {
      to: "/polo/compras",
      label: "Solicitação de Compras",
      icon: ShoppingCart,
    },
    {
      to: "/polo/galeria",
      label: "Galeria de Fotos",
      icon: ImageIcon,
      disabled: true,
      badge: "Em breve",
    },
    {
      to: "/polo/perfil",
      label: "Configuração de Perfil",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex flex-col font-sans">
      <AuthLoadingOverlay open={isLoggingOut} message="Encerrando sessão com segurança..." />
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/polo" className="flex items-center gap-2">
              <img src={logo} alt="CUFA Logo" className="h-9 w-auto" />
              <div className="hidden sm:block leading-none">
                <span className="block text-xs font-black tracking-wider text-primary uppercase">
                  Painel do Responsável
                </span>
                <span className="text-[11px] font-bold text-muted-foreground">
                  Unidade {poloNome}
                </span>
              </div>
            </Link>

            <Badge
              variant="outline"
              className="hidden md:flex items-center gap-1.5 border-primary/30 bg-primary/10 text-primary font-bold text-xs py-1 px-3"
            >
              <Building2 className="size-3.5" />
              {poloNome}
            </Badge>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Interactive Bell Icon & Notification Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-extrabold text-white">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Popover Card (Fixed for Mobile - Anexo 1) */}
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="size-4 text-primary" />
                        <h4 className="font-extrabold text-sm text-foreground">Notificações do Polo</h4>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={marcarTodasLidas}
                          className="text-[11px] font-bold text-primary hover:underline"
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>

                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {notificacoes.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma notificação por enquanto.</p>
                      ) : (
                        notificacoes.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => marcarLida(n.id)}
                            className={`p-3 rounded-xl border text-xs transition-colors cursor-pointer ${
                              !n.lida
                                ? "bg-primary/5 border-primary/20 text-foreground font-semibold"
                                : "bg-muted/20 border-border text-muted-foreground font-normal"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-foreground">{n.titulo}</span>
                              <span className="text-[10px] opacity-75">{n.tempo}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-90">{n.desc}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-2">
              <Avatar className="size-8 sm:size-9 border border-primary/20">
                <AvatarImage src={responsavelFoto} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {responsavelNome.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left leading-none">
                <span className="block text-xs font-bold text-foreground">{responsavelNome}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{poloNome}</span>
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

            {/* Mobile Hamburger Menu Button (Anexo 1 & 2) */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden size-9 rounded-xl border-border shrink-0 text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir Menu do Polo"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Collapsible Mobile Navigation Drawer (Anexo 1 & 2) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-2 animate-in slide-in-from-top-2">
            <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Menu do Polo — Unidade {poloNome}
            </div>
            {menuItems.map((item) => {
              const isActive =
                item.to === "/polo"
                  ? currentPath === "/polo" || currentPath === "/polo/"
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
        {/* Navigation Sidebar */}
        <aside className="w-64 border-r border-border/80 bg-background flex-col justify-between hidden md:flex shrink-0">
          <div className="p-4 space-y-1">
            <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              Menu do Polo
            </div>
            {menuItems.map((item) => {
              const isActive =
                item.to === "/polo"
                  ? currentPath === "/polo" || currentPath === "/polo/"
                  : currentPath.startsWith(item.to);

              const Icon = item.icon;

              if (item.disabled) {
                return (
                  <div
                    key={item.to}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs opacity-50 cursor-not-allowed text-muted-foreground bg-muted/20 border border-border/40 select-none"
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {item.badge}
                    </span>
                  </div>
                );
              }

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
                  <span className="flex-1">{item.label}</span>
                  {item.to === "/polo/atividades" && pendingProfCount > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-amber-600 text-[10px] font-black text-white shadow-xs animate-pulse">
                      {pendingProfCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-border/80 bg-muted/20">
            <div className="rounded-xl border border-border bg-background p-3 text-xs">
              <div className="font-extrabold text-foreground mb-1 flex items-center gap-1.5">
                <Building2 className="size-3.5 text-primary" /> {poloNome}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Gestão operacional restrita às atividades, alunos e chamadas da sua unidade.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                    {title}
                  </h1>
                  <Badge variant="secondary" className="font-bold text-xs">
                    {poloNome}
                  </Badge>
                </div>
                {description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </div>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>

            {/* Content Body */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
