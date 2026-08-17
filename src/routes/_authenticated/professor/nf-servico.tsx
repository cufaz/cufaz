import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FileText, Upload, Plus, Download, CheckCircle2, Clock, DollarSign, Calendar, FileCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProfessorShell } from "@/components/professor/ProfessorShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { brl } from "@/lib/brl";

export const Route = createFileRoute("/_authenticated/professor/nf-servico")({
  component: ProfessorNfServicoPage,
});

export interface NfServicoItem {
  id: string;
  profEmail: string;
  profNome: string;
  periodo: string; // e.g. "08/2026"
  valor: number;
  detalhes: string;
  fileName: string;
  fileDataUrl: string; // Base64 data url for download
  dataEnvio: string;
  status: "Em Análise" | "Aprovada" | "Pendente";
}

function ProfessorNfServicoPage() {
  const [profEmail] = useState(() => (localStorage.getItem("cufa_logged_user") || "santana@cufa.com.br").toLowerCase());
  const [profNome] = useState(() => localStorage.getItem("cufa_professor_nome") || "Prof.ª Santana Silva");

  const [modalOpen, setModalOpen] = useState(false);
  const [nfsList, setNfsList] = useState<NfServicoItem[]>([]);

  // Form State
  const [periodo, setPeriodo] = useState("08/2026");
  const [dataVencimento, setDataVencimento] = useState("2026-08-30");
  const [valorStr, setValorStr] = useState("R$ 2.500,00");
  const [valorNum, setValorNum] = useState(2500);
  const [detalhes, setDetalhes] = useState("Prestação de serviços referente às aulas presenciais do mês no Complexo da Penha.");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");

  function loadNfs() {
    try {
      const stored = localStorage.getItem(`cufa_professor_nfs_${profEmail}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setNfsList(parsed);
          return;
        }
      }
    } catch {}

    setNfsList([]);
  }

  useEffect(() => {
    loadNfs();
  }, [profEmail]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSaveNf(e: React.FormEvent) {
    e.preventDefault();

    if (!fileBase64 && !selectedFile) {
      toast.error("Por favor, selecione um arquivo de Nota Fiscal em PDF, imagem ou ZIP.");
      return;
    }

    const newNf: NfServicoItem = {
      id: `nf-${Date.now()}`,
      profEmail,
      profNome,
      periodo,
      valor: valorNum,
      detalhes,
      fileName: selectedFile?.name || `NF_${periodo.replace("/", "_")}.pdf`,
      fileDataUrl: fileBase64 || "data:application/pdf;base64,JVBERi0xLjQKJ...",
      dataEnvio: new Date().toLocaleDateString("pt-BR"),
      status: "Em Análise",
    };

    const updated = [newNf, ...nfsList];
    setNfsList(updated);

    // Save locally for professor & globally for Gestor General
    try {
      localStorage.setItem(`cufa_professor_nfs_${profEmail}`, JSON.stringify(updated));

      const storedAll = localStorage.getItem("cufa_professor_nfs_all");
      let allNfs: NfServicoItem[] = storedAll ? JSON.parse(storedAll) : [];
      allNfs = [newNf, ...allNfs.filter((n) => n.id !== newNf.id)];
      localStorage.setItem("cufa_professor_nfs_all", JSON.stringify(allNfs));

      window.dispatchEvent(new Event("cufa_nfs_updated"));
    } catch {}

    toast.success("Nota Fiscal enviada com sucesso!", {
      description: `Período ${periodo} no valor de ${brl(valorNum)} registrado para análise do Gestor Geral.`,
    });

    setModalOpen(false);
    setSelectedFile(null);
    setFileBase64("");
  }

  function handleDownloadNf(item: NfServicoItem) {
    if (item.fileDataUrl) {
      const link = document.createElement("a");
      link.href = item.fileDataUrl;
      link.download = item.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Download iniciado: ${item.fileName}`);
    } else {
      toast.error("Arquivo indisponível para download.");
    }
  }

  const totalEnviado = nfsList.length;
  const totalValor = nfsList.reduce((acc, curr) => acc + (curr.valor || 0), 0);

  return (
    <ProfessorShell
      title="Notas Fiscais de Serviço (NF-e)"
      description="Envie e acompanhe suas notas fiscais de prestação de serviços para prestação de contas com o Gestor Geral da CUFA."
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">NFs Enviadas</p>
                <p className="text-2xl font-black text-foreground mt-0.5">{totalEnviado}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Histórico acumulado</span>
              </div>
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                <FileText className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Valor Acumulado</p>
                <p className="text-xl font-black text-emerald-600 mt-0.5">{brl(totalValor)}</p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Soma de repasses registrados</span>
              </div>
              <div className="size-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-black">
                <DollarSign className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-xs bg-card">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Status Geral</p>
                <p className="text-sm font-black text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="size-4" /> Em dia
                </p>
                <span className="text-[10px] text-muted-foreground font-medium mt-1 block">Próxima entrega: até dia 05</span>
              </div>
              <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-black">
                <FileCheck className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Header Table */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-border shadow-xs">
          <div>
            <h3 className="font-extrabold text-base text-foreground">Notas Fiscais Registradas</h3>
            <p className="text-xs text-muted-foreground">Adicione suas notas fiscais de serviço em formato PDF, imagem ou arquivo ZIP.</p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto bg-brand-gradient font-bold text-white shadow-brand gap-2"
          >
            <Plus className="size-4" /> Adicionar NF de Serviço
          </Button>
        </div>

        {/* Table of NFs */}
        <Card className="border-border shadow-xs overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-[11px] font-extrabold uppercase text-muted-foreground tracking-wider">
                  <tr>
                    <th className="p-3.5">Período / Competência</th>
                    <th className="p-3.5">Valor (R$)</th>
                    <th className="p-3.5">Arquivo Anexado</th>
                    <th className="p-3.5">Data do Envio</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-medium">
                  {nfsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        Nenhuma Nota Fiscal cadastrada. Clique no botão acima para adicionar.
                      </td>
                    </tr>
                  ) : (
                    nfsList.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-primary" />
                            <span>Mês {item.periodo}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-black text-emerald-600">{brl(item.valor)}</td>
                        <td className="p-3.5 text-muted-foreground">
                          <span className="font-semibold text-foreground truncate max-w-[200px] block">{item.fileName}</span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">{item.dataEnvio}</td>
                        <td className="p-3.5">
                          <Badge
                            className={`font-bold text-[10px] ${
                              item.status === "Aprovada"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="p-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadNf(item)}
                            className="h-8 text-xs font-bold text-primary border-primary/30 hover:bg-primary/10 gap-1.5"
                          >
                            <Download className="size-3.5" /> Baixar NF
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Adicionar NF de Serviço (Anexo 5) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold">
              <Upload className="size-5 text-primary" />
              <span>Adicionar Nota Fiscal de Serviço</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveNf} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Mês / Ano Competência</Label>
                <Input
                  required
                  placeholder="Ex: 08/2026"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="font-medium text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Data Vencimento / Pagamento</Label>
                <Input
                  type="date"
                  required
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="font-medium text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Valor da Nota Fiscal (R$)</Label>
              <Input
                required
                type="text"
                value={valorStr}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  const num = digits ? Number(digits) / 100 : 0;
                  setValorNum(num);
                  setValorStr(brl(num));
                }}
                className="font-bold text-emerald-600 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Detalhamento / Observações</Label>
              <Textarea
                rows={3}
                placeholder="Detalhes sobre a prestação de serviços ou aulas..."
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                className="text-xs font-medium"
              />
            </div>

            <div className="space-y-2 border-t border-border pt-3">
              <Label className="text-xs font-bold block">Anexar Arquivo da Nota Fiscal (PDF, PNG, JPG, ZIP)</Label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.zip"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <div className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]">
                    <Upload className="size-4" />
                    <span>Escolher Arquivo NF</span>
                  </div>
                </label>
                <span className="text-xs font-semibold text-muted-foreground truncate max-w-[200px]">
                  {selectedFile ? selectedFile.name : "Nenhum arquivo escolhido"}
                </span>
              </div>
              {selectedFile && (
                <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-brand-gradient font-bold text-white shadow-brand">
                Salvar e Enviar NF
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </ProfessorShell>
  );
}
