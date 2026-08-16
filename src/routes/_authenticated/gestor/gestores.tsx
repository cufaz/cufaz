import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UserCheck, Plus, Lock, Mail, User, ShieldCheck, Key, Building2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { GestorShell } from "@/components/admin/GestorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/gestor/gestores")({
  component: GestoresPage,
});

interface GestorItem {
  id: string;
  nome: string;
  email: string;
  senha: string;
  tipo: "geral" | "polo";
  poloNome: string;
  dataCriacao: string;
  ativo: boolean;
}

const DEFAULT_GESTORES: GestorItem[] = [
  {
    id: "g1",
    nome: "Gestor Geral CUFA",
    email: "gestor@cufa.com.br",
    senha: "gestao26",
    tipo: "geral",
    poloNome: "Todos os Polos (Acesso Geral)",
    dataCriacao: "2026-08-01",
    ativo: true,
  },
  {
    id: "g-ricardo",
    nome: "Ricardo Brito",
    email: "britonascimento@hotmail.com",
    senha: "complexodapenha2026!",
    tipo: "polo",
    poloNome: "Complexo da Penha",
    dataCriacao: "2026-08-01",
    ativo: true,
  },
];

export function GestoresPage() {
  const [gestores, setGestores] = useState<GestorItem[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_gestores_lista");
      if (stored) {
        const parsed: GestorItem[] = JSON.parse(stored);
        // Filter out old dummy emails
        const clean = parsed.filter(
          (g) => !["penha@cufa.com.br", "madureira@cufa.com.br", "paraisopolis@cufa.com.br", "teste@cufa.com.br"].includes(g.email.toLowerCase())
        );
        if (clean.some((g) => g.tipo === "polo")) return clean;
        return [...clean, ...DEFAULT_GESTORES.slice(1)];
      }
    } catch {}
    return DEFAULT_GESTORES;
  });

  useEffect(() => {
    try {
      localStorage.setItem("cufa_gestores_lista", JSON.stringify(gestores));
    } catch {}
  }, [gestores]);

  useEffect(() => {
    function syncGestores() {
      try {
        const stored = localStorage.getItem("cufa_gestores_lista");
        if (stored) {
          const parsed: GestorItem[] = JSON.parse(stored);
          const clean = parsed.filter(
            (g) => !["penha@cufa.com.br", "madureira@cufa.com.br", "paraisopolis@cufa.com.br", "teste@cufa.com.br"].includes(g.email.toLowerCase())
          );
          setGestores(clean.some((g) => g.tipo === "polo") ? clean : [...clean, ...DEFAULT_GESTORES.slice(1)]);
        }
      } catch {}
    }

    window.addEventListener("cufa_gestores_updated", syncGestores);
    return () => window.removeEventListener("cufa_gestores_updated", syncGestores);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<"geral" | "polo">("polo");
  const [poloNome, setPoloNome] = useState("Complexo da Penha");

  function handleCriarGestor(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !email || !senha) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const novo: GestorItem = {
      id: `g-${Date.now()}`,
      nome,
      email,
      senha,
      tipo,
      poloNome: tipo === "geral" ? "Todos os Polos (Acesso Geral)" : poloNome,
      dataCriacao: new Date().toISOString().slice(0, 10),
      ativo: true,
    };

    setGestores([...gestores, novo]);
    toast.success("Acesso de gestor cadastrado com sucesso!", {
      description: `E-mail: ${email} | Polo: ${novo.poloNome}`,
    });
    setModalOpen(false);
    setNome("");
    setEmail("");
    setSenha("");
  }

  function handleResetSenha(g: GestorItem) {
    const novaSenha = `${g.senha.split("2026")[0] || "cufa"}2026!`;
    setGestores(
      gestores.map((item) =>
        item.id === g.id ? { ...item, senha: novaSenha } : item
      )
    );
    toast.success(`Senha resetada para ${g.nome}`, {
      description: `Nova senha: ${novaSenha}`,
    });
  }

  const gestorGeral = gestores.filter((g) => g.tipo === "geral");
  const gestoresPolos = gestores.filter((g) => g.tipo === "polo");

  return (
    <GestorShell
      title="Acessos de Gestores"
      description="Gestão de credenciais, senhas e permissões — Gestor Geral e Gestores por Polo."
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswords(!showPasswords)}
            className="font-bold text-xs"
          >
            {showPasswords ? <EyeOff className="mr-1.5 size-3.5" /> : <Eye className="mr-1.5 size-3.5" />}
            {showPasswords ? "Ocultar Senhas" : "Ver Senhas"}
          </Button>
          <Button
            className="bg-brand-gradient font-bold text-white shadow-brand"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="mr-1.5 size-4" /> Novo Gestor
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* SEÇÃO 1: GESTOR GERAL DA PLATAFORMA (Anexo 2) */}
        <div className="rounded-2xl border border-amber-500/30 bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-amber-500/10 text-amber-600">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-foreground uppercase tracking-wide">
                  1. Gestor Geral da Plataforma CUFA (Administração Global)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Acesso único com controle total sobre todos os polos, demonstrativos e cadastros gerais.
                </p>
              </div>
            </div>
            <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 font-bold">
              Gestor Único Geral
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="pb-3">Nome</th>
                  <th className="pb-3">E-mail de Login</th>
                  <th className="pb-3">Senha de Acesso</th>
                  <th className="pb-3">Abrangência</th>
                  <th className="pb-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {gestorGeral.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/30">
                    <td className="py-3.5 font-bold text-foreground flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-full bg-amber-500/10 text-amber-600 font-bold shrink-0">
                        <User className="size-4" />
                      </span>
                      <span>{g.nome}</span>
                    </td>
                    <td className="py-3.5 text-muted-foreground font-medium">{g.email}</td>
                    <td className="py-3.5">
                      <span className="font-mono text-xs font-bold text-amber-700 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                        {showPasswords ? g.senha : "••••••••"}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-amber-700">{g.poloNome}</td>
                    <td className="py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-bold border-amber-500/30 text-amber-700 hover:bg-amber-500/10"
                        onClick={() => handleResetSenha(g)}
                      >
                        <Key className="size-3.5 mr-1" /> Resetar Senha
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SEÇÃO 2: GESTORES DE POLOS E UNIDADES (Anexo 2) */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-foreground uppercase tracking-wide">
                  2. Gestores Locais de Polos e Unidades (Visão Restrita por Polo)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Cada gestor de polo acessa estritamente as atividades, vagas e custos da sua unidade.
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="font-bold">
              {gestoresPolos.length} gestores de polo
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="pb-3">Nome do Gestor</th>
                  <th className="pb-3">E-mail de Login</th>
                  <th className="pb-3">Senha de Acesso</th>
                  <th className="pb-3">Unidade / Polo Responsável</th>
                  <th className="pb-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {gestoresPolos.map((g) => (
                  <tr key={g.id} className="hover:bg-muted/30">
                    <td className="py-3.5 font-bold text-foreground flex items-center gap-2">
                      <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
                        <User className="size-4" />
                      </span>
                      <span>{g.nome}</span>
                    </td>
                    <td className="py-3.5 text-muted-foreground font-medium">{g.email}</td>
                    <td className="py-3.5">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20 inline-block">
                        {showPasswords ? g.senha : "••••••••"}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-foreground">{g.poloNome}</td>
                    <td className="py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs font-bold"
                        onClick={() => handleResetSenha(g)}
                      >
                        <Key className="size-3.5 mr-1" /> Resetar Senha
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Criar Gestor */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cadastrar Acesso de Gestor</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarGestor} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Gestor</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "geral" | "polo")}
              >
                <option value="polo">Gestor de Polo / Unidade (Visão Restrita)</option>
                <option value="geral">Gestor Geral CUFA (Visão Global)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  required
                  placeholder="Nome do gestor..."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="pl-9 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">E-mail de Login</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  placeholder="exemplo@cufa.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Senha de Acesso</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  required
                  placeholder="ex.: penha2026"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-9 font-mono font-bold text-primary"
                />
              </div>
            </div>

            {tipo === "polo" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Unidade / Polo Responsável</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                  value={poloNome}
                  onChange={(e) => setPoloNome(e.target.value)}
                >
                  <option value="Complexo da Penha">Complexo da Penha</option>
                  <option value="Viaduto de Madureira">Viaduto de Madureira</option>
                  <option value="Paraisópolis">Paraisópolis</option>
                  <option value="Polo de Teste">Polo de Teste</option>
                </select>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full bg-brand-gradient text-white font-bold shadow-brand">
                Criar Acesso de Gestor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}
