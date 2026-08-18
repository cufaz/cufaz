import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User,
  Upload,
  Save,
  CheckCircle2,
  FileText,
  School,
  Users,
  MapPin,
  HeartPulse,
} from "lucide-react";
import { toast } from "sonner";
import { formatCPF, formatPhone, capitalizeWords } from "@/lib/formatters";
import { getAvatarLocal, setAvatarLocal } from "@/lib/cadastros";
import { AlunoShell } from "@/components/aluno/AlunoShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateTermoAutorizacaoPdf } from "@/lib/pdfAutorizacao";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/aluno/perfil")({
  component: PerfilAlunoPage,
});

function PerfilAlunoPage() {
  const [alunoEmail, setAlunoEmail] = useState("");
  const [nome, setNome] = useState("Aluno");
  const [telefone, setTelefone] = useState("");
  const [dataNasc, setDataNasc] = useState("");
  const [nomeEscola, setNomeEscola] = useState("");
  const [anoEscolar, setAnoEscolar] = useState("1º Ano - Ensino Fundamental");
  const [turnoEscolar, setTurnoEscolar] = useState("Manhã");
  const [qtdPessoasResidencia, setQtdPessoasResidencia] = useState("4");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const [telResponsavel, setTelResponsavel] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);

  // Extended fields
  const [hospitalEmergencia, setHospitalEmergencia] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("Rio de Janeiro");
  const [uf, setUf] = useState("RJ");
  const [telefonePai, setTelefonePai] = useState("");
  const [telefoneVizinho, setTelefoneVizinho] = useState("");
  const [telefoneAvo, setTelefoneAvo] = useState("");

  // Document names
  const [docIdName, setDocIdName] = useState<string | null>(null);
  const [docResName, setDocResName] = useState<string | null>(null);
  const [termoAutorizacaoName, setTermoAutorizacaoName] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = (localStorage.getItem("cufa_logged_user") || "aluno@cufa.com.br").toLowerCase();
    setAlunoEmail(userEmail);

    const fUser = getAvatarLocal(userEmail);
    if (fUser) setFotoPerfil(fUser);

    loadAlunoProfileDB(userEmail);
  }, []);

  async function loadAlunoProfileDB(emailClean: string) {
    // 1. Try DB fetch first from cadastros_alunos
    try {
      const { data, error } = await supabase
        .from("cadastros_alunos" as any)
        .select("*")
        .eq("email", emailClean)
        .maybeSingle();

      if (data && !error) {
        populateFields(data);
        return;
      }
    } catch {}

    // 2. Fallback to localStorage
    try {
      const stored = localStorage.getItem("cufa_alunos_cadastrados");
      if (stored) {
        const parsed = JSON.parse(stored);
        const found = parsed.find((a: any) => String(a.email || "").toLowerCase() === emailClean);
        if (found) {
          populateFields(found);
        }
      }
    } catch {}
  }

  function populateFields(data: any) {
    if (data.nome) setNome(data.nome);
    if (data.telefone) setTelefone(data.telefone);
    if (data.dataNasc || data.data_nasc) setDataNasc(data.dataNasc || data.data_nasc);
    if (data.nomeEscola || data.nome_escola) setNomeEscola(data.nomeEscola || data.nome_escola);
    if (data.anoEscolar || data.ano_escolar) setAnoEscolar(data.anoEscolar || data.ano_escolar);
    if (data.turnoEscolar || data.turno_escolar) setTurnoEscolar(data.turnoEscolar || data.turno_escolar);
    if (data.qtdPessoasResidencia || data.qtd_pessoas_residencia) setQtdPessoasResidencia(String(data.qtdPessoasResidencia || data.qtd_pessoas_residencia));
    if (data.nomeResponsavel || data.nome_responsavel) setNomeResponsavel(data.nomeResponsavel || data.nome_responsavel);
    if (data.cpfResponsavel || data.cpf_responsavel) setCpfResponsavel(data.cpfResponsavel || data.cpf_responsavel);
    if (data.telResponsavel || data.tel_responsavel) setTelResponsavel(data.telResponsavel || data.tel_responsavel);
    if (data.docIdName) setDocIdName(data.docIdName);
    if (data.docResName) setDocResName(data.docResName);
    if (data.termoAutorizacaoName) setTermoAutorizacaoName(data.termoAutorizacaoName);

    if (data.hospitalEmergencia || data.hospital_emergencia) setHospitalEmergencia(data.hospitalEmergencia || data.hospital_emergencia);
    if (data.cep) setCep(data.cep);
    if (data.endereco) setEndereco(data.endereco);
    if (data.numero) setNumero(data.numero);
    if (data.bairro) setBairro(data.bairro);
    if (data.cidade) setCidade(data.cidade);
    if (data.uf) setUf(data.uf);
    if (data.telefonePai || data.telefone_pai) setTelefonePai(data.telefonePai || data.telefone_pai);
    if (data.telefoneVizinho || data.telefone_vizinho) setTelefoneVizinho(data.telefoneVizinho || data.telefone_vizinho);
    if (data.telefoneAvo || data.telefone_avo) setTelefoneAvo(data.telefoneAvo || data.telefone_avo);
  }

  async function handleCepLookup(rawCep: string) {
    setCep(rawCep);
    const clean = rawCep.replace(/\D/g, "");
    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEndereco(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "Rio de Janeiro");
          setUf(data.uf || "RJ");
          toast.success("Endereço preenchido automaticamente via CEP!");
        }
      } catch {}
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    try {
      localStorage.setItem("cufa_aluno_nome", nome);
      if (telefone) localStorage.setItem("cufa_aluno_telefone", telefone);
      if (fotoPerfil) {
        setAvatarLocal(alunoEmail, fotoPerfil);
      }

      const payload = {
        email: alunoEmail.toLowerCase(),
        nome,
        telefone,
        data_nasc: dataNasc,
        nome_escola: nomeEscola,
        ano_escolar: anoEscolar,
        turno_escolar: turnoEscolar,
        qtd_pessoas_residencia: Number(qtdPessoasResidencia) || 1,
        nome_responsavel: nomeResponsavel,
        cpf_responsavel: cpfResponsavel,
        tel_responsavel: telResponsavel,
        hospitalEmergencia,
        cep,
        endereco,
        numero,
        bairro,
        cidade,
        uf,
        telefonePai,
        telefoneVizinho,
        telefoneAvo,
        docIdName,
        docResName,
        termoAutorizacaoName,
      };

      // 1. Save to Supabase DB table cadastros_alunos
      await supabase.from("cadastros_alunos" as any).upsert(payload as any, { onConflict: "email" });

      // 2. Save to localStorage cufa_alunos_cadastrados
      const stored = localStorage.getItem("cufa_alunos_cadastrados");
      let list = stored ? JSON.parse(stored) : [];
      const idx = list.findIndex((a: any) => String(a.email || "").toLowerCase() === alunoEmail.toLowerCase());
      if (idx !== -1 && list[idx]) {
        list[idx] = { ...list[idx], ...payload };
      } else {
        list.push({ id: `aluno-${Date.now()}`, ...payload });
      }
      localStorage.setItem("cufa_alunos_cadastrados", JSON.stringify(list));
      window.dispatchEvent(new Event("cufa_alunos_updated"));

      toast.success("Perfil de Aluno atualizado com sucesso!");
    } catch {
      toast.error("Erro ao salvar perfil.");
    }
  }

  function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>, type: "id" | "res" | "termo") {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (type === "id") setDocIdName(file.name);
      else if (type === "res") setDocResName(file.name);
      else setTermoAutorizacaoName(file.name);
      toast.success(`Documento (${file.name}) anexado com sucesso.`);
    };
    reader.readAsDataURL(file);
  }

  function handleGerarTermoPdf() {
    generateTermoAutorizacaoPdf({
      nomeAluno: nome,
      dataNasc,
      polo: "Complexo da Penha",
      modalidade: "Jiu Jitsu",
      nomeResponsavel,
      cpfResponsavel,
      telefoneResponsavel: telResponsavel || telefone,
      hospitalEmergencia,
      cep,
      endereco,
      numero,
      bairro,
      cidade,
      uf,
      telefonePai,
      telefoneVizinho,
      telefoneAvo,
    });
    toast.success("Termo de Autorização gerado em PDF!");
  }

  return (
    <AlunoShell
      title="Meu Perfil de Aluno"
      description="Gerencie seus dados pessoais, endereço, contatos de emergência e documentos anexados."
    >
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Card Foto e Identificação */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="size-4 text-primary" />
              <span>Foto de Perfil & Identificação</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Avatar className="size-20 border-2 border-primary/40 shadow-xs">
                {fotoPerfil && <AvatarImage src={fotoPerfil} alt={nome} className="object-cover" />}
                <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                  {nome.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 text-center sm:text-left">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 font-bold text-xs cursor-pointer shadow-xs transition-colors">
                  <Upload className="size-4" />
                  <span>{fotoPerfil ? "Alterar Foto de Perfil" : "Escolher foto de perfil"}</span>
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
                <p className="text-[11px] text-muted-foreground">Envie uma foto clara no formato JPG, PNG ou WEBP.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome Completo do Aluno</Label>
                <Input value={nome} onChange={(e) => setNome(capitalizeWords(e.target.value))} required className="text-xs font-medium" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">E-mail de Login</Label>
                <Input value={alunoEmail} disabled className="text-xs font-medium bg-muted/50 cursor-not-allowed" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Telefone / WhatsApp</Label>
                <Input value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className="text-xs font-medium" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Data de Nascimento</Label>
                <Input type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} className="text-xs font-medium" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Endereço Completo & Hospital de Emergência */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <span>Endereço Residencial & Emergência</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CEP (Busca Automática)</Label>
                <Input
                  value={cep}
                  onChange={(e) => handleCepLookup(e.target.value)}
                  placeholder="00000-000"
                  className="text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Endereço (Rua / Avenida / Alameda)</Label>
                <Input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="ex.: Rua Principal, nº 100"
                  className="text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Número / Complemento</Label>
                <Input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="ex.: Bloco B, Ap 202"
                  className="text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Bairro</Label>
                <Input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="ex.: Penha"
                  className="text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cidade / UF</Label>
                <div className="flex gap-2">
                  <Input value={cidade} onChange={(e) => setCidade(e.target.value)} className="text-xs font-medium flex-1" />
                  <Input value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} className="text-xs font-bold w-16 uppercase" />
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="size-3.5 text-rose-500" /> Hospital Preferencial de Emergência
              </Label>
              <Input
                value={hospitalEmergencia}
                onChange={(e) => setHospitalEmergencia(e.target.value)}
                placeholder="ex.: UPA Penha, Hospital Getúlio Vargas..."
                className="text-xs font-medium"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card Informações Escolares */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <School className="size-4 text-primary" />
              <span>Informações Escolares</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome da Escola em que Estuda</Label>
                <Input value={nomeEscola} onChange={(e) => setNomeEscola(capitalizeWords(e.target.value))} placeholder="ex.: E.M. Paulo Freire" className="text-xs font-medium" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ano Escolar</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium"
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
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Turno Escolar</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs font-medium"
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
          </CardContent>
        </Card>

        {/* Card Responsável Legal & Contatos Adicionais de Emergência */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <span>Responsável Legal & Contatos Adicionais de Emergência</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pessoas na Residência</Label>
                <Input type="number" min={1} value={qtdPessoasResidencia} onChange={(e) => setQtdPessoasResidencia(e.target.value)} className="text-xs font-medium" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome do Responsável Principal</Label>
                <Input value={nomeResponsavel} onChange={(e) => setNomeResponsavel(capitalizeWords(e.target.value))} placeholder="ex.: Maria da Silva" className="text-xs font-medium" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CPF do Responsável</Label>
                <Input value={cpfResponsavel} onChange={(e) => setCpfResponsavel(formatCPF(e.target.value))} placeholder="000.000.000-00" className="text-xs font-medium" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Telefone do Responsável</Label>
                <Input value={telResponsavel} onChange={(e) => setTelResponsavel(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className="text-xs font-medium" />
              </div>
            </div>

            {/* Contatos Adicionais (Telefone do Pai, Vizinho, Avó) */}
            <div className="pt-2 border-t border-border/60">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-3">
                Contatos Secundários / Adicionais de Emergência
              </Label>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">Telefone do Pai</Label>
                  <Input
                    value={telefonePai}
                    onChange={(e) => setTelefonePai(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">Telefone do Vizinho / Conhecido</Label>
                  <Input
                    value={telefoneVizinho}
                    onChange={(e) => setTelefoneVizinho(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-foreground">Telefone da Avó / Parente</Label>
                  <Input
                    value={telefoneAvo}
                    onChange={(e) => setTelefoneAvo(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="text-xs font-medium"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Documentos Anexados & Termo de Autorização */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="size-4 text-emerald-600" />
              <span>Documentação Anexada & Termo de Autorização</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                  <FileText className="size-4 text-orange-600" /> Termo de Autorização Preenchido Automaticamente
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Gere o PDF com os dados do aluno e do responsável. Imprima, assine e anexe a foto/PDF assinado abaixo.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleGerarTermoPdf}
                className="bg-brand-gradient text-white font-black text-xs h-9 px-4 shadow-brand shrink-0 w-full sm:w-auto"
              >
                📄 Gerar Termo (PDF)
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="size-4 text-primary shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">RG / CPF (Identificação)</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {docIdName ? docIdName : "Nenhum arquivo anexado"}
                    </span>
                  </div>
                </div>
                <label className="cursor-pointer">
                  <Button variant="ghost" size="sm" type="button" className="text-xs h-8 font-bold pointer-events-none">
                    Substituir
                  </Button>
                  <input type="file" accept="*/*" className="hidden" onChange={(e) => handleDocUpload(e, "id")} />
                </label>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="size-4 text-primary shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">Comprovante Residência</span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {docResName ? docResName : "Nenhum arquivo anexado"}
                    </span>
                  </div>
                </div>
                <label className="cursor-pointer">
                  <Button variant="ghost" size="sm" type="button" className="text-xs h-8 font-bold pointer-events-none">
                    Substituir
                  </Button>
                  <input type="file" accept="*/*" className="hidden" onChange={(e) => handleDocUpload(e, "res")} />
                </label>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">Termo de Autorização Assinado</span>
                    <span className="text-[10px] text-emerald-700 font-extrabold">
                      {termoAutorizacaoName ? termoAutorizacaoName : "Pendente envio"}
                    </span>
                  </div>
                </div>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" type="button" className="text-xs h-8 font-bold pointer-events-none border-emerald-500/40 text-emerald-700">
                    Anexar
                  </Button>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocUpload(e, "termo")} />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end pt-2">
          <Button type="submit" className="bg-brand-gradient text-primary-foreground font-extrabold text-xs shadow-brand px-6 h-10">
            <Save className="size-4 mr-2" /> Salvar Alterações do Perfil
          </Button>
        </div>
      </form>
    </AlunoShell>
  );
}
