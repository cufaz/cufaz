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

export function LoginDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl">Entrar na plataforma</DialogTitle>
          <DialogDescription>Acesse com o e-mail cadastrado na CUFA.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast("Acesso em construção", {
              description: "A área logada será liberada em breve.",
            });
            onOpenChange(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs uppercase tracking-wide text-muted-foreground">
              E-mail
            </Label>
            <Input id="login-email" type="email" required placeholder="voce@email.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-senha" className="text-xs uppercase tracking-wide text-muted-foreground">
              Senha
            </Label>
            <Input id="login-senha" type="password" required placeholder="••••••••" />
          </div>
          <Button type="submit" className="bg-brand-gradient font-semibold shadow-brand">
            Entrar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
