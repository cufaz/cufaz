import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Truck,
  PieChart as PieIcon,
  FolderArchive,
  FileCheck2,
  FileClock,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Building,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

import { GestorShell } from "@/components/admin/GestorShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { fetchFornecedoresDB } from "@/lib/fornecedoresService";
import { fetchCentrosCustoDB } from "@/lib/centroCustoService";
import { fetchDocumentosGestaoDB } from "@/lib/documentosService";

export const Route = createFileRoute("/_authenticated/gestor/contabilidade/")({
  component: ContabilidadeIndexPage,
});

const COLORS = ["#0284c7", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

function ContabilidadeIndexPage() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [forns, ccs, docs] = await Promise.all([
          fetchFornecedoresDB(),
          fetchCentrosCustoDB(),
          fetchDocumentosGestaoDB(),
        ]);
        setFornecedores(forns);
        setCentrosCusto(ccs);
        setDocumentos(docs);
      } catch {}
      setLoading(false);
    }

    loadData();
    window.addEventListener("cufa_fornecedores_updated", loadData);
    window.addEventListener("cufa_centros_custo_updated", loadData);
    window.addEventListener("cufa_documentos_updated", loadData);
    return () => {
      window.removeEventListener("cufa_fornecedores_updated", loadData);
      window.removeEventListener("cufa_centros_custo_updated", loadData);
      window.removeEventListener("cufa_documentos_updated", loadData);
    };
  }, []);

  const aprovadosCount = fornecedores.filter((f) => f.status === "aprovado").length;
  const pendentesCount = fornecedores.filter((f) => f.status === "pendente").length;
  const propostasCount = fornecedores.reduce((acc, f) => acc + Number(f.propostas_count || 0), 0);
  const totalOrcadoCentros = centrosCusto.reduce((acc, c) => acc + Number(c.orcamento_mensal || 0), 0);

  // Chart Data: Despesa por Centro de Custo
  const dataCentroCusto = centrosCusto.map((c) => ({
    name: c.nome.length > 15 ? c.nome.slice(0, 15) + "..." : c.nome,
    orcado: Number(c.orcamento_mensal || 0),
    realizado: Number(c.realizado || 0),
  }));

  // Chart Data: Top Categorias de Fornecedores
  const catCountMap: Record<string, number> = {};
  fornecedores.forEach((f) => {
    (f.categorias || []).forEach((cat: string) => {
      catCountMap[cat] = (catCountMap[cat] || 0) + 1;
    });
  });
  const dataCategorias = Object.entries(catCountMap).map(([name, value]) => ({ name, value }));

  return (
    <GestorShell
      title="Contabilidade e Governança"
      description="Visão geral de fornecedores credenciados, centros de custo e auditoria documental"
      actions={
        <div className="flex items-center gap-2">
          <Link to="/gestor/contabilidade/fornecedores">
            <Button variant="outline" size="sm" className="font-bold gap-1 text-xs">
              <Truck className="size-3.5 text-amber-500" /> Fornecedores
              {pendentesCount > 0 && (
                <Badge className="bg-amber-500 text-white font-bold text-[10px] ml-1 px-1.5 py-0">
                  {pendentesCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link to="/gestor/contabilidade/centro-custo">
            <Button variant="outline" size="sm" className="font-bold gap-1 text-xs">
              <PieIcon className="size-3.5 text-emerald-500" /> Centro de Custo
            </Button>
          </Link>
          <Link to="/gestor/contabilidade/documentos">
            <Button className="bg-brand-gradient text-white font-bold size-sm text-xs shadow-brand">
              <FolderArchive className="size-3.5 mr-1" /> Gestão de Documentos
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Quick Nav Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="size-10 rounded-xl bg-orange-500/10 grid place-items-center text-orange-600">
                  <Truck className="size-5" />
                </div>
                {pendentesCount > 0 && (
                  <Badge className="bg-amber-500 text-white font-bold text-xs">
                    {pendentesCount} Pendentes
                  </Badge>
                )}
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Fornecedores</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Aprovação de cadastros, validação de tributação e propostas comerciais.
              </p>
            </div>
            <Link to="/gestor/contabilidade/fornecedores" className="mt-4 inline-flex items-center text-xs font-bold text-primary hover:underline">
              Acessar módulo <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 grid place-items-center text-emerald-600">
                  <PieIcon className="size-5" />
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-600 font-bold border border-emerald-500/30 text-xs">
                  {centrosCusto.length} Ativos
                </Badge>
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Centro de Custo</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Distribuição orçamentária por setor, consumo % e provisões operacionais.
              </p>
            </div>
            <Link to="/gestor/contabilidade/centro-custo" className="mt-4 inline-flex items-center text-xs font-bold text-primary hover:underline">
              Acessar módulo <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="size-10 rounded-xl bg-purple-500/10 grid place-items-center text-purple-600">
                  <FolderArchive className="size-5" />
                </div>
                <Badge variant="outline" className="font-bold text-xs">
                  {documentos.length} Documentos
                </Badge>
              </div>
              <h3 className="font-extrabold text-lg text-foreground">Gestão de Documentos</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Repositório unificado de Fornecedores, Professores e Alunos por setor.
              </p>
            </div>
            <Link to="/gestor/contabilidade/documentos" className="mt-4 inline-flex items-center text-xs font-bold text-primary hover:underline">
              Acessar módulo <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 grid place-items-center text-emerald-600">
                <FileCheck2 className="size-5" />
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">Fornecedores Aprovados</dt>
                <dd className="text-2xl font-black text-foreground">{aprovadosCount}</dd>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 grid place-items-center text-amber-600">
                <FileClock className="size-5" />
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">Fornecedores Pendentes</dt>
                <dd className="text-2xl font-black text-amber-600">{pendentesCount}</dd>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 grid place-items-center text-primary">
                <DollarSign className="size-5" />
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">Teto Orçamentário Centros</dt>
                <dd className="text-xl font-black text-foreground tabular-nums">{brl(totalOrcadoCentros)}</dd>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/10 grid place-items-center text-purple-600">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <dt className="text-xs font-bold text-muted-foreground uppercase">Propostas Recebidas</dt>
                <dd className="text-2xl font-black text-foreground">{propostasCount}</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Chart 1: Despesa por Centro de Custo */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-foreground">Orçado × Executado por Centro de Custo</h3>
                <p className="text-xs text-muted-foreground font-medium">Comparativo mensal por unidade de custo</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {dataCentroCusto.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataCentroCusto} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val: any) => brl(Number(val))}
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }}
                    />
                    <Bar dataKey="orcado" fill="#0284c7" name="Orçado" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="realizado" fill="#10b981" name="Realizado" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs font-semibold text-muted-foreground">Nenhum centro de custo cadastrado no banco de dados.</p>
              )}
            </div>
          </div>

          {/* Chart 2: Top Categorias de Fornecedores */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-base font-extrabold text-foreground">Categorias de Fornecedores</h3>
              <p className="text-xs text-muted-foreground font-medium">Distribuição por ramo de atuação cadastrado</p>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {dataCategorias.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dataCategorias}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dataCategorias.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "none", color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs font-semibold text-muted-foreground">Nenhum fornecedor cadastrado no banco de dados.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </GestorShell>
  );
}
