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
  const navigate = useNavigate();

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
      // Find in cufa_alunos_cadastrados
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
    <div className="min-h-screen bg-background flex flex-col md:flex-row text-foreground">
      {/* Sidebar Desktop */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col justify-between shrink-0 p-4">
        <div className="space-y-6">
          {/* Header Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="size-10 rounded-2xl bg-brand-gradient flex items-center justify-center text-white font-black shadow-brand">
              <Sparkles className="size-5" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-primary block">PAINEL DO ALUNO</span>
              <span className="text-sm font-extrabold text-foreground">Central CUFA</span>
            </div>
          </div>

          {/* User Card info */}
          <div className="p-3 rounded-2xl bg-muted/50 border border-border/80 flex items-center gap-3">
            <Avatar className="size-10 border border-primary/40 shadow-xs">
              {fotoPerfil && <AvatarImage src={fotoPerfil} alt={alunoNome} className="object-cover" />}
              <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                {alunoNome.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-foreground truncate">{alunoNome}</p>
              <p className="text-[10px] text-muted-foreground truncate">{alunoEmail}</p>
              <Badge variant="outline" className="mt-1 text-[9px] h-4 font-bold border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
                Aluno Ativo
              </Badge>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== "/aluno" && location.pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className={`size-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10"
          >
            <LogOut className="size-4 mr-2" /> Sair da Conta
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 md:p-8 space-y-6 overflow-y-auto">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">{title}</h1>
          {description && <p className="text-xs md:text-sm text-muted-foreground mt-1 font-medium">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
