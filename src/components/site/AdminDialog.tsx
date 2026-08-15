import { useState } from "react";
import { Lock, ShieldCheck, LogOut, LayoutDashboard, Building2, Layers, Users, FileSpreadsheet } from "lucide-react";
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

export function AdminDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (email.trim().toLowerCase() === "gestor@cufa.com.br" && senha === "gestao26") {
      setAuthenticated(true);
      toast.success("Acesso de Gestor Autorizado!", {
        description: "Bem-vindo à área administrativa da CUFA.",
      });
    } else {
      toast.error("Credenciais incorretas", {
        description: "Verifique o e-mail e a senha do gestor e tente novamente.",
      });
    }
  }

  function handleLogout() {
    setAuthenticated(false);
    setEmail("");
    setSenha("");
    toast("Sessão encerrada", {
      description: "Você saiu do painel do gestor.",
    });
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-2xl font-bold">
                {authenticated ? "Painel do Gestor" : "Acesso Adm — Gestor"}
              </DialogTitle>
              <DialogDescription>
                {authenticated
                  ? "Gestão geral da plataforma CUFA (Polos, Atividades e Turmas)."
                  : "Área restrita para administração da plataforma."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!authenticated ? (
          <form className="mt-2 grid gap-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <Label
                htmlFor="adm-email"
                className="text-xs uppercase tracking-wide text-muted-foreground font-semibold"
              >
                E-mail de Gestor
              </Label>
              <Input
                id="adm-email"
                type="email"
                required
                placeholder="gestor@cufa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="adm-senha"
                className="text-xs uppercase tracking-wide text-muted-foreground font-semibold"
              >
                Senha
              </Label>
              <Input
                id="adm-senha"
                type="password"
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="mt-2 h-11 bg-brand-gradient text-white font-bold shadow-brand text-base"
            >
              <Lock className="size-4 mr-2" /> Entrar no Painel Adm
            </Button>
          </form>
        ) : (
          <div className="mt-2 grid gap-5">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-full bg-primary text-white font-bold text-xs">
                  ADM
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">Gestor Conectado</p>
                  <p className="text-xs text-muted-foreground">gestor@cufa.com.br</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-xs font-semibold text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                <LogOut className="size-3.5 mr-1" /> Sair
              </Button>
            </div>

            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-5 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileSpreadsheet className="size-6" />
              </div>
              <h4 className="mt-3 text-base font-bold text-foreground">Aguardando dados da planilha Excel</h4>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Envie o arquivo Excel com os conteúdos, polos e opções do menu para gerarmos automaticamente todas as telas de gestão!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 opacity-60 pointer-events-none">
              <div className="rounded-xl border border-border p-3 flex flex-col items-center text-center">
                <Building2 className="size-5 text-primary mb-1" />
                <span className="text-xs font-bold">Polos CUFA</span>
              </div>
              <div className="rounded-xl border border-border p-3 flex flex-col items-center text-center">
                <Layers className="size-5 text-primary mb-1" />
                <span className="text-xs font-bold">Atividades</span>
              </div>
              <div className="rounded-xl border border-border p-3 flex flex-col items-center text-center">
                <Users className="size-5 text-primary mb-1" />
                <span className="text-xs font-bold">Matrículas</span>
              </div>
              <div className="rounded-xl border border-border p-3 flex flex-col items-center text-center">
                <LayoutDashboard className="size-5 text-primary mb-1" />
                <span className="text-xs font-bold">Relatórios</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
