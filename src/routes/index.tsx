import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Sparkles, Loader2 } from "lucide-react";

import logo from "@/assets/cufa-z-logo.png";
import cufaLogo from "@/assets/cufa-logo-transparent.png";
import amazonLogo from "@/assets/amazon-logo-transparent.png";
import hero from "@/assets/hero.jpg";
import karate from "@/assets/karate.jpg";
import jiujitsu from "@/assets/jiujitsu.jpg";
import futsal from "@/assets/futsal.jpg";
import basquete from "@/assets/basquete.jpg";
import natacao from "@/assets/natacao.jpg";
import costura from "@/assets/costura.jpg";
import ingles from "@/assets/ingles.jpg";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SignupDialog } from "@/components/site/SignupDialog";

function ProgressiveImage({
  src,
  alt,
  className = "",
  containerClassName = "",
  width,
  height,
  loading = "lazy",
  showSpinner = true,
}: {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  showSpinner?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const isAbsolute = containerClassName.includes("absolute");
  const positionClass = isAbsolute ? "" : "relative";

  return (
    <div className={`${positionClass} overflow-hidden ${containerClassName}`}>
      {!loaded && showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/30 backdrop-blur-xs z-10 pointer-events-none transition-opacity duration-300">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        ref={(imgNode) => {
          if (imgNode && imgNode.complete) {
            setLoaded(true);
          }
        }}
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CUFA Z — Esporte e educação nas comunidades | CUFA + Amazon" },
      {
        name: "description",
        content:
          "CUFA Z é a plataforma dos projetos sociais CUFA e Amazon: karatê, jiu jitsu, futsal, natação, costura e inglês nas comunidades. Matricule-se ou seja professor.",
      },
      { property: "og:title", content: "CUFA Z — Projetos sociais CUFA + Amazon" },
      {
        property: "og:description",
        content:
          "Esporte, cultura e educação para as comunidades. Conheça os projetos e faça sua inscrição na plataforma CUFA Z.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const projetos = [
  { nome: "Karatê", img: karate, local: "Paraisópolis", desc: "Disciplina, foco e respeito para crianças e adolescentes." },
  { nome: "Jiu Jitsu", img: jiujitsu, local: "Complexo da Penha", desc: "Autoconfiança e defesa pessoal com professores da comunidade." },
  { nome: "Futsal", img: futsal, local: "Madureira", desc: "Trabalho em equipe e competições entre comunidades." },
  { nome: "Basquete", img: basquete, local: "Madureira", desc: "Iniciação esportiva e escolinhas de base." },
  { nome: "Natação", img: natacao, local: "Complexo da Penha", desc: "Aprendizado aquático e segurança para todas as idades." },
  { nome: "Corte e Costura", img: costura, local: "Madureira", desc: "Geração de renda e empreendedorismo para famílias." },
  { nome: "Aula de Inglês", img: ingles, local: "Complexo da Penha", desc: "Novas oportunidades de estudo e trabalho." },
];

const numeros = [
  { valor: "7", label: "Modalidades ativas" },
  { valor: "5", label: "Comunidades atendidas" },
  { valor: "1.200+", label: "Alunos impactados" },
  { valor: "60+", label: "Professores e voluntários" },
];

function Index() {
  const [signup, setSignup] = useState(false);

  return (
    <div id="topo" className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-surface/40 border-b border-border">
          <ProgressiveImage
            src={hero}
            alt="Jovens das comunidades atendidas pelos projetos CUFA Z"
            width={1600}
            height={1100}
            showSpinner={false}
            containerClassName="absolute inset-0 size-full pointer-events-none"
            className="size-full object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5 text-primary" /> CUFA × Amazon
            </span>
            <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] sm:text-6xl font-extrabold text-foreground">
              A força da <span className="text-brand-gradient">favela</span> em movimento
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
              O CUFA Z conecta comunidades, professores e voluntários em projetos de esporte,
              cultura e educação. Aqui o aluno se matricula, o professor se inscreve e a CUFA
              acompanha tudo em um só lugar.
            </p>
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
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs transition-shadow hover:shadow-md">
              <div className="flex h-16 items-center">
                <ProgressiveImage
                  src={cufaLogo}
                  alt="CUFA — Central Única das Favelas"
                  containerClassName="h-14"
                  className="h-14 w-auto object-contain"
                />
              </div>
              <h3 className="mt-4 text-xl font-bold text-foreground">CUFA — Central Única das Favelas</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Criada em 1999 por jovens de diversas favelas do Rio de Janeiro, a CUFA nasceu da
                união em torno do rap, do grafite, do break e do basquete de rua. Hoje está
                presente em todos os estados brasileiros e em mais de 20 países, promovendo
                esporte, cultura, educação, cidadania e geração de renda para milhões de pessoas
                que vivem nas periferias.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs transition-shadow hover:shadow-md">
              <div className="flex h-16 items-center">
                <ProgressiveImage
                  src={amazonLogo}
                  alt="Amazon — tecnologia e voluntariado"
                  containerClassName="h-12"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <h3 className="mt-4 text-xl font-bold text-foreground">Amazon — tecnologia e voluntariado</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                A Amazon apoia projetos de impacto social no Brasil investindo em infraestrutura,
                formação e no voluntariado de seus funcionários. Na parceria com a CUFA, os
                voluntários colaboram em atividades nas comunidades — de aulas e oficinas a
                mentorias — e a tecnologia entra para organizar, medir e ampliar o alcance de
                cada projeto.
              </p>
            </article>
          </div>

          <div className="mt-6 flex flex-col items-center gap-5 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center sm:flex-row sm:text-left">
            <ProgressiveImage
              src={logo}
              alt="Logotipo CUFA Z"
              containerClassName="h-16 sm:h-20 shrink-0"
              className="h-16 sm:h-20 w-auto shrink-0 object-contain"
            />
            <p className="text-sm leading-relaxed text-muted-foreground">
              <strong className="text-foreground font-semibold">CUFA Z</strong> é a plataforma que une as duas
              histórias: um só lugar para inscrever professores, matricular alunos, organizar
              turmas por comunidade e acompanhar o impacto real de cada modalidade.
            </p>
          </div>
        </section>

        {/* Projetos */}
        <section id="projetos" className="border-y border-border bg-surface/50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Projetos e modalidades</h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Atividades gratuitas oferecidas nas unidades CUFA, com professores da própria
              comunidade e apoio dos voluntários Amazon.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {projetos.map((p) => (
                <article
                  key={p.nome}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                >
                  <ProgressiveImage
                    src={p.img}
                    alt={`Turma de ${p.nome}`}
                    loading="lazy"
                    width={1200}
                    height={900}
                    containerClassName="h-48 w-full"
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-foreground">{p.nome}</h3>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-primary">
                      <MapPin className="size-3.5" /> {p.local}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
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
            {["Madureira", "Complexo da Penha", "Paraisópolis", "Cidade de Deus", "Heliópolis"].map(
              (c) => (
                <li
                  key={c}
                  className="rounded-full border border-border bg-card px-4.5 py-2 text-sm font-semibold text-foreground shadow-2xs"
                >
                  {c}
                </li>
              ),
            )}
          </ul>

          <div className="mt-10 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary via-primary/95 to-brand-deep p-8 sm:p-10 text-white shadow-brand">
            <h3 className="text-2xl sm:text-3xl font-extrabold">Faça parte do CUFA Z</h3>
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
          <ProgressiveImage
            src={logo}
            alt="CUFA Z"
            containerClassName="h-14 sm:h-16 shrink-0"
            className="h-14 sm:h-16 w-auto object-contain"
          />
          <div className="text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Projeto social CUFA em parceria com a Amazon.</p>
            <p className="mt-1">contato@cufaz.org.br</p>
            <p className="mt-3 text-xs">© {new Date().getFullYear()} CUFA Z</p>
          </div>
        </div>
      </footer>

      <SignupDialog open={signup} onOpenChange={setSignup} />
    </div>
  );
}
