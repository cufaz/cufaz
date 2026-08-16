import { useState } from "react";
import { GraduationCap, ShieldCheck, UserRound, ArrowLeft, Upload, Camera } from "lucide-react";
import { toast } from "sonner";
import { AuthLoadingOverlay } from "@/components/site/AuthLoadingOverlay";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCPF, formatPhone, capitalizeWords } from "@/lib/formatters";

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

function getRegisteredPolosList(): string[] {
  const listMap = new Set<string>();

  try {
    const stored = localStorage.getItem("cufa_polos_cadastrados");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        parsed.forEach((p: any) => {
          if (p.nome) listMap.add(p.nome);
        });
      }
    }
  } catch {}

  if (listMap.size === 0) {
    listMap.add("Complexo da Penha");
    listMap.add("Paraisópolis");
    listMap.add("Viaduto de Madureira");
    listMap.add("Heliópolis");
    listMap.add("Polo de Teste");
  }

  return Array.from(listMap);
}

const comunidades = [
  "Madureira",
  "Complexo da Penha",
  "Paraisópolis",
  "Heliópolis",
  "Polo de Teste",
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
  onSelect: (name: string | null, base64: string | null) => void;
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
            accept="*/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                onSelect(null, null);
                return;
              }
              const reader = new FileReader();
              reader.onload = (evt) => {
                const b64 = evt.target?.result as string;
                onSelect(file.name, b64);
              };
              reader.readAsDataURL(file);
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

  // Uploaded File Name & Data States (Anexo 3)
  const [docIdName, setDocIdName] = useState<string | null>(null);
  const [docIdData, setDocIdData] = useState<string | null>(null);
  const [docResName, setDocResName] = useState<string | null>(null);
  const [docResData, setDocResData] = useState<string | null>(null);
  const [docFuncName, setDocFuncName] = useState<string | null>(null);
  const [docFuncData, setDocFuncData] = useState<string | null>(null);
  const [cert1Name, setCert1Name] = useState<string | null>(null);
  const [cert2Name, setCert2Name] = useState<string | null>(null);
  const [cert3Name, setCert3Name] = useState<string | null>(null);
  const [cert4Name, setCert4Name] = useState<string | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  // Student specific state
  const [dataNasc, setDataNasc] = useState("");
  const [nomeEscola, setNomeEscola] = useState("");
  const [anoEscolar, setAnoEscolar] = useState("1º Ano - Ensino Fundamental");
  const [turnoEscolar, setTurnoEscolar] = useState("Manhã");
  const [qtdPessoasResidencia, setQtdPessoasResidencia] = useState("4");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const [telResponsavel, setTelResponsavel] = useState("");
  const [docIdAlunoName, setDocIdAlunoName] = useState<string | null>(null);
  const [docIdAlunoData, setDocIdAlunoData] = useState<string | null>(null);
  const [docResAlunoName, setDocResAlunoName] = useState<string | null>(null);
  const [docResAlunoData, setDocResAlunoData] = useState<string | null>(null);

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
        setFotoPerfil(null);
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

      localStorage.setItem("cufa_logged_user", gEmail);
      localStorage.setItem("cufa_logged_role", "responsavel");
      localStorage.setItem("cufa_polo_atribuido", uNome);
      localStorage.setItem(`cufa_logged_name_${gEmail}`, gNome);
      localStorage.setItem(`cufa_responsavel_perfil_${gEmail}`, JSON.stringify({
        nome: gNome,
        email: gEmail,
        telefone: telefone.trim(),
        polo: uNome,
        fotoUrl: "",
        biografia: "",
      }));

      toast.success("Cadastro de Responsável liberado com sucesso!", {
        description: `Acesso liberado para a unidade ${uNome}. E-mail: ${gEmail}`,
      });

      fechar(false);
      triggerAuthRedirect("/polo", `Acessando Painel da Unidade ${uNome}...`);
      return;
    } else if (perfil === "professor") {
      const pNome = nome.trim() ? (nome.trim().startsWith("Prof") ? nome.trim() : `Prof. ${nome.trim()}`) : "Prof. Novo Professor";
      const pEmail = email.trim().toLowerCase();
      const pSenha = senha.trim();

      const novoProf = {
        id: `prof-${Date.now()}`,
        professorNome: pNome,
        email: pEmail,
        senha: pSenha,
        telefone: telefone.trim(),
        status: "ativo",
        docIdName: docIdName || null,
        docIdData: docIdData || null,
        docResName: docResName || null,
        docResData: docResData || null,
        docFuncName: docFuncName || null,
        docFuncData: docFuncData || null,
        cert1Name: cert1Name || null,
        cert2Name: cert2Name || null,
        cert3Name: cert3Name || null,
        cert4Name: cert4Name || null,
        dataCriacao: new Date().toISOString().slice(0, 10),
      };

      try {
        const storedCad = localStorage.getItem("cufa_professores_cadastrados");
        let listCad = storedCad ? JSON.parse(storedCad) : [];
        listCad.push(novoProf);
        localStorage.setItem("cufa_professores_cadastrados", JSON.stringify(listCad));

        if (fotoPerfil) {
          localStorage.setItem("cufa_perfil_foto", fotoPerfil);
          localStorage.setItem(`cufa_perfil_foto_${pEmail}`, fotoPerfil);
          window.dispatchEvent(new Event("cufa_perfil_foto_updated"));
        }

        window.dispatchEvent(new Event("cufa_professores_updated"));
      } catch {}

      localStorage.setItem("cufa_logged_user", pEmail);
      localStorage.setItem("cufa_logged_role", "professor");
      localStorage.setItem("cufa_professor_nome", pNome);
      if (telefone.trim()) {
        localStorage.setItem("cufa_professor_telefone", telefone.trim());
      }

      toast.success("Conta de Professor criada com sucesso!", {
        description: "Acesso liberado! Você já pode se candidatar às vagas e turmas disponíveis.",
      });

      fechar(false);
      triggerAuthRedirect("/professor", "Acessando Painel do Professor...");
      return;
    } else if (perfil === "aluno") {
      const aNome = nome.trim() || "Aluno";
      const aEmail = email.trim().toLowerCase();
      const aSenha = senha.trim();

      const novoAluno = {
        id: `aluno-${Date.now()}`,
        nome: aNome,
        email: aEmail,
        senha: aSenha,
        telefone: telefone.trim(),
        dataNasc,
        nomeEscola,
        anoEscolar,
        turnoEscolar,
        qtdPessoasResidencia,
        nomeResponsavel,
        cpfResponsavel,
        telResponsavel,
        docIdName: docIdAlunoName,
        docIdData: docIdAlunoData,
        docResName: docResAlunoName,
        docResData: docResAlunoData,
        dataCriacao: new Date().toISOString().slice(0, 10),
      };

      try {
        const stored = localStorage.getItem("cufa_alunos_cadastrados");
        let list = stored ? JSON.parse(stored) : [];
        list.push(novoAluno);
        localStorage.setItem("cufa_alunos_cadastrados", JSON.stringify(list));

        if (fotoPerfil) {
          localStorage.setItem("cufa_perfil_foto", fotoPerfil);
          localStorage.setItem(`cufa_perfil_foto_${aEmail}`, fotoPerfil);
          window.dispatchEvent(new Event("cufa_perfil_foto_updated"));
        }
        window.dispatchEvent(new Event("cufa_alunos_updated"));
      } catch {}

      localStorage.setItem("cufa_logged_user", aEmail);
      localStorage.setItem("cufa_logged_role", "aluno");
      localStorage.setItem("cufa_aluno_nome", aNome);
      if (telefone.trim()) {
        localStorage.setItem("cufa_aluno_telefone", telefone.trim());
      }

      toast.success("Conta de Aluno criada com sucesso!", {
        description: "Acesso liberado imediatamente! Seja bem-vindo à plataforma CUFA.",
      });

      fechar(false);
      triggerAuthRedirect("/aluno", "Acessando Painel do Aluno...");
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
            <Campo
              id="nome"
              label={perfil === "aluno" ? "Nome Completo do Aluno" : "Nome completo"}
              required
              placeholder={perfil === "aluno" ? "Nome do aluno" : "Seu nome"}
              value={nome}
              onChange={(e) => setNome(capitalizeWords(e.target.value))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="email" label="E-mail" type="email" required placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Campo id="tel" label="Telefone / WhatsApp" required placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} />
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
                      {getRegisteredPolosList().map((c) => (
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
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground font-bold block">
                      Foto de Perfil (Opcional)
                    </Label>
                    <div className="flex items-center gap-3">
                      {fotoPerfil ? (
                        <img
                          src={fotoPerfil}
                          alt="Foto do Professor"
                          className="size-10 rounded-full object-cover border-2 border-primary shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="size-10 rounded-full bg-primary/10 border-2 border-dashed border-primary/30 flex items-center justify-center text-primary font-bold shrink-0">
                          <Camera className="size-4" />
                        </div>
                      )}
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 font-bold text-xs cursor-pointer shadow-xs transition-colors shrink-0">
                        <Upload className="size-3.5" />
                        <span>{fotoPerfil ? "Alterar Foto" : "Escolher arquivo"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const base64 = ev.target?.result as string;
                                setFotoPerfil(base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
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
                      onSelect={(n, d) => {
                        setDocIdName(n);
                        setDocIdData(d);
                      }}
                    />
                    <FileUploadBtn
                      id="doc-res"
                      label="Comprovante de Residência"
                      fileName={docResName}
                      onSelect={(n, d) => {
                        setDocResName(n);
                        setDocResData(d);
                      }}
                    />
                  </div>

                  <FileUploadBtn
                    id="doc-func"
                    label="Comprovante Funcional / Carteira Profissional (Opcional)"
                    fileName={docFuncName}
                    onSelect={(n, d) => {
                      setDocFuncName(n);
                      setDocFuncData(d);
                    }}
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
                {/* Upload Foto de Perfil do Aluno */}
                <div className="space-y-1.5 p-3 rounded-2xl bg-muted/40 border border-border/80">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                    Foto de Perfil do Aluno (Opcional)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-12 border border-primary/40">
                      {fotoPerfil && <AvatarImage src={fotoPerfil} alt="Perfil" className="object-cover" />}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        AL
                      </AvatarFallback>
                    </Avatar>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 font-bold text-xs cursor-pointer shadow-xs transition-colors shrink-0">
                      <Upload className="size-3.5" />
                      <span>{fotoPerfil ? "Alterar Foto" : "Escolher foto de perfil"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setFotoPerfil(ev.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="nasc" label="Data de Nascimento" type="date" required value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} />
                  <Campo id="esc-nome" label="Nome da Escola em que Estuda" placeholder="ex.: E.M. Paulo Freire" value={nomeEscola} onChange={(e) => setNomeEscola(e.target.value)} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Ano Escolar</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-medium"
                      value={anoEscolar}
                      onChange={(e) => setAnoEscolar(e.target.value)}
                    >
                      <option value="1º Ano - Ensino Fundamental">1º Ano - Ensino Fundamental</option>
                      <option value="2º Ano - Ensino Fundamental">2º Ano - Ensino Fundamental</option>
                      <option value="3º Ano - Ensino Fundamental">3º Ano - Ensino Fundamental</option>
                      <option value="4º Ano - Ensino Fundamental">4º Ano - Ensino Fundamental</option>
                      <option value="5º Ano - Ensino Fundamental">5º Ano - Ensino Fundamental</option>
                      <option value="6º Ano - Ensino Fundamental">6º Ano - Ensino Fundamental</option>
                      <option value="7º Ano - Ensino Fundamental">7º Ano - Ensino Fundamental</option>
                      <option value="8º Ano - Ensino Fundamental">8º Ano - Ensino Fundamental</option>
                      <option value="9º Ano - Ensino Fundamental">9º Ano - Ensino Fundamental</option>
                      <option value="1º Ano - Ensino Médio">1º Ano - Ensino Médio</option>
                      <option value="2º Ano - Ensino Médio">2º Ano - Ensino Médio</option>
                      <option value="3º Ano - Ensino Médio">3º Ano - Ensino Médio</option>
                      <option value="Ensino Superior / Outros">Ensino Superior / Outros</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Turno Escolar</Label>
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-medium"
                      value={turnoEscolar}
                      onChange={(e) => setTurnoEscolar(e.target.value)}
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                      <option value="Integral">Integral</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="qtd-pessoas" label="Pessoas que residem com o aluno" type="number" min={1} placeholder="ex.: 4" value={qtdPessoasResidencia} onChange={(e) => setQtdPessoasResidencia(e.target.value)} />
                  <Campo id="cpf-resp" label="CPF do Responsável" placeholder="000.000.000-00" value={cpfResponsavel} onChange={(e) => setCpfResponsavel(formatCPF(e.target.value))} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo id="resp-nome" label="Nome do Responsável Legal" placeholder="ex.: Maria da Silva" value={nomeResponsavel} onChange={(e) => setNomeResponsavel(capitalizeWords(e.target.value))} />
                  <Campo id="resp-tel" label="Telefone do Responsável" placeholder="(00) 00000-0000" value={telResponsavel} onChange={(e) => setTelResponsavel(formatPhone(e.target.value))} />
                </div>

                <div className="border-t border-border pt-4 mt-2 space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-primary block">
                    Documentos do Aluno
                  </Label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FileUploadBtn
                      id="doc-id-aluno"
                      label="Documento de Identificação (RG / CPF)"
                      fileName={docIdAlunoName}
                      onSelect={(n, d) => {
                        setDocIdAlunoName(n);
                        setDocIdAlunoData(d);
                      }}
                    />
                    <FileUploadBtn
                      id="doc-res-aluno"
                      label="Comprovante de Residência"
                      fileName={docResAlunoName}
                      onSelect={(n, d) => {
                        setDocResAlunoName(n);
                        setDocResAlunoData(d);
                      }}
                    />
                  </div>
                </div>
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
