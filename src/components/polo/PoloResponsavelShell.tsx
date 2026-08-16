import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
import logo from "@/assets/cufa-z-logo.png";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Active Polo assigned to this Responsável
  const [poloNome] = useState(() => {
    return localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha";
  });

  const [responsavelNome, setResponsavelNome] = useState(() => {
    try {
      const stored = localStorage.getItem("cufa_responsavel_perfil");
      if (stored) return JSON.parse(stored).nome;
    } catch {}
    return "Ricardo Brito";
  });

  const [responsavelFoto, setResponsavelFoto] = useState(() => {
    return localStorage.getItem("cufa_perfil_foto") || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";
  });

  // Notification Bell Popover State
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState([
    {
      id: "n1",
      titulo: "Nova Matrícula no Polo",
      desc: "Nova inscrição registrada para a turma do turno da tarde.",
      tempo: "Há 15 minutos",
      lida: false,
    },
    {
      id: "n2",
      titulo: "Lembrete de Chamada Diária",
      desc: "Registre a frequência das turmas de hoje para manter os indicadores atualizados.",
      tempo: "Há 1 hora",
      lida: false,
    },
    {
      id: "n3",
      titulo: "Atualização de Solicitação",
      desc: "Pedido de materiais e compras encaminhado para validação.",
      tempo: "Há 3 horas",
      lida: true,
    },
  ]);

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  function marcarTodasLidas() {
    setNotificacoes(notificacoes.map((n) => ({ ...n, lida: true })));
  }

  function marcarLida(id: string) {
    setNotificacoes(notificacoes.map((n) => (n.id === id ? { ...n, lida: true } : n)));
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
      to: "/polo/chamada",
      label: "Chamada / Frequência",
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
    },
    {
      to: "/polo/perfil",
      label: "Configuração de Perfil",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex flex-col font-sans">
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

          <div className="flex items-center gap-3 relative">
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

              {/* Notification Popover Card */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
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
              )}
            </div>

            <div className="h-6 w-px bg-border hidden sm:block" />

            <div className="flex items-center gap-2">
              <Avatar className="size-9 border border-primary/20">
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
              className="text-xs font-bold text-destructive hover:bg-destructive/10"
              onClick={() => {
                localStorage.removeItem("cufa_polo_atribuido");
                window.location.href = "/";
              }}
            >
              <LogOut className="size-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
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
