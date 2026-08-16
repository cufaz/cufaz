import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  CalendarCheck,
  Compass,
  User,
  LogOut,
  Sparkles,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface AlunoShellProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AlunoShell({ children, title, description }: AlunoShellProps) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [alunoNome, setAlunoNome] = useState("Aluno CUFA");
  const [alunoEmail, setAlunoEmail] = useState("aluno@cufa.com.br");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  function loadProfile() {
    const userEmail = localStorage.getItem("cufa_logged_user") || "aluno@cufa.com.br";
    setAlunoEmail(userEmail);

    const customNome = localStorage.getItem("cufa_aluno_nome");
    if (customNome) {
      setAlunoNome(customNome);
    } else {
      try {
        const stored = localStorage.getItem("cufa_alunos_cadastrados");
        if (stored) {
          const parsed = JSON.parse(stored);
          const found = parsed.find((a: any) => String(a.email || "").toLowerCase() === userEmail.toLowerCase());
          if (found && found.nome) {
            setAlunoNome(found.nome);
          }
        }
      } catch {}
    }

    const fUser = localStorage.getItem(`cufa_perfil_foto_${userEmail}`) || localStorage.getItem("cufa_perfil_foto");
    setFotoPerfil(fUser || null);
  }

  useEffect(() => {
    loadProfile();
    window.addEventListener("cufa_perfil_foto_updated", loadProfile);
    window.addEventListener("cufa_alunos_updated", loadProfile);
    return () => {
      window.removeEventListener("cufa_perfil_foto_updated", loadProfile);
      window.removeEventListener("cufa_alunos_updated", loadProfile);
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("cufa_logged_user");
    localStorage.removeItem("cufa_logged_role");
    window.location.href = "/";
  }

  const navItems = [
    { label: "Dashboard", href: "/aluno", icon: LayoutDashboard },
    { label: "Minhas Atividades", href: "/aluno/minhas-atividades", icon: BookOpen },
    { label: "Atividades", href: "/aluno/atividades", icon: Compass },
    { label: "Minha Frequência", href: "/aluno/frequencia", icon: CalendarCheck },
    { label: "Meu Perfil", href: "/aluno/perfil", icon: User },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground">
      {/* Top Navigation Header (Menu no Topo) */}
      <header className="sticky top-0 z-40 bg-card border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="size-9 rounded-xl bg-brand-gradient flex items-center justify-center text-white font-black shadow-brand">
                <Sparkles className="size-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-primary block leading-none">PAINEL DO ALUNO</span>
                <span className="text-sm font-black text-foreground">Central CUFA</span>
              </div>
            </div>

            {/* Desktop Menu Navigation Links (Horizontal no topo) */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== "/aluno" && location.pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Badge & Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/80">
                <Avatar className="size-8 border border-primary/30 shadow-xs">
                  {fotoPerfil && <AvatarImage src={fotoPerfil} alt={alunoNome} className="object-cover" />}
                  <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                    {alunoNome.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-xs font-extrabold text-foreground leading-tight">{alunoNome}</p>
                  <p className="text-[9px] text-muted-foreground font-semibold">Aluno Ativo</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden md:inline-flex text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 h-8"
              >
                <LogOut className="size-3.5 mr-1" /> Sair
              </Button>

              {/* Mobile Menu Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden size-9 p-0 rounded-xl"
              >
                {mobileMenuOpen ? <X className="size-5 text-foreground" /> : <Menu className="size-5 text-foreground" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-muted/40 mb-2">
              <Avatar className="size-9 border border-primary/30">
                {fotoPerfil && <AvatarImage src={fotoPerfil} alt={alunoNome} className="object-cover" />}
                <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                  {alunoNome.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-extrabold text-foreground">{alunoNome}</p>
                <p className="text-[10px] text-muted-foreground">{alunoEmail}</p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== "/aluno" && location.pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-border mt-2">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 h-9"
              >
                <LogOut className="size-4 mr-2" /> Sair da Conta
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{title}</h1>
          {description && <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
