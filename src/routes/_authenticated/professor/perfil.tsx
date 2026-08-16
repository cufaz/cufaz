import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, FileText, Upload, Save, CheckCircle2, Award, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { ProfessorShell } from "@/components/professor/ProfessorShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/professor/perfil")({
  component: ProfessorPerfilPage,
});

function ProfessorPerfilPage() {
  const [nome, setNome] = useState(() => localStorage.getItem("cufa_professor_nome") || "Prof. Instrutor");
  const [email] = useState(() => localStorage.getItem("cufa_logged_user") || "professor@cufa.com.br");
  const [polo] = useState(() => localStorage.getItem("cufa_polo_atribuido") || "Complexo da Penha");
  const [modalidade] = useState(() => localStorage.getItem("cufa_professor_modalidade") || "Jiu Jitsu");
  const [telefone, setTelefone] = useState(() => {
    const saved = localStorage.getItem("cufa_professor_telefone");
    if (saved) return saved;
    try {
      const stored = localStorage.getItem("cufa_professores_cadastrados");
      if (stored) {
        const list = JSON.parse(stored);
        const logged = (localStorage.getItem("cufa_logged_user") || "").toLowerCase();
        const found = list.find((p: any) => p.email && String(p.email).toLowerCase() === logged);
        if (found && found.telefone) return found.telefone;
      }
    } catch {}
    return "";
  });
  const [biografia, setBiografia] = useState(() => localStorage.getItem("cufa_professor_biografia") || "Instrutor capacitado focado no desenvolvimento social e esportivo dos alunos.");

  // Social networks
  const [instagram, setInstagram] = useState(() => localStorage.getItem("cufa_professor_instagram") || "");
  const [facebook, setFacebook] = useState(() => localStorage.getItem("cufa_professor_facebook") || "");
  const [linkedin, setLinkedin] = useState(() => localStorage.getItem("cufa_professor_linkedin") || "");

  // Photo state
  const [foto, setFoto] = useState<string | null>(() => {
    const pEmail = (localStorage.getItem("cufa_logged_user") || "").toLowerCase();
    const fUser = localStorage.getItem(`cufa_perfil_foto_${pEmail}`);
    if (fUser && !fUser.includes("unsplash.com")) return fUser;
    const fGlobal = localStorage.getItem("cufa_perfil_foto");
    if (fGlobal && !fGlobal.includes("unsplash.com")) return fGlobal;
    return null;
  });
  const [fotoNome, setFotoNome] = useState<string | null>(() => localStorage.getItem("cufa_perfil_foto_name"));

  function handleFotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFotoNome(file.name);
      localStorage.setItem("cufa_perfil_foto_name", file.name);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const res = evt.target?.result as string;
        setFoto(res);
        localStorage.setItem("cufa_perfil_foto", res);
        if (email) {
          localStorage.setItem(`cufa_perfil_foto_${email.toLowerCase()}`, res);
        }
        window.dispatchEvent(new Event("cufa_perfil_foto_updated"));
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    localStorage.setItem("cufa_professor_nome", nome);
    localStorage.setItem("cufa_professor_telefone", telefone);
    localStorage.setItem("cufa_professor_biografia", biografia);
    localStorage.setItem("cufa_professor_instagram", instagram);
    localStorage.setItem("cufa_professor_facebook", facebook);
    localStorage.setItem("cufa_professor_linkedin", linkedin);
    toast.success("Perfil do professor atualizado com sucesso!");
  }

  return (
    <ProfessorShell
      title="Meu Perfil de Professor"
      description="Edite suas informações pessoais, redes sociais e visualize os documentos anexados."
    >
      <form onSubmit={handleSalvarPerfil} className="space-y-6 max-w-4xl">
        {/* Foto de Perfil & Dados Pessoais */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="size-4 text-primary" />
              <span>Informações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 border-2 border-primary/30 shadow-md">
                {foto && <AvatarImage src={foto} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                  {nome.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Foto de Perfil
                </Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="foto-upload"
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs cursor-pointer shadow-xs transition-all"
                  >
                    <Upload className="size-3.5" />
                    <span>Upload da Foto</span>
                    <input
                      id="foto-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFotoSelect}
                    />
                  </label>
                  <span className="text-xs text-muted-foreground font-medium">
                    {fotoNome ? fotoNome : "Nenhuma foto selecionada"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome Completo</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} className="text-xs font-semibold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Telefone / WhatsApp</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} className="text-xs font-semibold" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">E-mail de Login</Label>
                <Input value={email} disabled className="text-xs bg-muted/30 font-semibold" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Biografia / Resumo Profissional</Label>
              <Textarea
                rows={3}
                value={biografia}
                onChange={(e) => setBiografia(e.target.value)}
                className="text-xs leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>

        {/* Redes Sociais do Professor */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="size-4 text-primary" />
              <span>Redes Sociais & Links Profissionais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Instagram</Label>
                <Input
                  placeholder="@seu.perfil ou link"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Facebook</Label>
                <Input
                  placeholder="https://facebook.com/seu.perfil"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">LinkedIn</Label>
                <Input
                  placeholder="https://linkedin.com/in/seu.perfil"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentos & Certificados Anexados (Anexo 3) */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileCheck className="size-4 text-emerald-500" />
              <span>Documentação & Certificados Anexados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="size-4 text-primary shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">RG / CPF</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Anexado no cadastro</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" type="button" className="text-xs h-7">Substituir</Button>
              </div>

              <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="size-4 text-primary shrink-0" />
                  <div>
                    <span className="font-bold text-xs text-foreground block">Comprovante de Residência</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Anexado no cadastro</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" type="button" className="text-xs h-7">Substituir</Button>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-primary shrink-0" />
                <div>
                  <span className="font-bold text-xs text-foreground block">Comprovante Funcional / Carteira Profissional</span>
                  <span className="text-[10px] text-muted-foreground">Opcional</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" type="button" className="text-xs h-7">Enviar Documento</Button>
            </div>

            {/* Certificados e Graduação (Até 4 arquivos) */}
            <div className="pt-3 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-foreground tracking-wider flex items-center gap-1.5">
                  <Award className="size-4 text-amber-500" /> Certificados de Graduação (Até 4 arquivos)
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {["Certificado_Graduacao_JiuJitsu.pdf", "Certificado_Primeiros_Socorros.pdf", "Certificado_3.pdf", "Certificado_4.pdf"].map((cert, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate">{idx + 1}. {cert}</span>
                    <Button variant="ghost" size="sm" type="button" className="text-[10px] h-6 px-2 text-primary">Upload</Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="bg-brand-gradient font-bold shadow-brand">
          <Save className="size-4 mr-2" /> Salvar Perfil
        </Button>
      </form>
    </ProfessorShell>
  );
}
