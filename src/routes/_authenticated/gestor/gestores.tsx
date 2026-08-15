import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserCheck, Plus, Lock, Mail, User, ShieldCheck } from "lucide-react";
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
  funcao: string;
  dataCriacao: string;
  ativo: boolean;
}

export function GestoresPage() {
  const [gestores, setGestores] = useState<GestorItem[]>([
    {
      id: "g1",
      nome: "Gestor Principal CUFA",
      email: "gestor@cufa.com.br",
      funcao: "Gestor Geral",
      dataCriacao: "2026-08-01",
      ativo: true,
    },
    {
      id: "g2",
      nome: "Alessandra Vieira",
      email: "alessandra.penha@cufa.com.br",
      funcao: "Gestor de Polo (Penha)",
      dataCriacao: "2026-08-05",
      ativo: true,
    },
    {
      id: "g3",
      nome: "Aline Góes",
      email: "aline.madureira@cufa.com.br",
      funcao: "Gestor de Polo (Madureira)",
      dataCriacao: "2026-08-08",
      ativo: true,
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [funcao, setFuncao] = useState("Gestor de Polo");

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
      funcao,
      dataCriacao: new Date().toISOString().slice(0, 10),
      ativo: true,
    };

    setGestores([...gestores, novo]);
    toast.success("Gestor cadastrado com sucesso!", {
      description: `Acesso criado para ${email}`,
    });
    setModalOpen(false);
    setNome("");
    setEmail("");
    setSenha("");
  }

  return (
    <GestorShell
      title="Acessos de Gestores"
      description="Gerencie os usuários e administradores com acesso ao Painel do Gestor."
      actions={
        <Button
          className="bg-brand-gradient font-bold text-white shadow-brand"
          onClick={() => setModalOpen(true)}
        >
          <Plus className="mr-1.5 size-4" /> Novo Gestor
        </Button>
      }
    >
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" /> Lista de Gestores Cadastrados
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Usuários autorizados a administrar polos, atividades e demonstrativos financeiros.
            </p>
          </div>
          <Badge variant="secondary" className="font-bold">
            {gestores.length} gestores
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <th className="pb-3">Nome / Gestor</th>
                <th className="pb-3">E-mail de Acesso</th>
                <th className="pb-3">Perfil / Função</th>
                <th className="pb-3">Data de Criação</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {gestores.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30">
                  <td className="py-3.5 font-bold text-foreground flex items-center gap-2">
                    <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-primary shrink-0">
                      <User className="size-4" />
                    </span>
                    <span>{g.nome}</span>
                  </td>
                  <td className="py-3.5 text-muted-foreground font-medium">{g.email}</td>
                  <td className="py-3.5 font-semibold text-foreground">{g.funcao}</td>
                  <td className="py-3.5 text-muted-foreground">{g.dataCriacao}</td>
                  <td className="py-3.5 text-right">
                    <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-emerald-500/30">
                      Ativo
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar Gestor */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Cadastrar Novo Gestor</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarGestor} className="space-y-4 mt-2">
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
              <Label className="text-xs font-bold uppercase text-muted-foreground">E-mail de Acesso</Label>
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
              <Label className="text-xs font-bold uppercase text-muted-foreground">Senha Inicial</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-9 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Função / Polo</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                value={funcao}
                onChange={(e) => setFuncao(e.target.value)}
              >
                <option value="Gestor Geral">Gestor Geral</option>
                <option value="Gestor de Polo (Penha)">Gestor de Polo (Penha)</option>
                <option value="Gestor de Polo (Madureira)">Gestor de Polo (Madureira)</option>
                <option value="Gestor de Polo (Paraisópolis)">Gestor de Polo (Paraisópolis)</option>
                <option value="Coordenador Financeiro">Coordenador Financeiro</option>
              </select>
            </div>

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
