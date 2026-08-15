import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logo from "@/assets/cufa-z-logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso à plataforma — CUFAZ" },
      {
        name: "description",
        content:
          "Entre na plataforma CUFAZ para acessar o painel do gestor, dos polos e das atividades sociais.",
      },
      { property: "og:title", content: "Acesso à plataforma — CUFAZ" },
      {
        property: "og:description",
        content: "Área de acesso da plataforma CUFAZ: gestor, polos, professores e alunos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/gestor", replace: true });
    });
  }, [navigate]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
      return;
    }
    toast.success("Acesso autorizado");
    navigate({ to: "/gestor", replace: true });
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { emailRedirectTo: window.location.origin, data: { nome } },
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    toast.success("Conta criada", { description: "Agora é só entrar com e-mail e senha." });
  }

  return (
    <main className="min-h-dvh bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Link to="/" className="mx-auto mb-6 flex justify-center">
          <img src={logo} alt="CUFAZ" className="h-16 w-auto object-contain" />
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-brand">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold">Acesso à plataforma</h1>
              <p className="text-xs text-muted-foreground">Gestor, polos, professores e alunos.</p>
            </div>
          </div>

          <Tabs defaultValue="entrar">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="entrar">Entrar</TabsTrigger>
              <TabsTrigger value="criar">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form className="grid gap-4 pt-4" onSubmit={entrar}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha">Senha</Label>
                  <Input id="senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} className="h-11" />
                </div>
                <Button type="submit" disabled={loading} className="h-11 bg-brand-gradient font-bold text-white shadow-brand">
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form className="grid gap-4 pt-4" onSubmit={criar}>
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input id="nome" required value={nome} onChange={(e) => setNome(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha2">Senha</Label>
                  <Input id="senha2" type="password" required minLength={8} value={senha} onChange={(e) => setSenha(e.target.value)} className="h-11" />
                </div>
                <Button type="submit" disabled={loading} variant="secondary" className="h-11 font-bold">
                  {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null} Criar conta
                </Button>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  A conta criada com o e-mail oficial do gestor recebe automaticamente o acesso ao painel
                  administrativo.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}
