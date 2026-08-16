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
  const loggedEmail = (localStorage.getItem("cufa_logged_user") || "").toLowerCase();

  const [perfil, setPerfil] = useState(() => {
    if (loggedEmail) {
      try {
        const storedUser = localStorage.getItem(`cufa_responsavel_perfil_${loggedEmail}`);
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.nome) return parsed;
        }
      } catch {}

      const userPhoto = localStorage.getItem(`cufa_perfil_foto_${loggedEmail}`) || "";

      let userName = localStorage.getItem(`cufa_logged_name_${loggedEmail}`);
      let userPhone = "";
      try {
        const storedUsers = localStorage.getItem("cufa_usuarios_cadastrados");
        if (storedUsers) {
          const users = JSON.parse(storedUsers);
          if (Array.isArray(users)) {
            const found = users.find((u: any) => String(u.email || "").toLowerCase() === loggedEmail);
            if (found) {
              if (found.nome) userName = found.nome;
              if (found.telefone) userPhone = found.telefone;
            }
          }
        }
      } catch {}

      if (loggedEmail.includes("britonascimento") || loggedEmail.includes("ricardo")) {
        return {
          nome: userName || "Ricardo Brito",
          email: loggedEmail,
          telefone: userPhone || "11951012933",
          dataNascimento: "1996-01-24",
          fotoUrl: userPhoto,
          biografia: "Coordenador operacional da CUFA com mais de 8 anos de atuação em projetos sociais de esporte, cultura e educação para jovens periféricos.",
        };
      }

      const prefix = (loggedEmail || "responsavel").split("@")[0] || "responsavel";
      const formattedName = userName || (prefix.charAt(0).toUpperCase() + prefix.slice(1));
      return {
        nome: formattedName,
        email: loggedEmail,
        telefone: userPhone,
        dataNascimento: "",
        fotoUrl: userPhoto,
        biografia: "",
      };
    }

    return {
      nome: "Responsável CUFA",
      email: loggedEmail,
      telefone: "",
      dataNascimento: "",
      fotoUrl: "",
      biografia: "",
    };
  });

  const [nome, setNome] = useState(perfil.nome);
  const [email, setEmail] = useState(perfil.email);
  const [telefone, setTelefone] = useState(perfil.telefone);
  const [dataNascimento, setDataNascimento] = useState(perfil.dataNascimento);
  const [fotoUrl, setFotoUrl] = useState(perfil.fotoUrl);
  const [biografia, setBiografia] = useState(perfil.biografia);

  function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFotoUrl(base64);
        try {
          const userKey = (email || loggedEmail).toLowerCase().trim();
          localStorage.setItem(`cufa_perfil_foto_${userKey}`, base64);
          window.dispatchEvent(new Event("cufa_perfil_foto_updated"));
        } catch {}
        toast.success("Foto de perfil atualizada!");
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    const userKey = (email || loggedEmail).toLowerCase().trim();
    const novoPerfil = {
      nome,
      email: userKey,
      telefone,
      dataNascimento,
      fotoUrl,
      biografia,
    };
    setPerfil(novoPerfil);
    try {
      localStorage.setItem(`cufa_responsavel_perfil_${userKey}`, JSON.stringify(novoPerfil));
      localStorage.setItem(`cufa_logged_name_${userKey}`, nome);
      if (fotoUrl) {
        localStorage.setItem(`cufa_perfil_foto_${userKey}`, fotoUrl);
      } else {
        localStorage.removeItem(`cufa_perfil_foto_${userKey}`);
      }
      window.dispatchEvent(new Event("cufa_perfil_updated"));
      window.dispatchEvent(new Event("cufa_perfil_foto_updated"));
    } catch {}

    toast.success("Perfil do Responsável atualizado com sucesso!", {
      description: "Suas informações pessoais foram salvas para este usuário.",
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

            <div className="space-y-1.5 text-left pt-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Upload de Foto de Perfil</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFotoUpload}
                className="cursor-pointer font-medium text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90"
              />
              <span className="text-[11px] text-muted-foreground block">
                Selecione uma foto do seu computador para salvar fixamente no perfil.
              </span>
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
