import { useState, useEffect } from "react";
import { Crown, Lock, ShieldCheck, Users, GraduationCap, UserCheck, Key, Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/cufa-z-logo.png";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteAlunoCadastro,
  deleteProfessorCadastro,
  fetchAlunosCadastro,
  fetchProfessoresCadastro,
} from "@/lib/cadastros";

export function MasterAdminDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<"gestores" | "alunos" | "professores">("gestores");

  const [gestoresData, setGestoresData] = useState<any[]>(() => [
    { id: "g1", nome: "Gestor Geral CUFA", email: "gestor@cufa.com.br", senha: "gestao26", polo: "Todos", status: "Ativo" },
  ]);


  useEffect(() => {
    function syncMasterGestores() {
      try {
        const stored = localStorage.getItem("cufa_gestores_lista");
        if (stored) {
          const parsed = JSON.parse(stored);
          setGestoresData(
            parsed.map((g: any) => ({
              id: g.id,
              nome: g.nome,
              email: g.email,
              senha: g.senha,
              polo: g.poloNome,
              status: g.ativo ? "Ativo" : "Inativo",
            }))
          );
        }
      } catch {}
    }

    async function syncMasterProfessores() {
      try {
        const list = await fetchProfessoresCadastro();
        setProfessoresData(list.map((p) => ({
          id: p.id || p.email,
          nome: p.nome,
          email: p.email,
          senha: "Protegida",
          disciplina: p.modalidade || "—",
          polo: p.polo_nome || "—",
        })));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar os professores.");
      }
    }

    async function syncMasterAlunos() {
      try {
        const list = await fetchAlunosCadastro();
        setAlunosData(list.map((a) => ({
          id: a.id || a.email,
          nome: a.nome,
          email: a.email,
          senha: "Protegida",
          polo: a.polo_nome || "—",
          atividade: "—",
        })));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Não foi possível carregar os alunos.");
      }
    }

    // Hidratação inicial no cliente (evita ler localStorage durante o SSR)
    setAuthenticated(localStorage.getItem("cufa_master_authenticated") === "true");
    syncMasterGestores();
    syncMasterProfessores();
    syncMasterAlunos();

    window.addEventListener("cufa_gestores_updated", syncMasterGestores);
    window.addEventListener("cufa_professores_updated", syncMasterProfessores);
    window.addEventListener("cufa_alunos_updated", syncMasterAlunos);
    window.addEventListener("storage", syncMasterProfessores);
    window.addEventListener("storage", syncMasterAlunos);
    const channel = supabase
      .channel("master-cadastros-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "cadastros_alunos" }, syncMasterAlunos)
      .on("postgres_changes", { event: "*", schema: "public", table: "cadastros_professores" }, syncMasterProfessores)
      .subscribe();

    return () => {
      window.removeEventListener("cufa_gestores_updated", syncMasterGestores);
      window.removeEventListener("cufa_professores_updated", syncMasterProfessores);
      window.removeEventListener("cufa_alunos_updated", syncMasterAlunos);
      window.removeEventListener("storage", syncMasterProfessores);
      window.removeEventListener("storage", syncMasterAlunos);
      void supabase.removeChannel(channel);
    };
  }, []);

  function loadMasterAlunos() {
    const listMap = new Map<string, any>();
    try {
      const storedCad = localStorage.getItem("cufa_alunos_cadastrados");
      if (storedCad) {
        const parsed = JSON.parse(storedCad);
        if (Array.isArray(parsed)) {
          parsed.forEach((a: any, idx: number) => {
            const id = a.id || `cad-${idx}`;
            listMap.set(id, {
              id,
              nome: a.nome || "Aluno",
              email: a.email || "aluno@cufa.com.br",
              senha: a.senha || "aluno2026",
              polo: a.polo_nome || a.polo || "Complexo da Penha",
              atividade: a.atividade || a.oficina || "Geral",
            });
          });
        }
      }

      const storedPolo = localStorage.getItem("cufa_alunos_polo");
      if (storedPolo) {
        const parsed = JSON.parse(storedPolo);
        if (Array.isArray(parsed)) {
          parsed.forEach((a: any, idx: number) => {
            const id = a.id || `polo-al-${idx}`;
            if (!listMap.has(id)) {
              listMap.set(id, {
                id,
                nome: a.nome || "Aluno",
                email: a.email || "aluno@cufa.com.br",
                senha: a.senha || "aluno2026",
                polo: a.polo_nome || a.polo || "Complexo da Penha",
                atividade: a.atividade || a.oficina || "Geral",
              });
            }
          });
        }
      }
    } catch {}

    if (listMap.size === 0) {
      const defaultAlunos = [
        {
          id: "cad-enzo",
          nome: "Enzo Junior",
          email: "enzo.junior@cufa.org.br",
          senha: "enzo2026",
          polo: "Complexo da Penha",
          atividade: "Jiu Jitsu",
        },
        {
          id: "cad-robson",
          nome: "Robson Nunes",
          email: "robson.nunes@cufa.org.br",
          senha: "robson2026",
          polo: "Complexo da Penha",
          atividade: "Jiu Jitsu",
        },
        {
          id: "cad-beatriz",
          nome: "Beatriz Santos",
          email: "beatriz.santos@cufa.org.br",
          senha: "beatriz2026",
          polo: "Viaduto de Madureira",
          atividade: "Corte e Costura",
        },
        {
          id: "cad-lucas",
          nome: "Lucas Oliveira",
          email: "lucas.oliveira@cufa.org.br",
          senha: "lucas2026",
          polo: "Paraisópolis",
          atividade: "Karatê",
        },
      ];
      defaultAlunos.forEach((a) => listMap.set(a.id, a));
      localStorage.setItem("cufa_alunos_cadastrados", JSON.stringify(defaultAlunos));
    }

    return Array.from(listMap.values());
  }

  function loadMasterProfessores() {
    const listMap = new Map<string, any>();
    const isFakeProf = (emailStr: string, nameStr: string) => {
      const e = (emailStr || "").toLowerCase();
      const n = (nameStr || "").toLowerCase();
      return (
        e.includes("marcos") ||
        e.includes("patricia") ||
        n.includes("marcos") ||
        n.includes("patricia")
      );
    };

    try {
      const storedSol = localStorage.getItem("cufa_professores_solicitacoes");
      if (storedSol) {
        const list = JSON.parse(storedSol);
        if (Array.isArray(list)) {
          list.forEach((p: any) => {
            const email = p.email || `${(p.professorNome || p.nome || "prof").toLowerCase().replace(/[^a-z0-9]/g, "")}@cufa.com.br`;
            const name = p.professorNome || p.nome || "Professor";
            if (!isFakeProf(email, name)) {
              const id = p.id || `prof-${email}`;
              listMap.set(id, {
                id,
                nome: name,
                email,
                senha: p.senha || "prof2026",
                disciplina: p.atividadeNome || p.disciplina || "Sem disciplina",
                polo: p.poloNome || p.polo || "Complexo da Penha",
              });
            }
          });
        }
      }

      const storedCad = localStorage.getItem("cufa_professores_cadastrados");
      if (storedCad) {
        const list = JSON.parse(storedCad);
        if (Array.isArray(list)) {
          list.forEach((p: any) => {
            const email = p.email || `${(p.professorNome || p.nome || "prof").toLowerCase().replace(/[^a-z0-9]/g, "")}@cufa.com.br`;
            const name = p.professorNome || p.nome || "Professor";
            if (!isFakeProf(email, name)) {
              const id = p.id || `prof-cad-${email}`;
              if (!listMap.has(id)) {
                listMap.set(id, {
                  id,
                  nome: name,
                  email,
                  senha: p.senha || "prof2026",
                  disciplina: p.atividadeNome || p.disciplina || "Sem disciplina",
                  polo: p.poloNome || p.polo || "Complexo da Penha",
                });
              }
            }
          });
        }
      }
    } catch {}

    if (listMap.size === 0) {
      const defaultProfs = [
        {
          id: "prof-santana",
          professorNome: "Prof.ª Santana Silva",
          nome: "Prof.ª Santana Silva",
          email: "santana@cufa.com.br",
          senha: "santana2026",
          atividadeNome: "Jiu Jitsu",
          disciplina: "Jiu Jitsu",
          poloNome: "Complexo da Penha",
          polo: "Complexo da Penha",
        },
        {
          id: "prof-anapaula",
          professorNome: "Prof.ª Ana Paula Silva",
          nome: "Prof.ª Ana Paula Silva",
          email: "anapaula@cufa.com.br",
          senha: "prof2026",
          atividadeNome: "Corte e Costura",
          disciplina: "Corte e Costura",
          poloNome: "Viaduto de Madureira",
          polo: "Viaduto de Madureira",
        },
        {
          id: "prof-carlos",
          professorNome: "Prof. Carlos Eduardo",
          nome: "Prof. Carlos Eduardo",
          email: "carlos@cufa.com.br",
          senha: "prof2026",
          atividadeNome: "Karatê",
          disciplina: "Karatê",
          poloNome: "Paraisópolis",
          polo: "Paraisópolis",
        },
      ];
      defaultProfs.forEach((p) => listMap.set(p.id, p));
      localStorage.setItem("cufa_professores_cadastrados", JSON.stringify(defaultProfs));
    }

    return Array.from(listMap.values());
  }

  const [alunosData, setAlunosData] = useState<any[]>([]);
  const [professoresData, setProfessoresData] = useState<any[]>([]);


  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const signInEmail = normalizedEmail === "master@cufa.com.br" ? "gestor@cufa.com.br" : normalizedEmail;
    const { data, error } = await supabase.auth.signInWithPassword({ email: signInEmail, password: senha });
    if (!error && data.user) {
      const { data: isGestor, error: roleError } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "gestor",
      });
      if (roleError || !isGestor) {
        await supabase.auth.signOut();
        toast.error("Este usuário não possui acesso administrativo.");
        return;
      }
      setAuthenticated(true);
      localStorage.setItem("cufa_master_authenticated", "true");
      toast.success("Acesso Master Admin Autorizado!", {
        description: "Bem-vindo ao Portal de Controle de Acessos da CUFA.",
      });
    } else {
      toast.error("Credenciais administrativas incorretas.");
    }
  }

  function handleLogout() {
    setAuthenticated(false);
    localStorage.removeItem("cufa_master_authenticated");
    setEmail("");
    setSenha("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          authenticated
            ? "max-w-none w-screen h-screen m-0 p-0 rounded-none border-none overflow-y-auto bg-background flex flex-col lg:flex-row"
            : "max-h-[92dvh] overflow-y-auto sm:max-w-md"
        }
      >
        {!authenticated ? (
          <div className="p-2">
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <Crown className="size-6" />
                </span>
                <div>
                  <DialogTitle className="text-2xl font-black">Portal Master Admin</DialogTitle>
                  <DialogDescription>
                    Acesso de nível elevado para gestão global de senhas e credenciais.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  E-mail Master
                </Label>
                <Input
                  type="email"
                  required
                  placeholder="master@cufa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  Senha Master
                </Label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="h-11 font-medium"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold text-base shadow-lg"
              >
                <Lock className="size-4 mr-2" /> Acessar Painel Master
              </Button>
            </form>
          </div>
        ) : (
          /* Master Admin Panel (Requisições do Usuário) */
          <div className="flex-1 flex flex-col lg:flex-row min-h-screen">
            {/* Sidebar Master Admin */}
            <aside className="w-full lg:w-64 border-r border-border bg-card p-6 flex flex-col justify-between shrink-0">
              <div>
                <div className="flex items-center gap-3 pb-6 border-b border-border">
                  <img src={logo} alt="CUFA" className="h-10 w-auto object-contain" />
                  <div>
                    <span className="block text-xs font-black uppercase text-amber-600 tracking-wider">
                      MASTER ADMIN
                    </span>
                    <span className="block text-[10px] text-muted-foreground font-semibold">
                      Controle Total
                    </span>
                  </div>
                </div>

                <nav className="mt-6 space-y-1">
                  {/* Option 1: Acessos de Gestores */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("gestores")}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold transition-all ${
                      activeTab === "gestores"
                        ? "bg-amber-600 text-white shadow-md"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <UserCheck className="size-4 shrink-0" />
                    <span>1. Acessos de Gestores</span>
                  </button>

                  {/* Option 2: Acessos de Alunos */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("alunos")}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold transition-all ${
                      activeTab === "alunos"
                        ? "bg-amber-600 text-white shadow-md"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Users className="size-4 shrink-0" />
                    <span>2. Acessos de Alunos</span>
                  </button>

                  {/* Option 3: Acessos de Professores */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("professores")}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-xs sm:text-sm font-bold transition-all ${
                      activeTab === "professores"
                        ? "bg-amber-600 text-white shadow-md"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <GraduationCap className="size-4 shrink-0" />
                    <span>3. Acessos de Professores</span>
                  </button>
                </nav>
              </div>

              <div className="pt-6 border-t border-border space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-xs font-bold text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    handleLogout();
                    onOpenChange(false);
                  }}
                >
                  Sair do Master Admin
                </Button>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
              {activeTab === "gestores" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-foreground">1. Acessos e Credenciais de Gestores</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visualização de dados, senhas de acesso e controle dos administradores da CUFA.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto shadow-xs">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs uppercase text-muted-foreground font-bold">
                          <th className="pb-3">Nome</th>
                          <th className="pb-3">E-mail de Login</th>
                          <th className="pb-3">Senha de Acesso</th>
                          <th className="pb-3">Unidade / Polo</th>
                          <th className="pb-3 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {gestoresData.map((g: any) => (
                          <tr key={g.id} className="hover:bg-muted/30">
                            <td className="py-3 font-bold text-foreground">{g.nome}</td>
                            <td className="py-3 text-muted-foreground">{g.email}</td>
                            <td className="py-3 font-mono text-xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-md inline-block">
                              {g.senha}
                            </td>
                            <td className="py-3 font-medium">{g.polo}</td>
                            <td className="py-3 text-right flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs font-bold"
                                onClick={() => toast.info(`Senha enviada para ${g.email}`)}
                              >
                                <Key className="size-3.5 mr-1" /> Resetar Senha
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                onClick={() => {
                                  if (confirm(`Deseja excluir definitivamente o gestor ${g.nome}?`)) {
                                    setGestoresData((prev: any[]) => prev.filter((item) => item.id !== g.id));
                                    try {
                                      const stored = localStorage.getItem("cufa_gestores_lista");
                                      if (stored) {
                                        const list = JSON.parse(stored).filter((item: any) => item.id !== g.id);
                                        localStorage.setItem("cufa_gestores_lista", JSON.stringify(list));
                                      }
                                    } catch {}
                                    toast.success(`Gestor ${g.nome} excluído definitivamente.`);
                                  }
                                }}
                                title="Excluir Gestor"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === "alunos" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-foreground">2. Acessos e Credenciais de Alunos</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visualização de alunos cadastrados na plataforma, credenciais e oficinas.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto shadow-xs">
                    {alunosData.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">Nenhum aluno cadastrado no momento.</p>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs uppercase text-muted-foreground font-bold">
                            <th className="pb-3">Nome do Aluno</th>
                            <th className="pb-3">E-mail</th>
                            <th className="pb-3">Senha</th>
                            <th className="pb-3">Polo</th>
                            <th className="pb-3">Atividade</th>
                            <th className="pb-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {alunosData.map((a) => (
                            <tr key={a.id} className="hover:bg-muted/30">
                              <td className="py-3 font-bold text-foreground">{a.nome}</td>
                              <td className="py-3 text-muted-foreground">{a.email}</td>
                              <td className="py-3 font-mono text-xs font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-md inline-block">
                                {a.senha}
                              </td>
                              <td className="py-3 font-medium">{a.polo}</td>
                              <td className="py-3 font-semibold text-primary">{a.atividade}</td>
                              <td className="py-3 text-right">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                  onClick={async () => {
                                    if (confirm(`Deseja excluir definitivamente o aluno ${a.nome}?`)) {
                                      try {
                                        await deleteAlunoCadastro(a.email);
                                        setAlunosData((prev) => prev.filter((item) => item.id !== a.id));
                                        window.dispatchEvent(new Event("cufa_alunos_updated"));
                                        toast.success(`Aluno ${a.nome} excluído definitivamente.`);
                                      } catch (error) {
                                        toast.error(error instanceof Error ? error.message : "Não foi possível excluir o aluno.");
                                      }
                                    }
                                  }}
                                  title="Excluir Aluno"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "professores" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-foreground">3. Acessos e Credenciais de Professores</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visualização de instrutores, senhas e disciplinas vinculadas.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto shadow-xs">
                    {professoresData.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">Nenhum professor cadastrado no momento.</p>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-xs uppercase text-muted-foreground font-bold">
                            <th className="pb-3">Nome do Professor</th>
                            <th className="pb-3">E-mail</th>
                            <th className="pb-3">Senha</th>
                            <th className="pb-3">Disciplina / Oficina</th>
                            <th className="pb-3">Polo</th>
                            <th className="pb-3 text-right">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {professoresData.map((p) => (
                            <tr key={p.id} className="hover:bg-muted/30">
                              <td className="py-3 font-bold text-foreground">{p.nome}</td>
                              <td className="py-3 text-muted-foreground">{p.email}</td>
                              <td className="py-3 font-mono text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-md inline-block">
                                {p.senha}
                              </td>
                              <td className="py-3 font-semibold text-primary">{p.disciplina}</td>
                              <td className="py-3 font-medium">{p.polo}</td>
                              <td className="py-3 text-right">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                  onClick={async () => {
                                    if (confirm(`Deseja excluir definitivamente o professor ${p.nome}?`)) {
                                      try {
                                        await deleteProfessorCadastro(p.email);
                                        setProfessoresData((prev) => prev.filter((item) => item.id !== p.id));
                                        window.dispatchEvent(new Event("cufa_professores_updated"));
                                        toast.success(`Professor ${p.nome} excluído definitivamente.`);
                                      } catch (error) {
                                        toast.error(error instanceof Error ? error.message : "Não foi possível excluir o professor.");
                                      }
                                    }
                                  }}
                                  title="Excluir Professor"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
