import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Image as ImageIcon, Plus, Trash2, BookOpen, Upload, CheckCircle2 } from "lucide-react";
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

  // Dynamic Activity List per Polo (Anexo 1)
  const atividadesPolo = poloNome.toLowerCase().includes("madureira")
    ? ["Basquete", "Karatê", "Capoeira"]
    : poloNome.toLowerCase().includes("paraisopolis")
    ? ["Futsal"]
    : ["Jiu Jitsu", "Aula de Inglês", "Natação"];

  function loadUnitFotos(unitName: string) {
    const cleanUnit = unitName.toLowerCase().trim();
    try {
      const storedUnit = localStorage.getItem(`cufa_galeria_${cleanUnit}`);
      if (storedUnit) {
        const parsed = JSON.parse(storedUnit);
        if (Array.isArray(parsed)) return parsed;
      }

      const storedAll = localStorage.getItem("cufa_polo_galeria_fotos") || localStorage.getItem("cufa_galeria_fotos");
      if (storedAll) {
        const parsed = JSON.parse(storedAll);
        if (Array.isArray(parsed)) {
          return parsed.filter((f: any) => {
            const fPolo = String(f.polo || f.poloNome || "").toLowerCase();
            return fPolo.includes(cleanUnit) || cleanUnit.includes(fPolo);
          });
        }
      }
    } catch {}

    return [];
  }

  const [fotos, setFotos] = useState<FotoItem[]>(() => {
    return loadUnitFotos(poloNome);
  });

  const [atividade, setAtividade] = useState(atividadesPolo[0]);
  const [titulo, setTitulo] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Upload Multiple Files directly (Anexo 4)
  function handleAdicionarFotos(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Selecione pelo menos uma imagem para fazer upload.");
      return;
    }

    setIsUploading(true);
    const newItems: FotoItem[] = [];
    let processed = 0;

    Array.from(selectedFiles).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        newItems.push({
          id: `f-${Date.now()}-${index}`,
          polo: poloNome,
          atividade: atividade || atividadesPolo[0] || "Jiu Jitsu",
          titulo: titulo ? `${titulo} (${index + 1})` : file.name.replace(/\.[^/.]+$/, ""),
          url: base64Url || "",
          dataUpload: new Date().toLocaleDateString("pt-BR"),
        } as any);

        processed++;
        if (processed === selectedFiles.length) {
          setFotos((prev) => {
            const updated = [...newItems, ...prev];
            const cleanUnit = poloNome.toLowerCase().trim();
            try {
              localStorage.setItem(`cufa_galeria_${cleanUnit}`, JSON.stringify(updated));

              const storedAll = localStorage.getItem("cufa_polo_galeria_fotos") || localStorage.getItem("cufa_galeria_fotos");
              let allList: any[] = storedAll ? JSON.parse(storedAll) : [];
              allList = [...newItems, ...allList.filter((f: any) => !newItems.some((n) => n.id === f.id))];
              localStorage.setItem("cufa_polo_galeria_fotos", JSON.stringify(allList));
              localStorage.setItem("cufa_galeria_fotos", JSON.stringify(allList));
            } catch {}
            return updated;
          });
          setIsUploading(false);
          setModalOpen(false);
          setTitulo("");
          setSelectedFiles(null);
          toast.success(`${processed} foto(s) adicionada(s) à galeria!`, {
            description: `Exibidas e salvas para os alunos de ${atividade} no ${poloNome}.`,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function handleRemoverFoto(id: string) {
    const updated = fotos.filter((f) => f.id !== id);
    setFotos(updated);
    toast.success("Foto removida da galeria.");
  }

  return (
    <PoloResponsavelShell
      title="Galeria de Fotos dos Cursos"
      description={`Upload e galeria fixa de fotos das oficinas exibidas para os alunos — ${poloNome}.`}
      actions={
        <Button
          onClick={() => setModalOpen(true)}
          className="bg-brand-gradient text-white font-bold shadow-brand"
        >
          <Upload className="mr-1.5 size-4" /> Upload de Fotos
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Grid de Fotos */}
        {fotos.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
            <ImageIcon className="size-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-bold text-base text-foreground">Nenhuma foto enviada para a galeria do polo.</p>
            <p className="text-xs max-w-sm mx-auto mt-1">Clique em 'Upload de Fotos' para enviar imagens das oficinas do seu polo diretamente do computador.</p>
          </div>
        ) : (
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
                      Fixa na Plataforma
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
        )}
      </div>

      {/* Modal Upload de Fotos (Sem campo de URL, suporte a seleção múltipla - Anexo 4 & 5) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Upload className="size-5 text-primary" /> Upload de Fotos do Curso
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAdicionarFotos} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Oficina / Atividade</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-medium"
                value={atividade}
                onChange={(e) => setAtividade(e.target.value)}
              >
                {atividadesPolo.map((ativ) => (
                  <option key={ativ} value={ativ}>
                    {ativ}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Título / Legenda da Foto (Opcional)</Label>
              <Input
                placeholder="ex.: Treino de Graduação, Apresentação..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="font-medium"
              />
            </div>

            {/* Input de Upload de Múltiplos Arquivos (Anexo 4) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Selecionar Imagens do Computador (Permite Múltiplas)
              </Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                required
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="cursor-pointer font-medium file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              <span className="text-[11px] text-muted-foreground block">
                Pressione Ctrl (ou Cmd) para selecionar mais de uma imagem simultaneamente.
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="submit" disabled={isUploading} className="w-full bg-brand-gradient text-white font-bold shadow-brand">
                {isUploading ? "Processando Upload..." : "Publicar Fotos na Galeria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PoloResponsavelShell>
  );
}
