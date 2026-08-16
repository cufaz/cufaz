import { useState } from "react";
import { GraduationCap, ShieldCheck, UserRound, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { AuthLoadingOverlay } from "@/components/site/AuthLoadingOverlay";

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
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Unidade</Label>
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Selecione a unidade" />
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

function FileUploadBtn({
  id,
  label,
  fileName,
  onSelect,
}: {
  id: string;
  label: string;
  fileName: string | null;
  onSelect: (name: string | null) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-bold text-muted-foreground block">{label}</Label>
      <div className="flex items-center gap-2">
        <label
          htmlFor={id}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs cursor-pointer shadow-xs transition-all shrink-0"
        >
          <Upload className="size-3.5" />
          <span>Escolher arquivo</span>
          <input
            id={id}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              onSelect(file ? file.name : null);
            }}
          />
        </label>
        <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[150px]">
          {fileName ? fileName : "Nenhum arquivo escolhido"}
        </span>
      </div>
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
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [unidade, setUnidade] = useState("Complexo da Penha");
  const [turmaEscolhida, setTurmaEscolhida] = useState("Turma 1 - Tarde (14h - 16h)");
  const [modalidade, setModalidade] = useState("Jiu Jitsu");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  // Uploaded File Name States (Anexo 3)
  const [docIdName, setDocIdName] = useState<string | null>(null);
  const [docResName, setDocResName] = useState<string | null>(null);
  const [docFuncName, setDocFuncName] = useState<string | null>(null);
  const [cert1Name, setCert1Name] = useState<string | null>(null);
  const [cert2Name, setCert2Name] = useState<string | null>(null);
  const [cert3Name, setCert3Name] = useState<string | null>(null);
  const [cert4Name, setCert4Name] = useState<string | null>(null);

  const atual = perfis.find((p) => p.id === perfil);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayMsg, setOverlayMsg] = useState("Criando sua conta...");
  const [targetUrl, setTargetUrl] = useState("");

  function triggerAuthRedirect(url: string, message: string) {
    setTargetUrl(url);
    setOverlayMsg(message);
    setOverlayOpen(true);
  }

  function handleOverlayComplete() {
    if (targetUrl) {
      window.location.href = targetUrl;
    }
  }

  function fechar(v: boolean) {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => {
        setPerfil(null);
        setNome("");
        setEmail("");
        setTelefone("");
        setSenha("");
        setConfirmarSenha("");
      }, 200);
    }
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirmarSenha) {
      toast.error("As senhas digitadas não coincidem!", {
        description: "Verifique o campo de confirmação de senha.",
      });
      return;
    }

    if (senha.length < 4) {
      toast.error("A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    if (perfil === "responsavel") {
      const uNome = unidade || "Complexo da Penha";
      const gNome = nome.trim() || "Novo Responsável CUFA";
      const gEmail = email.trim().toLowerCase() || "responsavel@cufa.com.br";
      const gSenha = senha || `${uNome.toLowerCase().replace(/[^a-z0-9]/g, "")}2026`;

      const novoGestor = {
        id: `g-${Date.now()}`,
        nome: gNome,
        email: gEmail,
        senha: gSenha,
        tipo: "polo",
        poloNome: uNome,
        dataCriacao: new Date().toISOString().slice(0, 10),
        ativo: true,
      };

      try {
        const stored = localStorage.getItem("cufa_gestores_lista");
        let list = stored ? JSON.parse(stored) : [
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
        ];
        list.push(novoGestor);
        localStorage.setItem("cufa_gestores_lista", JSON.stringify(list));
        window.dispatchEvent(new Event("cufa_gestores_updated"));
      } catch {}

      toast.success("Cadastro de Responsável liberado com sucesso!", {
        description: `Acesso liberado para a unidade ${uNome}. E-mail: ${gEmail}`,
      });
    } else if (perfil === "professor") {
      const pNome = nome.trim() ? (nome.trim().startsWith("Prof") ? nome.trim() : `Prof. ${nome.trim()}`) : "Prof. Novo Professor";
      const pMod = modalidade || "Jiu Jitsu";
      const pUni = unidade || "Complexo da Penha";
      const pEmail = email.trim().toLowerCase();
      const pSenha = senha.trim();

      const novaSolicitacao = {
        id: `solic-${Date.now()}`,
        professorNome: pNome,
        email: pEmail,
        senha: pSenha,
        telefone: telefone.trim(),
        atividadeNome: pMod,
        turmaNome: turmaEscolhida,
        poloNome: pUni,
        status: "pendente",
        docIdName: docIdName || null,
        docResName: docResName || null,
        docFuncName: docFuncName || null,
        cert1Name: cert1Name || null,
        cert2Name: cert2Name || null,
        cert3Name: cert3Name || null,
        cert4Name: cert4Name || null,
        dataSolicitacao: new Date().toISOString().slice(0, 10),
      };

      try {
        const stored = localStorage.getItem("cufa_professores_solicitacoes");
        let list = stored ? JSON.parse(stored) : [];
        list.push(novaSolicitacao);
        localStorage.setItem("cufa_professores_solicitacoes", JSON.stringify(list));

        // Also add to registered list for login
        const storedCad = localStorage.getItem("cufa_professores_cadastrados");
        let listCad = storedCad ? JSON.parse(storedCad) : [];
        listCad.push(novaSolicitacao);
        localStorage.setItem("cufa_professores_cadastrados", JSON.stringify(listCad));

        window.dispatchEvent(new Event("cufa_professores_updated"));
      } catch {}

      localStorage.setItem("cufa_logged_user", pEmail);
      localStorage.setItem("cufa_logged_role", "professor");
      localStorage.setItem("cufa_professor_nome", pNome);
      localStorage.setItem("cufa_polo_atribuido", pUni);

      toast.success("Conta de Professor criada com sucesso!", {
        description: `Acesso liberado. A modalidade ${pMod} aguarda homologação do polo.`,
      });

      fechar(false);
      triggerAuthRedirect("/professor", "Acessando Painel do Professor...");
      return;
    } else {
      toast.success("Cadastro realizado com sucesso!", {
        description: "Seu acesso à plataforma foi liberado imediatamente.",
      });
    }

    fechar(false);
  }

  return (
    <>
      <AuthLoadingOverlay open={overlayOpen} message={overlayMsg} onComplete={handleOverlayComplete} />
      <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl">
            {atual ? atual.titulo : "Criar sua conta"}
          </DialogTitle>
          <DialogDescription>
            {atual
              ? "Preencha os dados e defina sua senha para cadastrar seu acesso imediatamente."
              : "Escolha o seu perfil na plataforma CUFA."}
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
            <Campo id="nome" label="Nome completo" required placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="email" label="E-mail" type="email" required placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Campo id="tel" label="Telefone / WhatsApp" required placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                id="senha"
                label="Criar Senha de Acesso"
                type="password"
                required
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
              <Campo
                id="confirmarSenha"
                label="Confirmar Senha"
                type="password"
                required
                placeholder="••••••••"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
            </div>

            {perfil === "responsavel" && (
              <>
                <Campo id="cpf" label="CPF" required placeholder="000.000.000-00" />
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Unidade / Polo Responsável</Label>
                  <Select value={unidade} onValueChange={setUnidade}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a unidade" />
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
                    <Select value={modalidade} onValueChange={setModalidade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a modalidade" />
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Unidade / Polo</Label>
                    <Select value={unidade} onValueChange={setUnidade}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a unidade" />
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

                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Turma e Horário Desejado</Label>
                    <Select value={turmaEscolhida} onValueChange={setTurmaEscolhida}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Turma 1 - Tarde (14h - 16h)">Turma 1 - Tarde (14h - 16h)</SelectItem>
                        <SelectItem value="Turma 2 - Tarde (16h - 18h)">Turma 2 - Tarde (16h - 18h)</SelectItem>
                        <SelectItem value="Turma Manhã (09h - 11h)">Turma Manhã (09h - 11h)</SelectItem>
                        <SelectItem value="Turma Noite (18h - 20h)">Turma Noite (18h - 20h)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Upload de Documentação e Certificados do Professor com Botão Estilizado (Anexo 3) */}
                <div className="border-t border-border pt-4 mt-2 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-primary">
                    <Upload className="size-4" />
                    <span>Upload de Documentação (Opcional)</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FileUploadBtn
                      id="doc-id"
                      label="Documento de Identificação (RG / CPF)"
                      fileName={docIdName}
                      onSelect={(n) => setDocIdName(n)}
                    />
                    <FileUploadBtn
                      id="doc-res"
                      label="Comprovante de Residência"
                      fileName={docResName}
                      onSelect={(n) => setDocResName(n)}
                    />
                  </div>

                  <FileUploadBtn
                    id="doc-func"
                    label="Comprovante Funcional / Carteira Profissional (Opcional)"
                    fileName={docFuncName}
                    onSelect={(n) => setDocFuncName(n)}
                  />

                  {/* Até 4 Certificados / Graduação */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <Label className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">
                      Certificados / Graduação (Até 4 arquivos)
                    </Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FileUploadBtn id="cert-1" label="Certificado 1" fileName={cert1Name} onSelect={(n) => setCert1Name(n)} />
                      <FileUploadBtn id="cert-2" label="Certificado 2" fileName={cert2Name} onSelect={(n) => setCert2Name(n)} />
                      <FileUploadBtn id="cert-3" label="Certificado 3" fileName={cert3Name} onSelect={(n) => setCert3Name(n)} />
                      <FileUploadBtn id="cert-4" label="Certificado 4" fileName={cert4Name} onSelect={(n) => setCert4Name(n)} />
                    </div>
                  </div>
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
    </>
  );
}
