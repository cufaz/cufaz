import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck,
  Upload,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site/SiteHeader";
import { fetchFornecedorByCnpjDB, FornecedorDB, FornecedorPropostaDB } from "@/lib/fornecedoresService";

export const Route = createFileRoute("/fornecedor/status")({
  component: FornecedorStatusPage,
});

function FornecedorStatusPage() {
  const [cnpjInput, setCnpjInput] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fornecedor, setFornecedor] = useState<FornecedorDB | null>(null);
  const [propostas, setPropostas] = useState<FornecedorPropostaDB[]>([]);

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!cnpjInput.trim()) {
      toast.error("Digite o CNPJ para consultar.");
      return;
    }

    setLoading(true);
    setSearched(true);

    const res = await fetchFornecedorByCnpjDB(cnpjInput);
    setFornecedor(res.fornecedor);
    setPropostas(res.propostas);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
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
          <Link to="/fornecedor/cadastro">
            <Button
              variant="ghost"
              size="sm"
              className="font-bold text-xs gap-1 text-primary hover:bg-primary/10"
            >
              Novo Cadastramento <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-2 mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Search className="size-3.5 text-primary" /> Consulta Pública por CNPJ
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground">
            Status do Cadastramento
          </h1>
          <p className="max-w-md mx-auto text-sm text-muted-foreground font-medium">
            Digite seu CNPJ para consultar o andamento do credenciamento, orientações fiscais e envio de Notas Fiscais.
          </p>
        </div>

        {/* Search Input Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-md mb-8">
          <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label className="text-xs font-bold uppercase text-muted-foreground">CNPJ da Empresa</Label>
              <Input
                type="text"
                required
                value={cnpjInput}
                onChange={(e) => setCnpjInput(e.target.value)}
                placeholder="12.345.678/0001-99"
                className="h-12 text-base font-bold tabular-nums"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-12 sm:self-end bg-brand-gradient text-white font-extrabold shadow-brand px-6"
            >
              <Search className="mr-2 size-4" /> Consultar
            </Button>
          </form>
        </div>

        {/* Search Result */}
        {searched && (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-sm font-bold text-primary animate-pulse">Consultando dados no sistema CUFA...</p>
              </div>
            ) : !fornecedor ? (
              <div className="rounded-3xl border border-border bg-card p-8 text-center space-y-4 shadow-sm">
                <Building className="mx-auto size-12 text-muted-foreground/50" />
                <h3 className="text-lg font-bold text-foreground">CNPJ não encontrado</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Nenhum cadastro foi localizado com o CNPJ informado. Certifique-se de ter digitado corretamente ou faça seu cadastramento.
                </p>
                <Button asChild className="bg-brand-gradient text-white font-bold shadow-brand">
                  <Link to="/fornecedor/cadastro">Cadastrar Minha Empresa</Link>
                </Button>
              </div>
            ) : (
              <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-md space-y-6">
                {/* Header info & Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h2 className="text-xl font-black text-foreground">{fornecedor.razao_social}</h2>
                    <p className="text-xs text-muted-foreground font-semibold">CNPJ: {fornecedor.cnpj}</p>
                  </div>

                  {fornecedor.status === "aprovado" && (
                    <Badge className="bg-emerald-500 text-white font-black text-sm px-3.5 py-1.5 self-start sm:self-auto shadow-sm">
                      <CheckCircle2 className="mr-1.5 size-4" /> Credenciamento Aprovado
                    </Badge>
                  )}
                  {fornecedor.status === "reprovado" && (
                    <Badge className="bg-destructive text-white font-black text-sm px-3.5 py-1.5 self-start sm:self-auto shadow-sm">
                      <XCircle className="mr-1.5 size-4" /> Cadastro Reprovado
                    </Badge>
                  )}
                  {fornecedor.status === "pendente" && (
                    <Badge className="bg-amber-500 text-white font-black text-sm px-3.5 py-1.5 self-start sm:self-auto shadow-sm animate-pulse">
                      <Clock className="mr-1.5 size-4" /> Em Análise Pedagógica/Gestão
                    </Badge>
                  )}
                </div>

                {/* Status-specific details */}
                {fornecedor.status === "aprovado" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-5 space-y-2 text-emerald-950">
                      <h3 className="font-extrabold text-sm flex items-center gap-2 text-emerald-900">
                        <FileCheck className="size-5 text-emerald-700" /> Instruções Oficiais para Emissão de Nota Fiscal
                      </h3>
                      <p className="text-xs font-semibold leading-relaxed">
                        {fornecedor.texto_nota_fiscal || "Emita a NF informando o número do pedido e a descrição dos materiais/serviços fornecidos para as oficinas CUFA."}
                      </p>
                      {fornecedor.codigo_tributacao && (
                        <p className="pt-2 text-xs font-black text-emerald-800">
                          Código de Tributação Aplicável: {fornecedor.codigo_tributacao}
                        </p>
                      )}
                    </div>

                    {/* Espaço reservado para Envio de NF Futuro */}
                    <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 text-center space-y-3">
                      <div className="mx-auto size-10 rounded-full bg-primary/10 grid place-items-center text-primary">
                        <Upload className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Envio de Nota Fiscal de Serviços/Venda</h4>
                        <p className="text-xs text-muted-foreground font-medium max-w-md mx-auto">
                          Seu fornecimento está aprovado. Utilize o campo abaixo para enviar a NF correspondente ao pedido autorizativo.
                        </p>
                      </div>
                      <Button variant="outline" className="font-bold text-xs border-primary/30 text-primary">
                        <Upload className="mr-1.5 size-3.5" /> Anexar Nota Fiscal (PDF / XML)
                      </Button>
                    </div>
                  </div>
                )}

                {fornecedor.status === "reprovado" && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950 space-y-2">
                    <h3 className="font-bold text-sm text-red-900 flex items-center gap-2">
                      <XCircle className="size-5 text-red-600" /> Parecer da Gestão
                    </h3>
                    <p className="text-xs font-medium">
                      {fornecedor.observacao_gestor || "Cadastro não atende aos requisitos fiscais ou operacionais estipulados no edital."}
                    </p>
                  </div>
                )}

                {fornecedor.status === "pendente" && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950 space-y-2">
                    <h3 className="font-bold text-sm text-amber-900 flex items-center gap-2">
                      <Clock className="size-5 text-amber-600" /> Aguardando Validação
                    </h3>
                    <p className="text-xs font-medium leading-relaxed">
                      Sua empresa está em fila de análise. A equipe de gestão validará os dados do seu Cartão CNPJ e propostas comerciais em breve.
                    </p>
                  </div>
                )}

                {/* Company details breakdown */}
                <div className="pt-2 text-xs space-y-1.5 text-muted-foreground border-t border-border">
                  <p><strong className="text-foreground">Endereço:</strong> {fornecedor.endereco || "—"}, {fornecedor.cidade} - {fornecedor.uf}</p>
                  <p><strong className="text-foreground">Contato:</strong> {fornecedor.email} | {fornecedor.telefone}</p>
                  <p><strong className="text-foreground">Área de Atuação:</strong> {fornecedor.atividades_texto}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
