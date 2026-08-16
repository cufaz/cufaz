import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingCart, Plus, CheckCircle2, Clock, PackageCheck, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/polo/compras")({
  component: PoloComprasPage,
});

interface PedidoItem {
  id: string;
  item: string;
  categoria: string;
  quantidade: string;
  observacao: string;
  status: "pendente" | "aprovado" | "recusado";
  dataSolicitacao: string;
}

export function PoloComprasPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [modalOpen, setModalOpen] = useState(false);

  // Zeroed mock by default for clean testing (Anexo 2 & 3)
  const [pedidos, setPedidos] = useState<PedidoItem[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_compras_polo");
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });

  const DEFAULT_CATEGORIAS_CUFA = [
    "Pessoal",
    "Materiais esportivos",
    "Materiais / consumo",
    "Comunicação",
    "Evento pedagógico / esportivo",
    "Encargos",
    "Infraestrutura",
    "Administrativo / RH essencial",
    "Serviços técnicos essenciais",
    "Material didático e apostilas",
    "Uniformes e vestuário",
    "Insumos, lanche e apoio operacional",
    "Kit Lanche",
    "Custos Extras",
  ];

  const [categoriasLista] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("cufa_categorias_pedidos");
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_CATEGORIAS_CUFA;
  });

  const [itemNome, setItemNome] = useState("");
  const [categoria, setCategoria] = useState(categoriasLista[0] || "Materiais esportivos");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");

  function handleEnviarPedido(e: React.FormEvent) {
    e.preventDefault();
    if (!itemNome || !quantidade) {
      toast.error("Preencha o nome do item e a quantidade.");
      return;
    }

    const novo: PedidoItem = {
      id: `ped-${Date.now()}`,
      item: itemNome,
      categoria,
      quantidade,
      observacao,
      status: "pendente",
      dataSolicitacao: new Date().toLocaleDateString("pt-BR"),
    };

    const atualizados = [novo, ...pedidos];
    setPedidos(atualizados);
    try {
      localStorage.setItem("cufa_compras_polo", JSON.stringify(atualizados));
    } catch {}

    toast.success("Solicitação de compra enviada ao Gestor Geral!", {
      description: `Item: ${itemNome} (${quantidade}) - Encaminhado para a fila de Pedidos.`,
    });
    setModalOpen(false);
    setItemNome("");
    setQuantidade("");
    setObservacao("");
  }

  return (
    <PoloResponsavelShell
      title="Solicitação de Compras de Materiais"
      description={`Pedidos de materiais e insumos encaminhados à aprovação da Gestão Geral — ${poloNome}.`}
      actions={
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-brand-gradient text-white font-bold shadow-brand"
        >
          <Plus className="mr-1.5 size-4" /> Nova Solicitação
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Banner Informativo */}
        <div className="p-4 rounded-2xl bg-brand-gradient text-white shadow-brand space-y-1">
          <h3 className="font-extrabold text-base flex items-center gap-2">
            <ShoppingCart className="size-5" /> Fila de Pedidos de Compras do Polo
          </h3>
          <p className="text-xs opacity-90 leading-relaxed">
            Todas as solicitações de compra feitas aqui entram diretamente no painel do <b>Gestor Geral</b> para validação e aprovação.
          </p>
        </div>

        {/* Lista de Pedidos Enviados */}
        <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border bg-muted/40 p-4 flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground">Histórico de Pedidos Enviados</h3>
            <Badge variant="secondary" className="font-bold text-xs">
              {pedidos.length} solicitações
            </Badge>
          </div>

          <div className="divide-y divide-border/60">
            {pedidos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <ShoppingCart className="size-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="font-bold text-sm text-foreground">Nenhuma solicitação de compra por enquanto.</p>
                <p className="text-xs">Clique no botão 'Nova Solicitação' acima para fazer um pedido de materiais para seu polo.</p>
              </div>
            ) : (
              pedidos.map((p) => (
                <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-foreground">{p.item}</span>
                      <Badge variant="outline" className="text-[11px] font-bold">
                        {p.categoria}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Quantidade: <b className="text-foreground">{p.quantidade}</b> | Solicitado em {p.dataSolicitacao}
                    </p>
                    {p.observacao && (
                      <p className="text-xs text-muted-foreground italic">"{p.observacao}"</p>
                    )}
                  </div>

                  <div>
                    {p.status === "pendente" && (
                      <Badge className="bg-amber-500/10 text-amber-700 font-bold border-amber-500/20">
                        <Clock className="size-3 mr-1" /> Aguardando Gestor Geral
                      </Badge>
                    )}
                    {p.status === "aprovado" && (
                      <Badge className="bg-emerald-500/10 text-emerald-700 font-bold border-emerald-500/20">
                        <CheckCircle2 className="size-3 mr-1" /> Aprovado pela Gestão
                      </Badge>
                    )}
                    {p.status === "recusado" && (
                      <Badge className="bg-destructive/10 text-destructive font-bold border-destructive/20">
                        Recusado
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Nova Solicitação */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Solicitar Compra de Material</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEnviarPedido} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Categoria do Item</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {categoriasLista.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Nome do Item ou Equipamento</Label>
              <Input
                required
                placeholder="ex.: Kimonos infantis tam M, Bolas de Futsal..."
                value={itemNome}
                onChange={(e) => setItemNome(e.target.value)}
                className="font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Quantidade Necessária</Label>
              <Input
                required
                placeholder="ex.: 15 unidades, 2 galões..."
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className="font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Observação / Justificativa</Label>
              <Textarea
                rows={3}
                placeholder="Descreva a finalidade e a necessidade deste item para a oficina..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full bg-brand-gradient text-white font-bold shadow-brand">
                <Send className="mr-1.5 size-4" /> Enviar ao Gestor Geral
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PoloResponsavelShell>
  );
}
