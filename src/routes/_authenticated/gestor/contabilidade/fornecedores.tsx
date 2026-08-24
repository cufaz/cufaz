import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Truck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  FileText,
  DollarSign,
  MapPin,
  Calendar,
  ChevronDown,
  Loader2,
  FileCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { GestorShell } from "@/components/admin/GestorShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { brl } from "@/lib/format";
import {
  fetchFornecedoresDB,
  updateFornecedorStatusDB,
  fetchFornecedorByCnpjDB,
  abrirDocumento,
  FornecedorDB,
  FornecedorPropostaDB,
  FornecedorDocumentoDB,
} from "@/lib/fornecedoresService";

export const Route = createFileRoute("/_authenticated/gestor/contabilidade/fornecedores")({
  component: FornecedoresGestorPage,
});

function FornecedoresGestorPage() {
  const [fornecedores, setFornecedores] = useState<FornecedorDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroUf, setFiltroUf] = useState("todos");

  // Approval Modal state
  const [fornecedorParaAprovar, setFornecedorParaAprovar] = useState<FornecedorDB | null>(null);
  const [textoNotaFiscal, setTextoNotaFiscal] = useState("");
  const [codigoTributacao, setCodigoTributacao] = useState("");
  const [observacaoGestor, setObservacaoGestor] = useState("");
  const [submittingAprovacao, setSubmittingAprovacao] = useState(false);

  // Inspector Modal state
  const [inspecionandoFornecedor, setInspecionandoFornecedor] = useState<FornecedorDB | null>(null);
  const [propostasInsp, setPropostasInsp] = useState<FornecedorPropostaDB[]>([]);
  const [documentosInsp, setDocumentosInsp] = useState<FornecedorDocumentoDB[]>([]);

  async function loadFornecedores() {
    setLoading(true);
    try {
      const data = await fetchFornecedoresDB({
        status: filtroStatus,
        search: busca,
        categoria: filtroCategoria,
        uf: filtroUf,
      });
      setFornecedores(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar os fornecedores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFornecedores();
    window.addEventListener("cufa_fornecedores_updated", loadFornecedores);
    return () => window.removeEventListener("cufa_fornecedores_updated", loadFornecedores);
  }, [filtroStatus, filtroCategoria, filtroUf, busca]);

  async function handleOpenInspect(f: FornecedorDB) {
    setInspecionandoFornecedor(f);
    const res = await fetchFornecedorByCnpjDB(f.cnpj);
    setPropostasInsp(res.propostas);
    setDocumentosInsp(res.documentos);
  }

  function handleOpenAprovarModal(f: FornecedorDB) {
    setFornecedorParaAprovar(f);
    setTextoNotaFiscal(
      f.texto_nota_fiscal ||
        `Prestação de serviços de ${f.atividades_texto || "fornecimento e insumos"} para as oficinas comunitárias da CUFA.`
    );
    setCodigoTributacao(f.codigo_tributacao || "17.06 - Serviços de Utilidade Social / Artesanal");
    setObservacaoGestor(f.observacao_gestor || "");
  }

  async function handleConfirmarAprovacao() {
    if (!fornecedorParaAprovar) return;
    if (!textoNotaFiscal.trim()) {
      toast.error("O texto da Nota Fiscal é obrigatório.");
      return;
    }
    if (!codigoTributacao.trim()) {
      toast.error("O Código de Tributação é obrigatório.");
      return;
    }

    setSubmittingAprovacao(true);
    await updateFornecedorStatusDB(fornecedorParaAprovar.id!, "aprovado", {
      texto_nota_fiscal: textoNotaFiscal,
      codigo_tributacao: codigoTributacao,
      observacao_gestor: observacaoGestor,
    });
    setSubmittingAprovacao(false);
    setFornecedorParaAprovar(null);
    toast.success(`Fornecedor ${fornecedorParaAprovar.razao_social} APROVADO com sucesso!`);
    loadFornecedores();
  }

  async function handleReprovar(f: FornecedorDB) {
    const motif = window.prompt(`Digite o motivo da reprovação do fornecedor ${f.razao_social}:`);
    if (motif === null) return;

    await updateFornecedorStatusDB(f.id!, "reprovado", {
      texto_nota_fiscal: "",
      codigo_tributacao: "",
      observacao_gestor: motif || "Cadastro não atende aos requisitos do edital CUFA.",
    });
    toast.success(`Fornecedor ${f.razao_social} REPROVADO.`);
    loadFornecedores();
  }

  // Extract all categories for filtering
  const allCategoriesSet = new Set<string>();
  fornecedores.forEach((f) => {
    (f.categorias || []).forEach((c) => allCategoriesSet.add(c));
  });
  const categoriasList = Array.from(allCategoriesSet);

  // Group suppliers by primary category
  const groupedMap: Record<string, FornecedorDB[]> = {};
  fornecedores.forEach((f) => {
    const mainCat = (f.categorias && f.categorias[0]) || "Geral";
    if (!groupedMap[mainCat]) groupedMap[mainCat] = [];
    groupedMap[mainCat]!.push(f);
  });

  return (
    <GestorShell
      title="Gestão de Fornecedores"
      description="Credenciamento, validação fiscal, propostas comerciais e aprovação de prestadores"
    >
      <div className="space-y-6">
        {/* Search & Filter Bar */}
        <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:grid-cols-4">
          <div className="sm:col-span-1">
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Search className="size-3.5 text-primary" /> Buscar CNPJ / Razão Social
            </Label>
            <Input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite CNPJ, nome ou responsável..."
              className="mt-1 h-10 font-medium"
            />
          </div>

          <div>
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
              <Filter className="size-3.5 text-primary" /> Status
            </Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendentes de Aprovação</option>
              <option value="aprovado">Aprovados</option>
              <option value="reprovado">Reprovados</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
              <Truck className="size-3.5 text-primary" /> Categoria Inteligente
            </Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="todas">Todas as Categorias</option>
              {categoriasList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1 mb-1">
              <MapPin className="size-3.5 text-primary" /> Estado (UF)
            </Label>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-bold text-foreground"
              value={filtroUf}
              onChange={(e) => setFiltroUf(e.target.value)}
            >
              <option value="todos">Todos os Estados</option>
              <option value="RJ">Rio de Janeiro (RJ)</option>
              <option value="SP">São Paulo (SP)</option>
              <option value="MG">Minas Gerais (MG)</option>
              <option value="BA">Bahia (BA)</option>
            </select>
          </div>
        </div>

        {/* Grouped Supplier List by Intelligent Category */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : Object.keys(groupedMap).length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Truck className="mx-auto size-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-base font-bold text-foreground">Nenhum fornecedor encontrado</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Ajuste os filtros ou compartilhe o link de cadastro público `/fornecedor/cadastro`.
            </p>
          </div>
        ) : (
          Object.entries(groupedMap).map(([categoriaNome, listaFornecedores]) => (
            <div key={categoriaNome} className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
              <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="size-4 text-primary" />
                  <h2 className="text-sm font-extrabold tracking-wide uppercase">
                    CATEGORIA: {categoriaNome}
                  </h2>
                </div>
                <Badge className="bg-primary text-white text-xs font-bold px-2.5 py-0.5">
                  {listaFornecedores.length} Fornecedor(es)
                </Badge>
              </div>

              <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {listaFornecedores.map((f) => {
                  const isAprovado = f.status === "aprovado";
                  const isReprovado = f.status === "reprovado";

                  return (
                    <div
                      key={f.id || f.cnpj}
                      className="rounded-xl border border-border/70 bg-background p-4 shadow-2xs flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-black text-foreground leading-tight">{f.razao_social}</h3>
                            {f.nome_fantasia ? (
                              <span className="text-xs text-muted-foreground font-semibold block">{f.nome_fantasia}</span>
                            ) : null}
                          </div>
                          {isAprovado && (
                            <Badge className="bg-emerald-500 text-white font-extrabold text-[10px] shrink-0">
                              Aprovado
                            </Badge>
                          )}
                          {isReprovado && (
                            <Badge className="bg-destructive text-white font-extrabold text-[10px] shrink-0">
                              Reprovado
                            </Badge>
                          )}
                          {!isAprovado && !isReprovado && (
                            <Badge className="bg-amber-500 text-white font-extrabold text-[10px] shrink-0 animate-pulse">
                              Pendente
                            </Badge>
                          )}
                        </div>

                        <div className="text-xs space-y-1 font-medium text-muted-foreground pt-1">
                          <p className="flex items-center gap-1.5 font-bold text-foreground">
                            <Building className="size-3.5 text-primary" /> CNPJ: {f.cnpj}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <MapPin className="size-3.5" /> {f.cidade} / {f.uf}
                          </p>
                          {f.responsavel ? <p>Resp.: {f.responsavel}</p> : null}
                          {f.email ? <p className="truncate">Email: {f.email}</p> : null}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenInspect(f)}
                          className="h-8 text-xs font-bold px-3 text-foreground"
                        >
                          Analisar
                        </Button>

                        <div className="flex items-center gap-1.5">
                          {!isAprovado && (
                            <Button
                              size="sm"
                              onClick={() => handleOpenAprovarModal(f)}
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 shadow-xs"
                            >
                              <CheckCircle2 className="mr-1 size-3.5" /> Aprovar
                            </Button>
                          )}

                          {!isReprovado && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReprovar(f)}
                              className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 font-bold text-xs px-2.5"
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Approval Modal with Mandatory NF Body Text & Tax Code */}
      <Dialog open={Boolean(fornecedorParaAprovar)} onOpenChange={(v) => !v && setFornecedorParaAprovar(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-emerald-600 flex items-center gap-2">
              <CheckCircle2 className="size-5 text-emerald-600" /> Aprovar Cadastramento de Fornecedor
            </DialogTitle>
          </DialogHeader>

          {fornecedorParaAprovar && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900 font-medium">
                <p className="font-bold">{fornecedorParaAprovar.razao_social}</p>
                <p>CNPJ: {fornecedorParaAprovar.cnpj}</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold uppercase text-foreground">
                  Descrição obrigatória para o Corpo da Nota Fiscal *
                </Label>
                <textarea
                  required
                  rows={3}
                  value={textoNotaFiscal}
                  onChange={(e) => setTextoNotaFiscal(e.target.value)}
                  placeholder="Texto oficial que o fornecedor deverá incluir no corpo da NF ao emitir para a CUFA..."
                  className="w-full rounded-md border border-input bg-background p-2.5 text-xs font-medium focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold uppercase text-foreground">
                  Código de Tributação Aplicável *
                </Label>
                <Input
                  required
                  type="text"
                  value={codigoTributacao}
                  onChange={(e) => setCodigoTributacao(e.target.value)}
                  placeholder="Ex.: 17.06 - Serviços de artes gráficas ou 01.07 - Suporte técnico..."
                  className="h-10 text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Observação Interna do Gestor (Opcional)
                </Label>
                <Input
                  type="text"
                  value={observacaoGestor}
                  onChange={(e) => setObservacaoGestor(e.target.value)}
                  placeholder="Anotações internas sobre edital, prazos ou vigência de contrato..."
                  className="h-10 text-xs font-medium"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setFornecedorParaAprovar(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarAprovacao}
              disabled={submittingAprovacao}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-brand"
            >
              {submittingAprovacao ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Confirmar Aprovação Oficial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Inspector Drawer / Modal */}
      <Dialog open={Boolean(inspecionandoFornecedor)} onOpenChange={(v) => !v && setInspecionandoFornecedor(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Building className="size-5 text-primary" /> Detalhes do Fornecedor Credenciado
            </DialogTitle>
          </DialogHeader>

          {inspecionandoFornecedor && (
            <div className="space-y-6 text-xs py-2">
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                <h4 className="text-sm font-bold text-foreground">{inspecionandoFornecedor.razao_social}</h4>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground font-medium">
                  <p><strong className="text-foreground">CNPJ:</strong> {inspecionandoFornecedor.cnpj}</p>
                  <p><strong className="text-foreground">Fantasia:</strong> {inspecionandoFornecedor.nome_fantasia || "—"}</p>
                  <p><strong className="text-foreground">Data de Abertura:</strong> {inspecionandoFornecedor.data_abertura || "—"}</p>
                  <p><strong className="text-foreground">Porte:</strong> {inspecionandoFornecedor.porte || "—"}</p>
                  <p><strong className="text-foreground">Situação Cadastral:</strong> <span className="font-bold text-emerald-600">{inspecionandoFornecedor.situacao_cadastral || "ATIVA"}</span></p>
                  <p><strong className="text-foreground">Natureza Jurídica:</strong> {inspecionandoFornecedor.natureza_juridica || "—"}</p>
                  <p><strong className="text-foreground">Endereço:</strong> {inspecionandoFornecedor.endereco}</p>
                  <p><strong className="text-foreground">Cidade/UF:</strong> {inspecionandoFornecedor.cidade} / {inspecionandoFornecedor.uf}</p>
                  <p><strong className="text-foreground">Email:</strong> {inspecionandoFornecedor.email}</p>
                  <p><strong className="text-foreground">Telefone:</strong> {inspecionandoFornecedor.telefone}</p>
                  <p><strong className="text-foreground">Responsável:</strong> {inspecionandoFornecedor.responsavel}</p>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div>
                    <strong className="text-foreground block mb-1">CNAE Principal:</strong>
                    <Badge variant="outline" className="font-bold text-xs bg-primary/10 text-primary border-primary/20">
                      {inspecionandoFornecedor.cnae || inspecionandoFornecedor.cnae_principal_codigo || "—"}
                    </Badge>
                  </div>

                  {inspecionandoFornecedor.cnae_secundarios && inspecionandoFornecedor.cnae_secundarios.length > 0 && (
                    <div>
                      <strong className="text-foreground block mb-1">Atividades Econômicas Secundárias (CNAEs Secundários):</strong>
                      <div className="space-y-1.5 pt-0.5">
                        {inspecionandoFornecedor.cnae_secundarios.map((sec, idx) => (
                          <div key={idx} className="flex items-start gap-2 bg-card p-2 rounded-lg border border-border text-xs">
                            <Badge variant="secondary" className="font-bold text-[10px] shrink-0">
                              {sec.codigo}
                            </Badge>
                            <span className="text-muted-foreground font-medium">{sec.descricao}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {inspecionandoFornecedor.texto_nota_fiscal ? (
                <div className="rounded-xl border border-emerald-300 bg-emerald-50/80 p-4 space-y-1 text-emerald-950">
                  <h5 className="font-bold flex items-center gap-1.5 text-xs text-emerald-800">
                    <FileCheck className="size-4" /> Corpo da Nota Fiscal Configurado:
                  </h5>
                  <p className="font-semibold text-xs leading-relaxed">{inspecionandoFornecedor.texto_nota_fiscal}</p>
                  <p className="pt-1 text-[11px] font-bold text-emerald-700">
                    Código de Tributação: {inspecionandoFornecedor.codigo_tributacao}
                  </p>
                </div>
              ) : null}

              {/* Proposals Repeater section */}
              <div>
                <h4 className="font-extrabold text-xs uppercase text-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="size-4 text-primary" /> Propostas Comerciais ({propostasInsp.length})
                </h4>
                {propostasInsp.length === 0 ? (
                  <p className="text-muted-foreground italic">Nenhuma proposta vinculada.</p>
                ) : (
                  <div className="space-y-2">
                    {propostasInsp.map((p) => (
                      <div key={p.id} className="rounded-xl border border-border bg-card p-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-foreground text-xs">{p.titulo}</p>
                          <p className="text-muted-foreground">{p.descricao || "Proposta técnica de fornecimento"}</p>
                          <span className="text-[10px] font-bold text-primary">Prazo: {p.prazo || "15 dias"}</span>
                        </div>
                        <span className="font-extrabold text-sm text-emerald-600">{brl(p.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documentos anexados pelo fornecedor */}
              <div>
                <h4 className="font-extrabold text-xs uppercase text-foreground mb-2 flex items-center gap-1.5">
                  <FileCheck className="size-4 text-primary" /> Documentos Anexados ({documentosInsp.length})
                </h4>
                {documentosInsp.length === 0 ? (
                  <p className="text-muted-foreground italic">Nenhum documento anexado no cadastro.</p>
                ) : (
                  <div className="space-y-2">
                    {documentosInsp.map((d) => (
                      <div key={d.id} className="rounded-xl border border-border bg-card p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-xs truncate">{d.tipo}</p>
                          <p className="text-muted-foreground truncate">{d.nome}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-bold shrink-0"
                          onClick={async () => {
                            const ok = await abrirDocumento(d.url);
                            if (!ok) toast.error("Não foi possível abrir o arquivo.");
                          }}
                        >
                          Abrir
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}
