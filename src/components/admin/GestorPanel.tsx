import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Layers,
  CircleDollarSign,
  ShoppingCart,
  Users,
  GraduationCap,
  LogOut,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import logo from "@/assets/cufa-z-logo.png";
import { Button } from "@/components/ui/button";
import { Polo, Lancamento, CategoriaDespesa } from "./types";
import { DashboardTab } from "./DashboardTab";
import { PolosTab } from "./PolosTab";
import { FinanceiroTab } from "./FinanceiroTab";
import { GenericTab } from "./GenericTab";

const initialPolos: Polo[] = [
  {
    id: "penha",
    nome: "Complexo da Penha",
    slug: "penha",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    endereco: "Estrada José Rucas 1266 Vila Cruzeiro Penha - RJ",
    perfilTematico: "Educação e esporte",
    pontoFocal: "Alessandra Vieira",
    vagasTotais: 150,
    beneficiariosProjetados: 150,
    orcamentoMensal: 109017.99,
    ativo: true,
  },
  {
    id: "madureira",
    nome: "Viaduto de Madureira",
    slug: "madureira",
    cidade: "Rio de Janeiro",
    uf: "RJ",
    endereco: "Rua Carvalho de Souza, Madureira - RJ",
    perfilTematico: "Cultura e esportes de rua",
    pontoFocal: "Carlos Mello",
    vagasTotais: 120,
    beneficiariosProjetados: 120,
    orcamentoMensal: 74301.77,
    ativo: true,
  },
  {
    id: "paraisopolis",
    nome: "Paraisópolis",
    slug: "paraisopolis",
    cidade: "São Paulo",
    uf: "SP",
    endereco: "Rua Ernest Renan, Paraisópolis - SP",
    perfilTematico: "Artes marciais e oficinas",
    pontoFocal: "Mariana Souza",
    vagasTotais: 80,
    beneficiariosProjetados: 80,
    orcamentoMensal: 34620.40,
    ativo: true,
  },
];

const initialCategoriasDespesas: CategoriaDespesa[] = [
  { nome: "Pessoal", previsto: 46200.00 },
  { nome: "Encargos", previsto: 19193.51 },
  { nome: "Materiais", previsto: 7617.08 },
  { nome: "Materiais esportivos", previsto: 8233.85 },
  { nome: "Materiais / consumo", previsto: 1480.00 },
  { nome: "Administrativo / RH essencial", previsto: 26293.55 },
];

const initialLancamentos: Lancamento[] = [
  {
    id: "l1",
    tipo: "despesa",
    valor: 100.00,
    descricao: "Teste de despesa administrativa",
    categoria: "Administrativo / RH essencial",
    poloId: "todos",
    data: "2026-08-15",
  },
];

export type TabType =
  | "dashboard"
  | "polos"
  | "atividades"
  | "financeiro"
  | "pedidos"
  | "alunos"
  | "professores";

export function GestorPanel({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>("financeiro");
  const [isTabChanging, setIsTabChanging] = useState(false);

  // Shared state
  const [polos, setPolos] = useState<Polo[]>(initialPolos);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(initialLancamentos);

  function handleTabChange(newTab: TabType) {
    if (newTab === activeTab) return;
    setIsTabChanging(true);
    setActiveTab(newTab);
    setTimeout(() => {
      setIsTabChanging(false);
    }, 350);
  }

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "polos", label: "Polos", icon: Building2 },
    { id: "atividades", label: "Atividades", icon: Layers },
    { id: "financeiro", label: "Financeiro", icon: CircleDollarSign },
    { id: "pedidos", label: "Pedidos", icon: ShoppingCart },
    { id: "alunos", label: "Alunos", icon: Users },
    { id: "professores", label: "Professores", icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header matching screenshot */}
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CUFA" className="h-10 w-auto object-contain" />
            <span className="text-xs font-black uppercase tracking-wider text-primary">
              PAINEL DO GESTOR
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-bold text-muted-foreground hover:text-destructive"
              onClick={() => {
                toast("Sessão encerrada");
                onLogout();
              }}
            >
              <LogOut className="size-4 mr-1" /> Sair
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t border-border/60 bg-card px-4 sm:px-6 overflow-x-auto">
          <div className="mx-auto flex max-w-7xl items-center gap-1 py-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTabChange(t.id)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area with centered circle loading on tab switch (Anexo 1) */}
      <main className="relative flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        {isTabChanging && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 rounded-2xl min-h-[500px]">
            <Loader2 className="size-12 animate-spin text-primary" />
            <p className="mt-3 text-sm font-bold text-foreground">Carregando painel...</p>
          </div>
        )}

        {activeTab === "dashboard" && <DashboardTab polos={polos} lancamentos={lancamentos} />}

        {activeTab === "polos" && <PolosTab polos={polos} setPolos={setPolos} />}

        {activeTab === "atividades" && (
          <GenericTab
            title="Atividades"
            subtitle="Modalidades e oficinas esportivas e culturais da CUFA"
            items={[
              { id: "1", nome: "Karatê Comunidade", info: "Polo Paraisópolis • 40 Alunos", tag: "Esporte" },
              { id: "2", nome: "Jiu Jitsu Penha", info: "Complexo da Penha • 50 Alunos", tag: "Artes Marciais" },
              { id: "3", nome: "Futsal Madureira", info: "Viaduto de Madureira • 60 Alunos", tag: "Esporte Coletivo" },
            ]}
          />
        )}

        {activeTab === "financeiro" && (
          <FinanceiroTab
            polos={polos}
            lancamentos={lancamentos}
            setLancamentos={setLancamentos}
            categoriasDespesas={initialCategoriasDespesas}
          />
        )}

        {activeTab === "pedidos" && (
          <GenericTab
            title="Pedidos de Materiais"
            subtitle="Solicitações de equipamentos e insumos dos polos"
            items={[
              { id: "1", nome: "Pedido de Bolas de Futsal", info: "Polo Madureira • Solicitado por Carlos Mello", tag: "Pendente" },
              { id: "2", nome: "Kimonos para Karatê", info: "Polo Paraisópolis • Solicitado por Mariana Souza", tag: "Aprovado" },
            ]}
          />
        )}

        {activeTab === "alunos" && (
          <GenericTab
            title="Alunos Matriculados"
            subtitle="Gestão de matrículas e presença nas atividades"
            items={[
              { id: "1", nome: "João Pedro Silva", info: "Matriculado no Karatê • Polo Paraisópolis", tag: "Ativo" },
              { id: "2", nome: "Maria Clara Santos", info: "Matriculada no Futsal • Polo Madureira", tag: "Ativa" },
            ]}
          />
        )}

        {activeTab === "professores" && (
          <GenericTab
            title="Professores e Voluntários"
            subtitle="Corpo docente e mentores voluntários cadastrados"
            items={[
              { id: "1", nome: "Prof. Alexandre Ferreira", info: "Instrutor de Jiu Jitsu • Complexo da Penha", tag: "Professor" },
              { id: "2", nome: "Profa. Beatriz Oliveira", info: "Instrutora de Costura • Polo Madureira", tag: "Professora" },
            ]}
          />
        )}
      </main>
    </div>
  );
}
