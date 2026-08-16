import { useState, useEffect } from "react";
import { Menu, X, ShieldCheck, Download, LogIn } from "lucide-react";

import logo from "@/assets/cufa-z-logo.png";
import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";

import { LoginDialog } from "./LoginDialog";
import { SignupDialog } from "./SignupDialog";
import { InstallAppDialog } from "./InstallAppDialog";
import { MasterAdminDialog } from "./MasterAdminDialog";

const links = [
  { href: "#institucional", label: "Institucional" },
  { href: "#projetos", label: "Projetos" },
  { href: "#comunidades", label: "Comunidades" },
  { href: "#contato", label: "Contato" },
  { href: "#adm", label: "Adm", isAdm: true },
];

export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const [login, setLogin] = useState(false);
  const [signup, setSignup] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [masterAdminOpen, setMasterAdminOpen] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault();
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (clickTimer) clearTimeout(clickTimer);

    if (newCount >= 3) {
      setClickCount(0);
      setMasterAdminOpen(true);
      return;
    }

    const timer = setTimeout(() => {
      setClickCount(0);
    }, 1200);
    setClickTimer(timer);
  }

  useEffect(() => {
    const hidden = localStorage.getItem("cufa_hide_install_prompt");
    if (!hidden) {
      const timer = setTimeout(() => setInstallOpen(true), 1500);
      return () => {
        clearTimeout(timer);
      };
    }
    return undefined;
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:py-4">
        <a href="#topo" onClick={handleLogoClick} className="flex items-center gap-3 group cursor-pointer" title="Clique 3x para Acesso Master Admin">
          <img
            src={logo}
            alt="CUFA"
            className="h-12 sm:h-16 md:h-18 w-auto shrink-0 object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="sr-only">CUFA</span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) =>
            l.isAdm ? (
              <button
                key={l.href}
                type="button"
                onClick={() => navigate({ to: "/auth" })}
                className="inline-flex items-center gap-1 text-sm font-bold text-primary transition-colors hover:text-primary/80 bg-primary/10 px-3 py-1 rounded-full border border-primary/20"
              >
                <ShieldCheck className="size-3.5" />
                {l.label}
              </button>
            ) : (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {l.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {/* Instalar App PWA Button (Anexo 3) */}
          <Button
            variant="outline"
            size="sm"
            className="hidden font-bold border-primary/30 text-primary hover:bg-primary/10 sm:inline-flex"
            onClick={() => setInstallOpen(true)}
          >
            <Download className="size-3.5 mr-1" /> Instalar App
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden font-semibold sm:inline-flex"
            onClick={() => setLogin(true)}
          >
            Entrar
          </Button>
          <Button
            size="sm"
            className="bg-brand-gradient font-semibold shadow-brand"
            onClick={() => setSignup(true)}
          >
            Cadastre-se
          </Button>
          <button
            type="button"
            aria-label="Abrir menu"
            className="grid size-9 place-items-center rounded-lg border border-border lg:hidden"
            onClick={() => setMenu((v) => !v)}
          >
            {menu ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {menu && (
        <nav className="border-t border-border/60 px-4 py-3 lg:hidden">
          <ul className="grid gap-1">
            <li>
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setLogin(true);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-extrabold text-primary-foreground bg-brand-gradient shadow-brand mb-2"
              >
                <LogIn className="size-4" /> Entrar
              </button>
            </li>
            {links.map((l) => (
              <li key={l.href}>
                {l.isAdm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      navigate({ to: "/auth" });
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-primary bg-primary/10"
                  >
                    <ShieldCheck className="size-4" />
                    {l.label} — Painel do Gestor
                  </button>
                ) : (
                  <a
                    href={l.href}
                    onClick={() => setMenu(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    {l.label}
                  </a>
                )}
              </li>
            ))}
            <li className="pt-2 border-t border-border/40">
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setInstallOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-primary"
              >
                <Download className="size-4" /> Instalar App no Celular
              </button>
            </li>
          </ul>
        </nav>
      )}

      <LoginDialog open={login} onOpenChange={setLogin} />
      <SignupDialog open={signup} onOpenChange={setSignup} />
      <InstallAppDialog open={installOpen} onOpenChange={setInstallOpen} />
      <MasterAdminDialog open={masterAdminOpen} onOpenChange={setMasterAdminOpen} />
    </header>
  );
}
