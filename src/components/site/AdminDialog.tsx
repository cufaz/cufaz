import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
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
import { GestorPanel } from "../admin/GestorPanel";

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
        description: "Bem-vindo ao Painel do Gestor da CUFA.",
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
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={
          authenticated
            ? "max-w-none w-screen h-screen m-0 p-0 rounded-none border-none overflow-y-auto"
            : "max-h-[92dvh] overflow-y-auto sm:max-w-md"
        }
      >
        {!authenticated ? (
          <div>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-2">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <DialogTitle className="text-2xl font-bold">Acesso Adm — Gestor</DialogTitle>
                  <DialogDescription>
                    Área restrita para administração e gestão da CUFA.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form className="mt-4 grid gap-4" onSubmit={handleLogin}>
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
                  className="h-11 font-medium"
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
                  className="h-11 font-medium"
                />
              </div>

              <Button
                type="submit"
                className="mt-2 h-11 bg-brand-gradient text-white font-bold shadow-brand text-base"
              >
                <Lock className="size-4 mr-2" /> Entrar no Painel Adm
              </Button>
            </form>
          </div>
        ) : (
          <GestorPanel
            onLogout={() => {
              handleLogout();
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
