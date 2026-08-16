import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Image as ImageIcon, Plus, Trash2, BookOpen, Eye } from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/polo/galeria")({
  component: PoloGaleriaPage,
});

interface FotoItem {
  id: string;
  atividade: string;
  titulo: string;
  url: string;
  dataUpload: string;
}

export function PoloGaleriaPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [modalOpen, setModalOpen] = useState(false);

  const [fotos, setFotos] = useState<FotoItem[]>([
    {
      id: "f1",
      atividade: "Jiu Jitsu",
      titulo: "Treino de Graduação e Gradiente",
      url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600",
      dataUpload: "12/08/2026",
    },
    {
      id: "f2",
      atividade: "Natação",
      titulo: "Aula Prática de Adaptação Aquática",
      url: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600",
      dataUpload: "10/08/2026",
    },
    {
      id: "f3",
      atividade: "Corte e Costura",
      titulo: "Oficina de Modelagem e Peças Piloto",
      url: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600",
      dataUpload: "08/08/2026",
    },
  ]);

  const [atividade, setAtividade] = useState("Jiu Jitsu");
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");

  function handleAdicionarFoto(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo || !url) {
      toast.error("Preencha o título e a URL da foto.");
      return;
    }

    const nova: FotoItem = {
      id: `f-${Date.now()}`,
      atividade,
      titulo,
      url,
      dataUpload: new Date().toLocaleDateString("pt-BR"),
    };

    setFotos([nova, ...fotos]);
    toast.success("Foto adicionada à galeria do curso!", {
      description: `Exibida publicamente para os alunos em ${atividade}.`,
    });
    setModalOpen(false);
    setTitulo("");
    setUrl("");
  }

  function handleRemoverFoto(id: string) {
    setFotos(fotos.filter((f) => f.id !== id));
    toast.success("Foto removida da galeria.");
  }

  return (
    <PoloResponsavelShell
      title="Galeria de Fotos dos Cursos"
      description={`Imagens das oficinas e atividades práticas exibidas para os alunos — ${poloNome}.`}
      actions={
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-brand-gradient text-white font-bold shadow-brand"
        >
          <Plus className="mr-1.5 size-4" /> Adicionar Foto
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Grid de Fotos */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fotos.map((f) => (
            <Card key={f.id} className="overflow-hidden border-border shadow-xs group">
              <div className="relative aspect-video bg-muted overflow-hidden">
                <img
                  src={f.url}
                  alt={f.titulo}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <Badge className="absolute top-3 left-3 bg-background/90 text-foreground font-bold text-xs backdrop-blur-xs">
                  <BookOpen className="size-3 mr-1 text-primary" /> {f.atividade}
                </Badge>
              </div>

              <CardContent className="p-4 space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">{f.titulo}</h4>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    Adicionada em {f.dataUpload}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    Visível aos Alunos
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-destructive hover:bg-destructive/10 font-bold"
                    onClick={() => handleRemoverFoto(f.id)}
                  >
                    <Trash2 className="size-3.5 mr-1" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Adicionar Foto */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Adicionar Foto ao Curso</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdicionarFoto} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Oficina / Atividade</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                value={atividade}
                onChange={(e) => setAtividade(e.target.value)}
              >
                <option value="Jiu Jitsu">Jiu Jitsu</option>
                <option value="Aula de Inglês">Aula de Inglês</option>
                <option value="Natação">Natação</option>
                <option value="Corte e Costura">Corte e Costura</option>
                <option value="Futsal">Futsal</option>
                <option value="Basquete">Basquete</option>
                <option value="Karatê">Karatê</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Título / Legenda da Foto</Label>
              <Input
                required
                placeholder="ex.: Aula prática de graduação, Apresentação final..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">URL da Imagem</Label>
              <Input
                required
                placeholder="https://images.unsplash.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="font-medium"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" className="w-full bg-brand-gradient text-white font-bold shadow-brand">
                Publicar Foto na Galeria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PoloResponsavelShell>
  );
}
