import { useState } from "react";
import { GraduationCap, ShieldCheck, UserRound, ArrowLeft } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Perfil = "responsavel" | "professor" | "aluno";

const perfis: { id: Perfil; titulo: string; desc: string; Icon: typeof UserRound }[] = [
  {
    id: "responsavel",
    titulo: "Responsável CUFA",
    desc: "Coordena a unidade, valida turmas e acompanha indicadores.",
    Icon: ShieldCheck,
  },
  {
    id: "professor",
    titulo: "Professor",
    desc: "Inscreve-se para ministrar modalidades e registrar presença.",
    Icon: GraduationCap,
  },
  {
    id: "aluno",
    titulo: "Aluno / Responsável legal",
    desc: "Matricula-se nas atividades disponíveis na sua comunidade.",
    Icon: UserRound,
  },
];

const comunidades = [
  "Madureira",
  "Complexo da Penha",
  "Paraisópolis",
  "Cidade de Deus",
  "Heliópolis",
];

const modalidades = [
  "Karatê",
  "Jiu Jitsu",
  "Futsal",
  "Basquete",
  "Natação",
  "Corte e Costura",
  "Aula de Inglês",
];

function Campo({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={props.id} className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <Input {...props} />
    </div>
  );
}

function SeletorComunidade() {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Comunidade</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a comunidade" />
        </SelectTrigger>
        <SelectContent>
          {comunidades.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SignupDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const atual = perfis.find((p) => p.id === perfil);

  function fechar(v: boolean) {
    onOpenChange(v);
    if (!v) setTimeout(() => setPerfil(null), 200);
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Cadastro enviado!", {
      description: "Sua solicitação será analisada pela equipe CUFA Z.",
    });
    fechar(false);
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl">
            {atual ? atual.titulo : "Criar sua conta"}
          </DialogTitle>
          <DialogDescription>
            {atual
              ? "Preencha os dados abaixo para enviar sua solicitação."
              : "Escolha o seu perfil na plataforma CUFA Z."}
          </DialogDescription>
        </DialogHeader>

        {!perfil && (
          <div className="grid gap-3">
            {perfis.map(({ id, titulo, desc, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPerfil(id)}
                className="flex items-start gap-3 rounded-xl border border-border bg-secondary/50 p-4 text-left transition-colors hover:border-primary hover:bg-secondary"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-gradient text-primary-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">{titulo}</span>
                  <span className="block text-sm text-muted-foreground">{desc}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {perfil && (
          <form className="grid gap-4" onSubmit={enviar}>
            <Campo id="nome" label="Nome completo" required placeholder="Seu nome" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="email" label="E-mail" type="email" required placeholder="voce@email.com" />
              <Campo id="tel" label="Telefone / WhatsApp" required placeholder="(00) 00000-0000" />
            </div>

            {perfil === "responsavel" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="cpf" label="CPF" required placeholder="000.000.000-00" />
                  <Campo id="cargo" label="Cargo na CUFA" required placeholder="Ex.: Coordenador" />
                </div>
                <SeletorComunidade />
                <Campo id="unidade" label="Unidade / Espaço" placeholder="Ex.: Complexo da Penha" />
              </>
            )}

            {perfil === "professor" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="cpf-prof" label="CPF" required placeholder="000.000.000-00" />
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Modalidade
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {modalidades.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SeletorComunidade />
                <Campo id="formacao" label="Formação / Graduação" placeholder="Ex.: Faixa preta 2º dan" />
                <div className="space-y-1.5">
                  <Label
                    htmlFor="exp"
                    className="text-xs uppercase tracking-wide text-muted-foreground"
                  >
                    Experiência com projetos sociais
                  </Label>
                  <Textarea id="exp" rows={3} placeholder="Conte um pouco da sua trajetória" />
                </div>
              </>
            )}

            {perfil === "aluno" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="nasc" label="Data de nascimento" type="date" required />
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Modalidade desejada
                    </Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {modalidades.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <SeletorComunidade />
                <Campo id="resp" label="Nome do responsável (se menor de 18)" placeholder="Opcional" />
                <Campo id="resp-tel" label="Telefone do responsável" placeholder="Opcional" />
              </>
            )}

            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button type="button" variant="ghost" onClick={() => setPerfil(null)}>
                <ArrowLeft className="size-4" /> Trocar perfil
              </Button>
              <Button type="submit" className="bg-brand-gradient font-semibold shadow-brand">
                Enviar cadastro
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
