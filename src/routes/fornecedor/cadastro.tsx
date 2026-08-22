import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Truck,
  Upload,
  Sparkles,
  FileCheck2,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Building,
  CreditCard,
  FileText,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/site/SiteHeader";
import { parseCnpjCardOcr, createFornecedorPublicDB } from "@/lib/fornecedoresService";

export const Route = createFileRoute("/fornecedor/cadastro")({
  component: FornecedorCadastroPage,
});

interface PropostaFormItem {
  id: string;
  titulo: string;
  descricao: string;
  valor: number;
  prazo: string;
}

interface CnaeFormItem {
  id: string;
  codigo: string;
  descricao: string;
}

function FornecedorCadastroPage() {
  const [parsingOcr, setParsingOcr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [concluido, setConcluido] = useState(false);

  // Form Fields - Dados Oficiais RFB
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [dataAbertura, setDataAbertura] = useState("15/03/2018");
  const [porte, setPorte] = useState("ME");
  const [situacaoCadastral, setSituacaoCadastral] = useState("ATIVA");
  const [naturezaJuridica, setNaturezaJuridica] = useState("206-2 - Sociedade Empresária Limitada");

  // CNAE Principal (Código + Descrição)
  const [cnaePrincipalCodigo, setCnaePrincipalCodigo] = useState("47.89-0-99");
  const [cnaePrincipalDescricao, setCnaePrincipalDescricao] = useState("Comércio varejista de outros produtos não especificados anteriormente");
  const [cnae, setCnae] = useState("47.89-0-99 - Comércio varejista de outros produtos");

  // CNAEs Secundários (Lista dinâmica com código + descrição)
  const [cnaeSecundarios, setCnaeSecundarios] = useState<CnaeFormItem[]>([
    { id: "s1", codigo: "56.20-1-01", descricao: "Fornecimento de alimentos preparados para empresas" },
    { id: "s2", codigo: "73.19-0-02", descricao: "Promotores de vendas" },
    { id: "s3", codigo: "82.30-0-01", descricao: "Serviços de organização de feiras, congressos e festas" },
  ]);

  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("Rio de Janeiro");
  const [uf, setUf] = useState("RJ");
  const [cep, setCep] = useState("");

  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const [bancoNome, setBancoNome] = useState("");
  const [bancoAgencia, setBancoAgencia] = useState("");
  const [bancoConta, setBancoConta] = useState("");
  const [bancoPix, setBancoPix] = useState("");

  const [atividadesTexto, setAtividadesTexto] = useState("");
  const [propostas, setPropostas] = useState<PropostaFormItem[]>([
    {
      id: "1",
      titulo: "Proposta Comercial Inicial",
      descricao: "Descreva brevemente os produtos/serviços oferecidos e valores...",
      valor: 0,
      prazo: "15 dias",
    },
  ]);

  // Step 1: Upload Cartão CNPJ (PDF) with AI extraction
  async function handleFileUploadOcr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Formato inválido. Envie o Cartão CNPJ em PDF.");
      e.target.value = "";
      return;
    }

    setParsingOcr(true);
    toast.info("Lendo o Cartão CNPJ...");

    try {
      const result = await parseCnpjCardOcr(file);
      setCnpj(result.cnpj);
      setRazaoSocial(result.razao_social);
      setNomeFantasia(result.nome_fantasia);
      setDataAbertura(result.data_abertura);
      setPorte(result.porte);
      setNaturezaJuridica(result.natureza_juridica);
      setSituacaoCadastral(result.situacao_cadastral);
      setCnaePrincipalCodigo(result.cnae_principal_codigo);
      setCnaePrincipalDescricao(result.cnae_principal_descricao);
      setCnae(result.cnae);

      const extra = result as unknown as { email?: string; telefone?: string };
      if (extra.email) setEmail(extra.email);
      if (extra.telefone) setTelefone(extra.telefone);

      setCnaeSecundarios(
        (result.cnae_secundarios ?? []).map((item, idx) => ({
          id: `sec-${idx}-${Date.now()}`,
          codigo: item.codigo,
          descricao: item.descricao,
        }))
      );

      setEndereco(result.endereco);
      setCidade(result.cidade);
      setUf(result.uf);
      setCep(result.cep);
      toast.success("Cartão CNPJ lido! Confira os campos preenchidos.");
    } catch (err) {
      toast.error(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível ler o cartão. Preencha os campos manualmente."
      );
    } finally {
      setParsingOcr(false);
      e.target.value = "";
    }
  }


  function addCnaeSecundarioRow() {
    setCnaeSecundarios((prev) => [
      ...prev,
      { id: String(Date.now()), codigo: "", descricao: "" },
    ]);
  }

  function removeCnaeSecundarioRow(id: string) {
    setCnaeSecundarios((prev) => prev.filter((item) => item.id !== id));
  }

  function addPropostaRow() {
    setPropostas((prev) => [
      ...prev,
      { id: String(Date.now()), titulo: "", descricao: "", valor: 0, prazo: "15 dias" },
    ]);
  }

  function removePropostaRow(id: string) {
    setPropostas((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cnpj || !razaoSocial || !email) {
      toast.error("Preencha CNPJ, Razão Social e E-mail de contato.");
      return;
    }

    setSubmitting(true);
    try {
      const fullCnaePrincipal = `${cnaePrincipalCodigo} - ${cnaePrincipalDescricao}`;
      await createFornecedorPublicDB(
        {
          cnpj,
          razao_social: razaoSocial,
          nome_fantasia: nomeFantasia,
          data_abertura: dataAbertura,
          porte,
          natureza_juridica: naturezaJuridica,
          situacao_cadastral: situacaoCadastral,
          cnae_principal_codigo: cnaePrincipalCodigo,
          cnae_principal_descricao: cnaePrincipalDescricao,
          cnae: fullCnaePrincipal,
          cnae_secundarios: cnaeSecundarios
            .filter((s) => s.codigo.trim() || s.descricao.trim())
            .map((s) => ({ codigo: s.codigo, descricao: s.descricao })),
          endereco,
          cidade,
          uf,
          cep,
          email,
          telefone,
          responsavel,
          atividades_texto: atividadesTexto,
          banco_nome: bancoNome,
          banco_agencia: bancoAgencia,
          banco_conta: bancoConta,
          banco_pix: bancoPix,
        },
        propostas.filter((p) => p.titulo.trim() !== "")
      );
      setConcluido(true);
      toast.success("Cadastro de fornecedor realizado com sucesso!");
    } catch {
      toast.error("Falha ao salvar fornecedor. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  if (concluido) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <SiteHeader />
        <main className="mx-auto max-w-xl px-4 py-16 text-center">
          <div className="rounded-3xl border border-emerald-200 bg-card p-8 shadow-xl">
            <div className="mx-auto size-16 rounded-full bg-emerald-100 grid place-items-center text-emerald-600 mb-4">
              <CheckCircle2 className="size-10" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Cadastro Enviado!</h1>
            <p className="mt-2 text-sm text-muted-foreground font-medium leading-relaxed">
              Obrigado por se credenciar como fornecedor da CUFA. Seu cadastro foi recebido e
              será categorizado e analisado pela equipe de gestão.
            </p>

            <div className="mt-6 rounded-2xl bg-muted/60 p-4 text-xs font-semibold text-foreground text-left space-y-1">
              <p><strong>CNPJ:</strong> {cnpj}</p>
              <p><strong>Razão Social:</strong> {razaoSocial}</p>
              <p className="text-amber-600 font-bold"><strong>Status:</strong> Pendente de Aprovação</p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <Link to="/fornecedor/status">
                <Button size="lg" className="w-full bg-brand-gradient text-white font-bold shadow-brand">
                  Consultar Status do Cadastro
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full font-bold">
                  <ArrowLeft className="mr-1.5 size-4" /> Voltar ao Início
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Top Back & Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/">
            <Button
              variant="outline"
              size="sm"
              className="font-bold text-xs gap-2 border-border bg-card text-foreground hover:bg-muted shadow-xs"
            >
              <ArrowLeft className="size-4 text-primary" /> Voltar à Página Inicial
            </Button>
          </Link>
          <Link to="/fornecedor/status">
            <Button
              variant="ghost"
              size="sm"
              className="font-bold text-xs gap-1 text-primary hover:bg-primary/10"
            >
              Consultar Status <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-2 mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Truck className="size-3.5 text-primary" /> Credenciamento Público de Fornecedores
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Formulário de Fornecedor & Prestador
          </h1>
          <p className="max-w-lg mx-auto text-sm text-muted-foreground font-medium">
            Cadastre sua empresa, envie o Cartão CNPJ com extração automática via IA e receba propostas dos polos CUFA.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Passo 1: Upload Cartão CNPJ com OCR */}
          <div className="rounded-3xl border border-primary/30 bg-primary/5 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Sparkles className="size-5 text-primary animate-pulse" /> 1º Passo: Leitura do Cartão CNPJ via IA
              </h2>
              <span className="text-[10px] font-bold uppercase bg-primary/20 text-primary px-2.5 py-1 rounded-full">
                OCR Automático
              </span>
            </div>

            <p className="text-xs text-muted-foreground font-medium">
              Faça upload do seu Cartão CNPJ em PDF. Nossa inteligência artificial extrairá Razão Social, CNPJ, Endereço e CNAE automaticamente.
            </p>

            <div className="relative border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl bg-card p-6 text-center transition-colors">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUploadOcr}
                className="absolute inset-0 size-full opacity-0 cursor-pointer"
              />
              {parsingOcr ? (
                <div className="flex flex-col items-center py-4 text-primary">
                  <Loader2 className="size-8 animate-spin mb-2" />
                  <span className="text-xs font-extrabold">Processando arquivo com IA...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center py-2">
                  <Upload className="size-8 text-primary mb-2" />
                  <span className="text-sm font-bold text-foreground">Clique para selecionar ou arraste o Cartão CNPJ</span>
                  <span className="text-xs text-muted-foreground mt-1">Somente arquivos em PDF</span>
                </div>
              )}
            </div>
          </div>

          {/* Dados Gerais da Empresa */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Building className="size-5 text-primary" /> Dados Oficiais da Empresa (Receita Federal)
              </h2>
              <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                Extração RFB / Cartão CNPJ
              </span>
            </div>

            {/* Identificação Básica */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-foreground">CNPJ *</Label>
                <Input
                  required
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="00.000.000/0001-00"
                  className="h-10 font-bold"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase text-foreground">Razão Social *</Label>
                <Input
                  required
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Nome empresarial oficial na Receita Federal"
                  className="h-10 font-medium"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Nome Fantasia</Label>
                <Input
                  type="text"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  placeholder="Nome comercial ou de marca"
                  className="h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Data de Abertura</Label>
                <Input
                  type="text"
                  value={dataAbertura}
                  onChange={(e) => setDataAbertura(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  className="h-10 font-medium text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Porte</Label>
                <Input
                  type="text"
                  value={porte}
                  onChange={(e) => setPorte(e.target.value)}
                  placeholder="ME / EPP / DEMAIS"
                  className="h-10 font-bold text-xs uppercase"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Situação Cadastral</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={situacaoCadastral}
                    onChange={(e) => setSituacaoCadastral(e.target.value)}
                    placeholder="ATIVA / INAPTA / SUSPENSA"
                    className="h-10 font-bold text-emerald-600 bg-emerald-500/10 border-emerald-500/30 uppercase text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Natureza Jurídica</Label>
                <Input
                  type="text"
                  value={naturezaJuridica}
                  onChange={(e) => setNaturezaJuridica(e.target.value)}
                  placeholder="Código e Descrição da Natureza Jurídica"
                  className="h-10 font-medium text-xs"
                />
              </div>
            </div>

            {/* Atividade Econômica Principal (CNAE Principal) */}
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                  <FileCheck2 className="size-4 text-primary" /> Atividade Econômica Principal (CNAE Principal)
                </h3>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Principal
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase text-muted-foreground">Código CNAE</Label>
                  <Input
                    type="text"
                    value={cnaePrincipalCodigo}
                    onChange={(e) => setCnaePrincipalCodigo(e.target.value)}
                    placeholder="Ex: 18.13-0-01"
                    className="h-9 font-bold text-xs"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <Label className="text-[11px] font-bold uppercase text-muted-foreground">Descrição da Atividade Principal</Label>
                  <Input
                    type="text"
                    value={cnaePrincipalDescricao}
                    onChange={(e) => setCnaePrincipalDescricao(e.target.value)}
                    placeholder="Descrição oficial da atividade econômica principal"
                    className="h-9 font-medium text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Atividades Econômicas Secundárias (CNAEs Secundários) */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                    <CreditCard className="size-4 text-amber-500" /> Atividades Econômicas Secundárias (CNAEs Secundários)
                  </h3>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Todas as atividades secundárias constantes no Cartão CNPJ com seus respectivos códigos e descrições.
                  </p>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  {cnaeSecundarios.length} Atividades
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {cnaeSecundarios.map((item, index) => (
                  <div key={item.id} className="grid gap-2 sm:grid-cols-12 items-center bg-card p-2.5 rounded-xl border border-border/70 shadow-2xs">
                    <div className="sm:col-span-4 space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Código CNAE Secundário #{index + 1}
                      </Label>
                      <Input
                        type="text"
                        value={item.codigo}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCnaeSecundarios((prev) =>
                            prev.map((s) => (s.id === item.id ? { ...s, codigo: val } : s))
                          );
                        }}
                        placeholder="Ex: 56.20-1-01"
                        className="h-9 font-bold text-xs"
                      />
                    </div>
                    <div className="sm:col-span-7 space-y-1">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                        Descrição da Atividade Secundária
                      </Label>
                      <Input
                        type="text"
                        value={item.descricao}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCnaeSecundarios((prev) =>
                            prev.map((s) => (s.id === item.id ? { ...s, descricao: val } : s))
                          );
                        }}
                        placeholder="Descrição da atividade secundária"
                        className="h-9 font-medium text-xs"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCnaeSecundarioRow(item.id)}
                        className="size-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCnaeSecundarioRow}
                className="w-full font-bold text-xs gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="size-3.5" /> Adicionar Atividade Secundária
              </Button>
            </div>

            {/* Endereço Completo */}
            <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-border/60">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Endereço Completo</Label>
                <Input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, complemento, bairro"
                  className="h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Cidade / UF / CEP</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Cidade"
                    className="h-10 font-medium text-xs"
                  />
                  <Input
                    type="text"
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    placeholder="UF"
                    className="h-10 w-16 font-bold uppercase text-xs text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contato & Responsável */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="size-5 text-primary" /> Contato do Responsável
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-foreground">Nome do Responsável *</Label>
                <Input
                  required
                  type="text"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Nome do proprietário / gerente"
                  className="h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-foreground">E-mail de Contato *</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-foreground">Telefone / WhatsApp *</Label>
                <Input
                  required
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(21) 98877-6655"
                  className="h-10 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Dados Bancários */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <CreditCard className="size-5 text-primary" /> Dados Bancários (Para Pagamento de Fornecimentos)
            </h2>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Banco</Label>
                <Input
                  type="text"
                  value={bancoNome}
                  onChange={(e) => setBancoNome(e.target.value)}
                  placeholder="Ex.: Itaú, Bradesco..."
                  className="h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Agência</Label>
                <Input
                  type="text"
                  value={bancoAgencia}
                  onChange={(e) => setBancoAgencia(e.target.value)}
                  placeholder="0000"
                  className="h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Conta Corrente</Label>
                <Input
                  type="text"
                  value={bancoConta}
                  onChange={(e) => setBancoConta(e.target.value)}
                  placeholder="00000-0"
                  className="h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Chave PIX</Label>
                <Input
                  type="text"
                  value={bancoPix}
                  onChange={(e) => setBancoPix(e.target.value)}
                  placeholder="CNPJ, email ou celular"
                  className="h-10 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Área de Atuação (Texto livre categorizado por IA) */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <FileText className="size-5 text-primary" /> Área de Atuação & O que Você Fornece *
              </h2>
              <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                Categorização IA Automática
              </span>
            </div>

            <div className="space-y-1.5">
              <textarea
                required
                rows={4}
                value={atividadesTexto}
                onChange={(e) => setAtividadesTexto(e.target.value)}
                placeholder="Descreva em texto livre o que sua empresa faz e fornece (ex.: confecção de kimonos e uniformes esportivos, refeições tipo marmita, serviços gráficos de banners, material de construção, etc.)..."
                className="w-full rounded-2xl border border-input bg-background p-3 text-xs font-medium focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground font-medium">
                Nosso sistema categorizará automaticamente sua empresa com base neste texto para agrupamento inteligente no painel dos gestores.
              </p>
            </div>
          </div>

          {/* Propostas Repeater */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <FileCheck2 className="size-5 text-primary" /> Proposta(s) Comercial(is)
              </h2>
              <Button type="button" size="sm" variant="outline" onClick={addPropostaRow} className="h-8 font-bold text-xs">
                <Plus className="mr-1 size-3.5" /> Adicionar Proposta
              </Button>
            </div>

            <div className="space-y-4">
              {propostas.map((p, idx) => (
                <div key={p.id} className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">Proposta #{idx + 1}</span>
                    {propostas.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePropostaRow(p.id)}
                        className="h-6 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" /> Excluir
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Título da Proposta</Label>
                      <Input
                        type="text"
                        value={p.titulo}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPropostas((prev) => prev.map((item) => (item.id === p.id ? { ...item, titulo: val } : item)));
                        }}
                        placeholder="Ex.: Fornecimento mensal de quentinhas para os projetos"
                        className="h-9 font-medium text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-muted-foreground uppercase">Valor Estimado (R$)</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">R$</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={Number(p.valor || 0).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, "");
                            const val = raw ? Number(raw) / 100 : 0;
                            setPropostas((prev) =>
                              prev.map((item) => (item.id === p.id ? { ...item, valor: val } : item)),
                            );
                          }}
                          placeholder="0,00"
                          className="h-9 pl-8 font-bold text-xs tabular-nums"
                        />
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex items-center justify-end gap-3">
            <Button asChild variant="outline" size="lg">
              <Link to="/">Cancelar</Link>
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="bg-brand-gradient text-white font-extrabold shadow-brand px-8 text-base"
            >
              {submitting ? <Loader2 className="mr-2 size-5 animate-spin" /> : null}
              Enviar Credenciamento Oficial
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
