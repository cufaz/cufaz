import { createFileRoute } from "@tanstack/react-router";
import { Image as ImageIcon, Clock, Sparkles } from "lucide-react";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/polo/galeria")({
  component: PoloGaleriaPage,
});

export function PoloGaleriaPage() {
  return (
    <PoloResponsavelShell
      title="Galeria de Fotos"
      description="Módulo de galeria de fotos e registros visuais das atividades."
    >
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-card border border-border rounded-3xl shadow-xs">
        <div className="relative mb-6">
          <div className="grid size-20 place-items-center rounded-3xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
            <ImageIcon className="size-10 text-primary" />
          </div>
          <Badge className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 shadow-md">
            EM BREVE
          </Badge>
        </div>

        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl max-w-md">
          Galeria de Fotos em Desenvolvimento
        </h2>

        <p className="mt-3 text-sm text-muted-foreground max-w-lg leading-relaxed font-medium">
          O módulo de galeria visual e registro fotográfico das oficinas estará disponível em breve para envio e gestão integrada de mídia do polo.
        </p>

        <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/40 border border-border text-xs font-bold text-muted-foreground">
          <Clock className="size-4 text-primary" /> Funcionalidade em homologação final
        </div>
      </div>
    </PoloResponsavelShell>
  );
}
