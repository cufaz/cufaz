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

function FornecedorCadastroPage() {
  const [parsingOcr, setParsingOcr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [concluido, setConcluido] = useState(false);

  // Form Fields
  const [cnpj, setCnpj] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("Rio de Janeiro");
  const [uf, setUf] = useState("RJ");
  const [cep, setCep] = useState("");
  const [cnae, setCnae] = useState("");

  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const [bancoNome, setBancoNome] = useState("");
  const [bancoAgencia, setBancoAgencia] = useState("");
  const [bancoConta, setBancoConta] = useState("");
  const [bancoPix, setBancoPix] = useState("");

  const [atividadesTexto, setAtividadesTexto] = useState("");
  const [propostas, setPropostas] = useState<PropostaFormItem[]>([
    { id: "1", titulo: "Proposta de Fornecimento Inicial", descricao: "", valor: 0, prazo: "15 dias" },
  ]);

  // Step 1: Upload Cartão CNPJ with AI OCR Extraction
  async function handleFileUploadOcr(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingOcr(true);
    toast.info("Analisando Cartão CNPJ com IA (Lovable AI Gateway / OCR)...");

    try {
      const result = await parseCnpjCardOcr(file);
      setCnpj(result.cnpj);
      setRazaoSocial(result.razao_social);
      setNomeFantasia(result.nome_fantasia);
      setEndereco(result.endereco);
      setCidade(result.cidade);
      setUf(result.uf);
      setCep(result.cep);
      setCnae(result.cnae);
      toast.success("Dados do Cartão CNPJ extraídos com sucesso! Você pode editá-los se necessário.");
    } catch {
      toast.error("Erro na leitura automática. Preencha os campos manualmente.");
    } finally {
      setParsingOcr(false);
    }
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
    if (!cnpj.trim() || !razaoSocial.trim()) {
      toast.error("CNPJ e Razão Social são obrigatórios.");
      return;
    }
    if (!atividadesTexto.trim()) {
      toast.error("Descreva o que você faz / fornece no campo de Área de Atuação.");
      return;
    }

    setSubmitting(true);

    const created = await createFornecedorPublicDB(
      {
        cnpj,
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia,
        endereco,
        cidade,
        uf,
        cep,
        email,
        telefone,
        responsavel,
        cnae,
        atividades_texto: atividadesTexto,
        banco_nome: bancoNome,
        banco_agencia: bancoAgencia,
        banco_conta: bancoConta,
        banco_pix: bancoPix,
      },
      propostas
    );

    setSubmitting(false);

    if (created) {
      setConcluido(true);
      toast.success("Cadastro de fornecedor enviado com sucesso!");
    } else {
      toast.error("Falha ao salvar fornecedor. Tente novamente.");
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
              <Button asChild size="lg" className="bg-brand-gradient text-white font-bold shadow-brand">
                <Link to="/fornecedor/status">Consultar Status do Cadastro</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Voltar ao Início</Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
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
              Faça upload do seu Cartão CNPJ (PDF ou Imagem). Nossa inteligência artificial extrairá Razão Social, CNPJ, Endereço e CNAE automaticamente.
            </p>

            <div className="relative border-2 border-dashed border-primary/40 hover:border-primary rounded-2xl bg-card p-6 text-center transition-colors">
              <input
                type="file"
                accept="application/pdf,image/*"
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
                  <span className="text-xs text-muted-foreground mt-1">Arquivos em PDF, PNG ou JPG</span>
                </div>
              )}
            </div>
          </div>

          {/* Dados Gerais da Empresa */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Building className="size-5 text-primary" /> Dados Oficiais da Empresa
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
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

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-foreground">Razão Social *</Label>
                <Input
                  required
                  type="text"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Nome empresarial oficial"
                  className="h-10 font-medium"
                />
              </div>

              <div className="space-y-1.5">
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
                <Label className="text-xs font-bold uppercase text-muted-foreground">CNAE Principal</Label>
                <Input
                  type="text"
                  value={cnae}
                  onChange={(e) => setCnae(e.target.value)}
                  placeholder="Código e atividade econômica"
                  className="h-10 font-medium text-xs"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 pt-2">
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
                      <Input
                        type="number"
                        step="0.01"
                        value={p.valor || ""}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setPropostas((prev) => prev.map((item) => (item.id === p.id ? { ...item, valor: val } : item)));
                        }}
                        placeholder="0,00"
                        className="h-9 font-bold text-xs"
                      />
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
