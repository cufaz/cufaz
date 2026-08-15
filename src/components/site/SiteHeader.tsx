import { useState } from "react";
import { Menu, X, ShieldCheck } from "lucide-react";

import logo from "@/assets/cufa-z-logo.png";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "./LoginDialog";
import { SignupDialog } from "./SignupDialog";
import { AdminDialog } from "./AdminDialog";

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
  const [admin, setAdmin] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:py-4">
        <a href="#topo" className="flex items-center gap-3 group">
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
                onClick={() => setAdmin(true)}
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
            {links.map((l) => (
              <li key={l.href}>
                {l.isAdm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      setAdmin(true);
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
            <li className="sm:hidden border-t border-border/40 pt-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setMenu(false);
                  setLogin(true);
                }}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary"
              >
                Entrar
              </button>
            </li>
          </ul>
        </nav>
      )}

      <LoginDialog open={login} onOpenChange={setLogin} />
      <SignupDialog open={signup} onOpenChange={setSignup} />
      <AdminDialog open={admin} onOpenChange={setAdmin} />
    </header>
  );
}
