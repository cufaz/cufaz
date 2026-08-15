import { useState } from "react";
import { Plus, Edit2, Building2, MapPin, Users, DollarSign, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Polo } from "./types";
import { formatBRL } from "./utils";

export function PolosTab({
  polos,
  setPolos,
}: {
  polos: Polo[];
  setPolos: React.Dispatch<React.SetStateAction<Polo[]>>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolo, setEditingPolo] = useState<Polo | null>(null);

  // Form State
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("RJ");
  const [endereco, setEndereco] = useState("");
  const [perfilTematico, setPerfilTematico] = useState("Educação e esporte");
  const [pontoFocal, setPontoFocal] = useState("");
  const [vagasTotais, setVagasTotais] = useState("100");
  const [beneficiariosProjetados, setBeneficiariosProjetados] = useState("100");
  const [orcamentoDisplay, setOrcamentoDisplay] = useState("0,00");
  const [orcamentoNum, setOrcamentoNum] = useState(0);
  const [ativo, setAtivo] = useState(true);

  function openCreateModal() {
    setEditingPolo(null);
    setNome("");
    setSlug("");
    setCidade("Rio de Janeiro");
    setUf("RJ");
    setEndereco("");
    setPerfilTematico("Educação e esporte");
    setPontoFocal("");
    setVagasTotais("100");
    setBeneficiariosProjetados("100");
    setOrcamentoDisplay("0,00");
    setOrcamentoNum(0);
    setAtivo(true);
    setModalOpen(true);
  }

  function openEditModal(polo: Polo) {
    setEditingPolo(polo);
    setNome(polo.nome);
    setSlug(polo.slug);
    setCidade(polo.cidade);
    setUf(polo.uf);
    setEndereco(polo.endereco);
    setPerfilTematico(polo.perfilTematico);
    setPontoFocal(polo.pontoFocal);
    setVagasTotais(polo.vagasTotais.toString());
    setBeneficiariosProjetados(polo.beneficiariosProjetados.toString());
    setOrcamentoNum(polo.orcamentoMensal);
    setOrcamentoDisplay(
      polo.orcamentoMensal.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    setAtivo(polo.ativo);
    setModalOpen(true);
  }

  function handleOrcamentoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setOrcamentoDisplay("0,00");
      setOrcamentoNum(0);
      return;
    }
    const val = parseFloat(raw) / 100;
    setOrcamentoNum(val);
    setOrcamentoDisplay(
      val.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Nome obrigatório");
      return;
    }

    const vagas = parseInt(vagasTotais, 10) || 0;
    const benef = parseInt(beneficiariosProjetados, 10) || 0;

    if (editingPolo) {
      setPolos((prev) =>
        prev.map((p) =>
          p.id === editingPolo.id
            ? {
                ...p,
                nome: nome.trim(),
                slug: slug.trim() || nome.toLowerCase().replace(/\s+/g, "-"),
                cidade: cidade.trim(),
                uf: uf.trim().toUpperCase(),
                endereco: endereco.trim(),
                perfilTematico: perfilTematico.trim(),
                pontoFocal: pontoFocal.trim(),
                vagasTotais: vagas,
                beneficiariosProjetados: benef,
                orcamentoMensal: orcamentoNum,
                ativo,
              }
            : p
        )
      );
      toast.success("Polo atualizado!", {
        description: `O polo ${nome} foi atualizado com orçamento de ${formatBRL(orcamentoNum)}.`,
      });
    } else {
      const novo: Polo = {
        id: `polo-${Date.now()}`,
        nome: nome.trim(),
        slug: slug.trim() || nome.toLowerCase().replace(/\s+/g, "-"),
        cidade: cidade.trim(),
        uf: uf.trim().toUpperCase(),
        endereco: endereco.trim(),
        perfilTematico: perfilTematico.trim(),
        pontoFocal: pontoFocal.trim(),
        vagasTotais: vagas,
        beneficiariosProjetados: benef,
        orcamentoMensal: orcamentoNum,
        ativo,
      };
      setPolos((prev) => [...prev, novo]);
      toast.success("Novo polo cadastrado!", {
        description: `Polo ${nome} cadastrado com ${benef} beneficiários projetados.`,
      });
    }

    setModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Polos CUFA</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro e gestão das unidades e comunidades atendidas pelo projeto.
          </p>
        </div>
        <Button
          className="bg-brand-gradient text-white font-bold shadow-brand"
          onClick={openCreateModal}
        >
          <Plus className="size-4 mr-1.5" /> Novo Polo
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {polos.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between transition-all hover:shadow-md"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{p.nome}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="size-3 text-primary" /> {p.cidade} / {p.uf} •{" "}
                    {p.ativo ? (
                      <span className="text-emerald-600 font-bold">Ativo</span>
                    ) : (
                      <span className="text-destructive font-bold">Inativo</span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => openEditModal(p)}
                >
                  <Edit2 className="size-4" />
                </Button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{p.endereco || "Sem endereço cadastrado"}</p>

              <dl className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-border/50 text-xs">
                <div>
                  <dt className="text-muted-foreground">Vagas</dt>
                  <dd className="font-extrabold text-foreground text-sm">{p.vagasTotais}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Beneficiários</dt>
                  <dd className="font-extrabold text-primary text-sm">{p.beneficiariosProjetados}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Orçamento/mês</span>
              <span className="font-extrabold text-primary text-base">{formatBRL(p.orcamentoMensal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar/Editar Polo */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold">
              {editingPolo ? "Editar polo" : "Cadastrar novo polo"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do polo, orçamento mensal e metas de vagas.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-2 grid gap-4" onSubmit={handleSave}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Nome do Polo</Label>
                <Input required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Polo Madureira" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Identificador (slug)</Label>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="madureira" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Cidade</Label>
                <Input required value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Rio de Janeiro" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">UF</Label>
                <Input required value={uf} onChange={(e) => setUf(e.target.value)} placeholder="RJ" maxLength={2} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Endereço Completo</Label>
              <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua / Avenida, Número, Bairro" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Perfil Temático</Label>
                <Input value={perfilTematico} onChange={(e) => setPerfilTematico(e.target.value)} placeholder="Educação e esporte" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Ponto Focal</Label>
                <Input value={pontoFocal} onChange={(e) => setPontoFocal(e.target.value)} placeholder="Nome do coordenador" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Vagas Totais</Label>
                <Input type="number" min={0} value={vagasTotais} onChange={(e) => setVagasTotais(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Beneficiários Projetados</Label>
                <Input type="number" min={0} value={beneficiariosProjetados} onChange={(e) => setBeneficiariosProjetados(e.target.value)} />
              </div>
            </div>

            {/* Formatação BRL no Orçamento Mensal (Fix Anexo 4) */}
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Orçamento Mensal (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm font-bold text-muted-foreground">R$</span>
                <Input
                  type="text"
                  required
                  value={orcamentoDisplay}
                  onChange={handleOrcamentoChange}
                  className="pl-10 font-extrabold text-foreground text-base h-11"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border mt-2">
              <Label className="text-sm font-bold text-foreground cursor-pointer">Polo Ativo</Label>
              <Switch checked={ativo} onCheckedChange={setAtivo} />
            </div>

            <div className="mt-2 flex justify-end">
              <Button type="submit" className="h-11 bg-brand-gradient text-white font-bold px-7 shadow-brand text-base">
                Salvar Polo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
