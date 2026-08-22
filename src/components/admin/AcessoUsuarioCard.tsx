import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { getAcessoUsuario, redefinirSenhaUsuario } from "@/lib/gestao.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Bloco de dados de acesso (e-mail/senha) exibido nas fichas de aluno e professor. */
export function AcessoUsuarioCard({ email }: { email: string }) {
  const consultar = useServerFn(getAcessoUsuario);
  const redefinir = useServerFn(redefinirSenhaUsuario);
  const [senha, setSenha] = useState("");

  const mail = (email || "").toLowerCase().trim();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["acesso-usuario", mail],
    queryFn: () => consultar({ data: { email: mail } }),
    enabled: Boolean(mail),
  });

  const mRedefinir = useMutation({
    mutationFn: () => redefinir({ data: { email: mail, senha } }),
    onSuccess: (res: any) => {
      toast.success(res?.criado ? "Acesso criado com sucesso" : "Senha redefinida com sucesso");
      setSenha("");
      refetch();
    },
    onError: (e: Error) => toast.error("Não foi possível alterar a senha", { description: e.message }),
  });

  return (
    <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-3">
      <h4 className="font-black uppercase tracking-wider text-primary flex items-center gap-1.5 text-xs">
        <ShieldCheck className="size-4" /> Dados de acesso à plataforma
      </h4>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <span className="text-muted-foreground block text-[11px]">E-mail de login</span>
          <span className="font-bold text-foreground flex items-center gap-1 break-all">
            <Mail className="size-3 text-primary shrink-0" /> {mail || "—"}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block text-[11px]">Situação da conta</span>
          <span className="font-bold text-foreground">
            {isLoading ? "Verificando..." : data?.existe ? "Conta ativa" : "Sem acesso criado"}
          </span>
          {data?.existe && data.ultimoAcesso ? (
            <span className="block text-[10px] text-muted-foreground font-medium">
              Último acesso: {new Date(data.ultimoAcesso).toLocaleString("pt-BR")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <span className="text-muted-foreground block text-[11px]">
            {data?.existe ? "Nova senha" : "Definir senha de acesso"}
          </span>
          <Input
            type="text"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
            className="h-9 text-xs font-medium"
          />
        </div>
        <Button
          type="button"
          disabled={senha.length < 6 || mRedefinir.isPending || !mail}
          onClick={() => mRedefinir.mutate()}
          className="h-9 bg-brand-gradient text-white font-bold text-xs"
        >
          {mRedefinir.isPending ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : (
            <KeyRound className="mr-1 size-3.5" />
          )}
          {data?.existe ? "Alterar senha" : "Criar acesso"}
        </Button>
      </div>
    </div>
  );
}
