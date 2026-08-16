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
    localStorage.setItem("cufa_logged_user", cleanEmail);

    // Master Admin Login
    if (cleanEmail === "master@cufa.com.br") {
      localStorage.setItem("cufa_master_authenticated", "true");
      toast.success("Acesso Master Admin autorizado!");
      onOpenChange(false);
      window.location.href = "/gestor";
      return;
    }

    // Gestor Geral Login
    if (cleanEmail === "gestor@cufa.com.br") {
      toast.success("Login realizado com sucesso! Bem-vindo, Gestor Geral.");
      onOpenChange(false);
      window.location.href = "/gestor";
      return;
    }

    // Check stored gestores list
    try {
      const stored = localStorage.getItem("cufa_gestores_lista");
      const list = stored ? JSON.parse(stored) : [];
      const matched = list.find((g: any) => String(g.email).toLowerCase() === cleanEmail);

      if (matched) {
        if (matched.tipo === "geral") {
          toast.success("Login realizado com sucesso! Bem-vindo, Gestor Geral.");
          onOpenChange(false);
          window.location.href = "/gestor";
          return;
        } else {
          localStorage.setItem("cufa_polo_atribuido", matched.poloNome || "Complexo da Penha");
          toast.success(`Login autorizado! Unidade ${matched.poloNome}`);
          onOpenChange(false);
          window.location.href = "/polo";
          return;
        }
      }
    } catch {}

    // Fallback for Responsável de Polo email pattern
    if (cleanEmail.includes("penha")) {
      localStorage.setItem("cufa_polo_atribuido", "Complexo da Penha");
      toast.success("Login autorizado! Unidade Complexo da Penha.");
      onOpenChange(false);
      window.location.href = "/polo";
      return;
    }

    if (cleanEmail.includes("madureira")) {
      localStorage.setItem("cufa_polo_atribuido", "Viaduto de Madureira");
      toast.success("Login autorizado! Unidade Viaduto de Madureira.");
      onOpenChange(false);
      window.location.href = "/polo";
      return;
    }

    if (cleanEmail.includes("paraisopolis")) {
      localStorage.setItem("cufa_polo_atribuido", "Paraisópolis");
      toast.success("Login autorizado! Unidade Paraisópolis.");
      onOpenChange(false);
      window.location.href = "/polo";
      return;
    }

    // Default Responsável de Polo Login for any registered user
    localStorage.setItem("cufa_polo_atribuido", "Complexo da Penha");
    toast.success("Login realizado com sucesso!", {
      description: "Redirecionando para o Painel do Responsável...",
    });
    onOpenChange(false);
    window.location.href = "/polo";
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
