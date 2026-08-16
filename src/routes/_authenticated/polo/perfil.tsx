import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Mail, Phone, Calendar, Building2, Save, Camera, FileText } from "lucide-react";
import { toast } from "sonner";
import { PoloResponsavelShell } from "@/components/polo/PoloResponsavelShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/polo/perfil")({
  component: PoloPerfilPage,
});

export function PoloPerfilPage() {
  const [poloNome] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");

  const [nome, setNome] = useState("Alessandra Vieira");
  const [email, setEmail] = useState("alessandra.penha@cufa.com.br");
  const [telefone, setTelefone] = useState("(21) 98888-9999");
  const [dataNascimento, setDataNascimento] = useState("1988-05-14");
  const [fotoUrl, setFotoUrl] = useState("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300");
  const [biografia, setBiografia] = useState(
    "Coordenadora operacional da CUFA com mais de 8 anos de atuação em projetos sociais de esporte, cultura e educação para jovens periféricos."
  );

  function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Perfil do Responsável atualizado com sucesso!", {
      description: "Suas informações de cadastro foram salvas.",
    });
  }

  return (
    <PoloResponsavelShell
      title="Configuração de Perfil"
      description={`Dados pessoais, foto de perfil, data de nascimento e biografia — Unidade ${poloNome}.`}
    >
      <form onSubmit={handleSalvarPerfil} className="grid gap-6 md:grid-cols-3">
        {/* Card Foto de Perfil */}
        <Card className="border-border shadow-xs text-center">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold">Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="relative inline-block">
              <Avatar className="size-28 border-2 border-primary/30 mx-auto shadow-md">
                <AvatarImage src={fotoUrl} />
                <AvatarFallback className="bg-primary/10 text-primary font-extrabold text-2xl">
                  {nome.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90"
              >
                <Camera className="size-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="font-extrabold text-sm text-foreground block">{nome}</span>
              <span className="text-xs text-muted-foreground font-medium block">
                Responsável da Unidade {poloNome}
              </span>
            </div>

            <div className="space-y-1 text-left pt-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">URL da Foto</Label>
              <Input
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                className="text-xs font-mono"
              />
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Dados Pessoais */}
        <Card className="md:col-span-2 border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold">Informações do Responsável</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <User className="size-3.5 text-primary" /> Nome Completo
                </Label>
                <Input
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Mail className="size-3.5 text-primary" /> E-mail de Login
                </Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="font-medium"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Phone className="size-3.5 text-primary" /> Telefone / WhatsApp
                </Label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                  <Calendar className="size-3.5 text-primary" /> Data de Nascimento
                </Label>
                <Input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3.5 text-primary" /> Unidade / Polo Atribuído
              </Label>
              <Input
                disabled
                value={poloNome}
                className="font-bold bg-muted/30 text-foreground"
              />
              <span className="text-[11px] text-muted-foreground">
                O vinculo de unidade limita seu acesso estritamente aos indicadores deste polo.
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1">
                <FileText className="size-3.5 text-primary" /> Biografia / Histórico
              </Label>
              <Textarea
                rows={3}
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                className="leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" className="bg-brand-gradient text-white font-bold shadow-brand">
                <Save className="mr-1.5 size-4" /> Salvar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </PoloResponsavelShell>
  );
}
