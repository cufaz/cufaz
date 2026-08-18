import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  FolderArchive,
  ChevronDown,
  ChevronRight,
  FileText,
  Upload,
  Trash2,
  Download,
  Plus,
  Truck,
  GraduationCap,
  Users,
  Search,
  CheckCircle2,
  Loader2,
  FileCheck,
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
import {
  fetchDocumentosGestaoDB,
  saveDocumentoGestaoDB,
  deleteDocumentoGestaoDB,
  DocumentoGestaoDB,
} from "@/lib/documentosService";

export const Route = createFileRoute("/_authenticated/gestor/contabilidade/documentos")({
  component: DocumentosGestaoPage,
});

function DocumentosGestaoPage() {
  const [documentos, setDocumentos] = useState<DocumentoGestaoDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  // Accordion sector expanded state
  const [expandedSectores, setExpandedSectores] = useState<Record<string, boolean>>({
    fornecedor: true,
    professor: true,
    aluno: true,
  });

  // Selected entity expanded state
  const [expandedEntidades, setExpandedEntidades] = useState<Record<string, boolean>>({});

  // Upload modal state
  const [modalUploadOpen, setModalUploadOpen] = useState(false);
  const [setorUpload, setSetorUpload] = useState<"fornecedor" | "professor" | "aluno">("fornecedor");
  const [entidadeNomeUpload, setEntidadeNomeUpload] = useState("");
  const [tipoUpload, setTipoUpload] = useState("Contrato");
  const [nomeArquivoUpload, setNomeArquivoUpload] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function loadData() {
    setLoading(true);
    const data = await fetchDocumentosGestaoDB();
    setDocumentos(data);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    window.addEventListener("cufa_documentos_updated", loadData);
    return () => window.removeEventListener("cufa_documentos_updated", loadData);
  }, []);

  function toggleSetor(setorKey: string) {
    setExpandedSectores((prev) => ({ ...prev, [setorKey]: !prev[setorKey] }));
  }

  function toggleEntidade(entidadeKey: string) {
    setExpandedEntidades((prev) => ({ ...prev, [entidadeKey]: !prev[entidadeKey] }));
  }

  async function handleConfirmUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!entidadeNomeUpload.trim() || !nomeArquivoUpload.trim()) {
      toast.error("Preencha o nome da pessoa/empresa e o nome do arquivo.");
      return;
    }

    setSubmitting(true);
    await saveDocumentoGestaoDB({
      setor: setorUpload,
      entidade_id: `ent-${Date.now()}`,
      entidade_nome: entidadeNomeUpload,
      tipo: tipoUpload,
      nome: nomeArquivoUpload,
      url: "#",
    });

    setSubmitting(false);
    setModalUploadOpen(false);
    setEntidadeNomeUpload("");
    setNomeArquivoUpload("");
    toast.success("Documento adicionado ao repositório oficial com sucesso!");
    loadData();
  }

  async function handleDeleteDoc(id: string, nome: string) {
    if (!window.confirm(`Tem certeza que deseja excluir o documento "${nome}"?`)) return;
    await deleteDocumentoGestaoDB(id);
    toast.success("Documento excluído!");
    loadData();
  }

  // Filter docs by search
  const docsFiltrados = documentos.filter((d) => {
    if (!busca.trim()) return true;
    const q = busca.toLowerCase();
    return (
      d.entidade_nome.toLowerCase().includes(q) ||
      d.tipo.toLowerCase().includes(q) ||
      d.nome.toLowerCase().includes(q)
    );
  });

  // Group by Setor > Entidade
  const setoresMap = {
    fornecedor: { title: "Setor de Fornecedores", icon: Truck, docs: [] as DocumentoGestaoDB[] },
    professor: { title: "Setor de Professores & Instrutores", icon: GraduationCap, docs: [] as DocumentoGestaoDB[] },
    aluno: { title: "Setor de Alunos & Responsáveis", icon: Users, docs: [] as DocumentoGestaoDB[] },
  };

  docsFiltrados.forEach((d) => {
    if (setoresMap[d.setor]) {
      setoresMap[d.setor].docs.push(d);
    }
  });

  return (
    <GestorShell
      title="Gestão de Documentos"
      description="Repositório central de arquivos por setor — Fornecedor, Professor e Aluno"
      actions={
        <Button
          className="bg-brand-gradient text-white font-bold shadow-brand"
          onClick={() => setModalUploadOpen(true)}
        >
          <Upload className="mr-1.5 size-4" /> Anexar Novo Documento
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs flex items-center gap-3">
          <Search className="size-4 text-primary shrink-0" />
          <Input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome da empresa/pessoa, tipo de documento ou arquivo..."
            className="h-10 border-0 bg-transparent text-sm font-medium focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(setoresMap).map(([setorKey, sectorData]) => {
              const isExpanded = Boolean(expandedSectores[setorKey]);

              // Group docs in this sector by Entidade
              const entidadesMap: Record<string, DocumentoGestaoDB[]> = {};
              sectorData.docs.forEach((d) => {
                if (!entidadesMap[d.entidade_nome]) entidadesMap[d.entidade_nome] = [];
                entidadesMap[d.entidade_nome]!.push(d);
              });

              return (
                <div key={setorKey} className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                  {/* Accordion Sector Header */}
                  <div
                    onClick={() => toggleSetor(setorKey)}
                    className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between cursor-pointer transition-colors hover:bg-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      <sectorData.icon className="size-5 text-primary" />
                      <h2 className="text-sm font-extrabold uppercase tracking-wide">
                        {sectorData.title}
                      </h2>
                      <Badge className="bg-primary text-white font-bold text-xs px-2.5 py-0.5">
                        {sectorData.docs.length} Documento(s)
                      </Badge>
                    </div>

                    {isExpanded ? <ChevronDown className="size-5 text-muted-foreground" /> : <ChevronRight className="size-5 text-muted-foreground" />}
                  </div>

                  {/* Accordion Sector Content */}
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {Object.keys(entidadesMap).length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center italic">
                          Nenhum documento cadastrado neste setor.
                        </p>
                      ) : (
                        Object.entries(entidadesMap).map(([entidadeNome, listaDocs]) => {
                          const entKey = `${setorKey}_${entidadeNome}`;
                          const isEntExpanded = expandedEntidades[entKey] ?? true;

                          return (
                            <div key={entKey} className="rounded-xl border border-border/80 bg-background overflow-hidden">
                              {/* Entity Header */}
                              <div
                                onClick={() => toggleEntidade(entKey)}
                                className="bg-muted/50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted"
                              >
                                <span className="text-xs font-black text-foreground uppercase tracking-wide">
                                  {entidadeNome}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground font-semibold">
                                    {listaDocs.length} arquivo(s)
                                  </span>
                                  {isEntExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                                </div>
                              </div>

                              {/* Entity Documents List */}
                              {isEntExpanded && (
                                <div className="p-3 divide-y divide-border/60">
                                  {listaDocs.map((doc) => (
                                    <div key={doc.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="size-8 rounded-lg bg-primary/10 grid place-items-center text-primary shrink-0">
                                          <FileText className="size-4" />
                                        </div>
                                        <div className="min-w-0">
                                          <span className="font-bold text-foreground block truncate">{doc.nome}</span>
                                          <span className="text-[11px] text-muted-foreground block font-medium">
                                            Tipo: <strong className="text-primary">{doc.tipo}</strong> • Data: {doc.created_at || "2026-08-18"}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => toast.info(`Iniciando download assinado do arquivo "${doc.nome}"...`)}
                                          className="h-7 text-xs font-bold gap-1"
                                        >
                                          <Download className="size-3.5" /> Baixar
                                        </Button>

                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteDoc(doc.id!, doc.nome)}
                                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="size-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Upload de Documento */}
      <Dialog open={modalUploadOpen} onOpenChange={setModalUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Anexar Documento ao Repositório</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleConfirmUpload} className="grid gap-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Setor Responsável *</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                value={setorUpload}
                onChange={(e) => setSetorUpload(e.target.value as any)}
              >
                <option value="fornecedor">Setor de Fornecedores</option>
                <option value="professor">Setor de Professores & Instrutores</option>
                <option value="aluno">Setor de Alunos & Responsáveis</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Pessoa / Empresa Beneficiária *</Label>
              <Input
                required
                type="text"
                value={entidadeNomeUpload}
                onChange={(e) => setEntidadeNomeUpload(e.target.value)}
                placeholder="Ex.: Favela Artes LTDA ou Prof.ª Santana Silva..."
                className="h-10 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Tipo de Documento</Label>
                <Input
                  type="text"
                  value={tipoUpload}
                  onChange={(e) => setTipoUpload(e.target.value)}
                  placeholder="Ex.: Contrato, NF, Autorização..."
                  className="h-10 font-medium text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Nome do Arquivo *</Label>
                <Input
                  required
                  type="text"
                  value={nomeArquivoUpload}
                  onChange={(e) => setNomeArquivoUpload(e.target.value)}
                  placeholder="contrato_oficial_2026.pdf"
                  className="h-10 font-medium text-xs"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setModalUploadOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="bg-brand-gradient text-white font-bold shadow-brand">
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Anexar Documento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </GestorShell>
  );
}
