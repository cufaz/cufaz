import { useState } from "react";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

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

export function LoginDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanSenha = senha.trim();

    if (!cleanEmail || !cleanSenha) {
      toast.error("Preencha o e-mail e a senha.");
      return;
    }

    // 1. Master Admin Login
    if (cleanEmail === "master@cufa.com.br") {
      if (cleanSenha !== "cufamaster2026" && cleanSenha !== "gestao26" && cleanSenha !== "master2026") {
        toast.error("Senha incorreta!", {
          description: "Verifique a senha informada e tente novamente.",
        });
        return;
      }
      localStorage.setItem("cufa_logged_user", cleanEmail);
      localStorage.setItem("cufa_master_authenticated", "true");
      toast.success("Acesso Master Admin autorizado!");
      onOpenChange(false);
      window.location.href = "/gestor";
      return;
    }

    // 2. Gestor Geral Login
    if (cleanEmail === "gestor@cufa.com.br") {
      if (cleanSenha !== "gestao26" && cleanSenha !== "cufa2026!") {
        toast.error("Senha incorreta!", {
          description: "Verifique a senha informada e tente novamente.",
        });
        return;
      }
      localStorage.setItem("cufa_logged_user", cleanEmail);
      toast.success("Login realizado com sucesso! Bem-vindo, Gestor Geral.");
      onOpenChange(false);
      window.location.href = "/gestor";
      return;
    }

    // 3. Check registered list of gestores/responsaveis (including Ricardo)
    let list: any[] = [];
    try {
      const stored = localStorage.getItem("cufa_gestores_lista");
      if (stored) list = JSON.parse(stored);
    } catch {}

    // Include Ricardo in default list if missing
    if (!list.some((g: any) => String(g.email).toLowerCase() === "ricardo@cufa.com.br")) {
      list.push({
        id: "g-ricardo",
        nome: "Ricardo",
        email: "ricardo@cufa.com.br",
        senha: "ricardo2026",
        tipo: "polo",
        poloNome: "Complexo da Penha",
      });
    }

    const matched = list.find((g: any) => String(g.email).toLowerCase() === cleanEmail);

    if (matched) {
      // STRICT PASSWORD CHECK
      if (matched.senha && matched.senha !== cleanSenha) {
        toast.error("Senha incorreta!", {
          description: "A senha digitada não confere com a cadastrada para este usuário.",
        });
        return;
      }

      localStorage.setItem("cufa_logged_user", cleanEmail);
      if (matched.tipo === "geral") {
        toast.success("Login realizado com sucesso! Bem-vindo, Gestor Geral.");
        onOpenChange(false);
        window.location.href = "/gestor";
      } else {
        localStorage.setItem("cufa_polo_atribuido", matched.poloNome || "Complexo da Penha");
        toast.success(`Login autorizado! Unidade ${matched.poloNome}`);
        onOpenChange(false);
        window.location.href = "/polo";
      }
      return;
    }

    // 4. Fallback check for Ricardo specifically if not in list
    if (cleanEmail === "ricardo@cufa.com.br") {
      if (cleanSenha !== "ricardo2026" && cleanSenha !== "penha2026") {
        toast.error("Senha incorreta!", {
          description: "Verifique a senha informada e tente novamente.",
        });
        return;
      }
      localStorage.setItem("cufa_logged_user", cleanEmail);
      localStorage.setItem("cufa_polo_atribuido", "Complexo da Penha");
      toast.success("Login autorizado! Unidade Complexo da Penha.");
      onOpenChange(false);
      window.location.href = "/polo";
      return;
    }

    // 5. User not found
    toast.error("Usuário não cadastrado!", {
      description: "Verifique o e-mail informado ou realize o cadastro de acesso.",
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <LogIn className="size-6 text-primary" /> Entrar na plataforma
          </DialogTitle>
          <DialogDescription>Acesse com o e-mail cadastrado na CUFA.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleLogin}>
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs uppercase tracking-wide text-muted-foreground">
              E-mail
            </Label>
            <Input
              id="login-email"
              type="email"
              required
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-senha" className="text-xs uppercase tracking-wide text-muted-foreground">
              Senha
            </Label>
            <Input
              id="login-senha"
              type="password"
              required
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <Button type="submit" className="bg-brand-gradient font-semibold shadow-brand">
            Entrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
