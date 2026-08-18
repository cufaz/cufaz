import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MapPin, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { SignupDialog } from "@/components/site/SignupDialog";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Index,
});

interface AtividadeSiteItem {
  id: string;
  nome: string;
  local: string;
  desc: string;
}

const numeros = [
  { valor: "7", label: "Modalidades ativas" },
  { valor: "3", label: "Comunidades atendidas" },
  { valor: "1.200+", label: "Alunos impactados" },
  { valor: "60+", label: "Professores e voluntários" },
];

function Index() {
  const [signup, setSignup] = useState(false);

  // Dynamic activity list from database with 5-by-5 pagination
  const [atividadesDB, setAtividadesDB] = useState<AtividadeSiteItem[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  async function loadAtividadesFromDB() {
    try {
      const { data, error } = await supabase
        .from("atividades")
        .select("id, nome, descricao, polo_id, polos(nome)")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (data && !error && data.length > 0) {
        const formatted: AtividadeSiteItem[] = data.map((a: any) => ({
          id: a.id,
          nome: a.nome,
          local: a.polos?.nome || "Complexo da Penha",
          desc: a.descricao || "Oficina gratuita de formação esportiva, cultural ou cidadã.",
        }));
        setAtividadesDB(formatted);
        return;
      }
    } catch {}

    // Fallback default 7 activities if database query returns empty
    setAtividadesDB([
      { id: "1", nome: "Jiu Jitsu", local: "Complexo da Penha", desc: "Formação esportiva, defesa pessoal e disciplina comunitária para jovens." },
      { id: "2", nome: "Basquete de Rua", local: "Viaduto de Madureira", desc: "Treinos diários e integração através da cultura do basquete de favela." },
      { id: "3", nome: "Karatê", local: "Viaduto de Madureira", desc: "Arte marcial, foco, autocontrole e aperfeiçoamento motor para crianças e adolescentes." },
      { id: "4", nome: "Futsal", local: "Paraisópolis", desc: "Escolinha de futsal comunitário com foco no desenvolvimento em equipe." },
      { id: "5", nome: "Capoeira", local: "Viaduto de Madureira", desc: "Expressão cultural, dança, musicalidade e esporte afro-brasileiro." },
      { id: "6", nome: "Corte e Costura", local: "Paraisópolis", desc: "Capacitação profissional, moda periférica e geração de renda comunitária." },
      { id: "7", nome: "Aula de Inglês", local: "Complexo da Penha", desc: "Ensino de idiomas e comunicação global para jovens da periferia." },
    ]);
  }

  useEffect(() => {
    loadAtividadesFromDB();
  }, []);

  // Pagination Math (5 em 5)
  const totalPaginas = Math.ceil(atividadesDB.length / itensPorPagina) || 1;
  const atividadesPaginadas = atividadesDB.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  return (
    <div id="topo" className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-surface/40 border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/85 to-background pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm">
              <Sparkles className="size-3.5 text-primary" /> CENTRAL ÚNICA DAS FAVELAS
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] sm:text-6xl font-extrabold text-foreground">
              A força da <span className="text-brand-gradient">favela</span> em movimento
            </h1>
            <div className="mt-5 max-w-xl rounded-2xl bg-white/85 p-5 border border-border shadow-xs backdrop-blur-md">
              <p className="text-base text-foreground font-medium sm:text-lg leading-relaxed">
                A <strong className="font-bold text-primary">CUFA</strong> conecta comunidades, professores e voluntários em projetos de esporte, cultura e educação. Aqui o aluno se matricula, o professor se inscreve e a CUFA acompanha tudo em um só lugar.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="bg-brand-gradient text-white font-semibold shadow-brand hover:opacity-95 text-base px-7 py-6"
                onClick={() => setSignup(true)}
              >
                Quero participar
              </Button>
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-semibold text-base px-7 py-6" asChild>
                <a href="#projetos">Ver projetos</a>
              </Button>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {numeros.map((n) => (
                <div key={n.label} className="rounded-xl border border-border bg-card/90 p-5 shadow-xs backdrop-blur-xs">
                  <dt className="text-2xl font-display text-primary sm:text-4xl">{n.valor}</dt>
                  <dd className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">{n.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Institucional */}
        <section id="institucional" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Quem faz acontecer</h2>
          <div className="mt-8">
            <article className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs transition-shadow hover:shadow-md">
              <div className="flex h-20 items-center">
                <span className="text-2xl font-black tracking-tight text-primary">CUFA</span>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-foreground">CUFA — Central Única das Favelas</h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Criada em 1999 por jovens de diversas favelas do Rio de Janeiro, a CUFA nasceu da
                união em torno do rap, do grafite, do break e do basquete de rua. Hoje está
                presente em todos os estados brasileiros e em mais de 20 países, promovendo
                esporte, cultura, educação, cidadania e geração de renda para milhões de pessoas
                que vivem nas periferias.
              </p>
            </article>
          </div>

          <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:text-left">
            <span className="text-xl font-black text-primary shrink-0">CUFA PLATAFORMA</span>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground font-semibold">CUFA</strong> é a plataforma que reúne nossa história: um só lugar para inscrever professores, matricular alunos, organizar turmas por comunidade e acompanhar o impacto real de cada modalidade.
            </p>
          </div>
        </section>

        {/* Projetos e Modalidades (Sem imagens nos cards, com Paginação 5 em 5) */}
        <section id="projetos" className="border-y border-border bg-surface/50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Projetos e modalidades</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                  Atividades gratuitas sincronizadas do banco de dados das unidades CUFA.
                </p>
              </div>

              {/* Controles de Paginação (5 em 5) */}
              {totalPaginas > 1 && (
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual === 1}
                    onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                    className="h-8 text-xs font-bold gap-1"
                  >
                    <ChevronLeft className="size-4" /> Anterior
                  </Button>
                  <span className="text-xs font-bold px-2 text-muted-foreground">
                    {paginaAtual} de {totalPaginas}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={paginaAtual === totalPaginas}
                    onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                    className="h-8 text-xs font-bold gap-1"
                  >
                    Próxima <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {atividadesPaginadas.map((p) => (
                <article
                  key={p.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-extrabold text-foreground">{p.nome}</h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 shrink-0">
                        <MapPin className="size-3" /> {p.local}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                      {p.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">
                      Inscrições Abertas
                    </span>
                    <Button
                      size="sm"
                      onClick={() => setSignup(true)}
                      className="bg-brand-gradient text-white font-bold text-xs shadow-brand h-8 px-4"
                    >
                      Matricular-se
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Comunidades */}
        <section id="comunidades" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Onde estamos</h2>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {["Complexo da Penha", "Viaduto de Madureira", "Paraisópolis"].map((c) => (
              <li
                key={c}
                className="rounded-full border border-border bg-card px-4.5 py-2 text-sm font-semibold text-foreground shadow-2xs"
              >
                {c}
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary via-primary/95 to-brand-deep p-8 sm:p-10 text-white shadow-brand">
            <h3 className="text-2xl sm:text-3xl font-extrabold">Faça parte da CUFA</h3>
            <p className="mt-2 max-w-lg text-sm font-medium text-white/90 leading-relaxed">
              Alunos, professores e responsáveis CUFA: crie sua conta e participe das turmas da
              sua comunidade.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-6 font-bold bg-white text-ink hover:bg-white/90 shadow-sm px-6 py-5 text-base"
              onClick={() => setSignup(true)}
            >
              Cadastre-se agora
            </Button>
          </div>
        </section>
      </main>

      <footer id="contato" className="border-t border-border bg-card py-12">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-[auto_1fr] sm:items-center">
          <span className="text-xl font-black text-primary">CUFA</span>
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Projeto social Central Única das Favelas.</p>
            <p className="mt-1">contato@cufaz.org.br</p>
            <p className="mt-3 text-xs">© {new Date().getFullYear()} CUFA</p>
          </div>
        </div>
      </footer>

      <SignupDialog open={signup} onOpenChange={setSignup} />
    </div>
  );
}
