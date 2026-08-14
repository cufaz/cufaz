import { useState } from "react";
import { Menu, X } from "lucide-react";

import logo from "@/assets/cufaz-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { LoginDialog } from "./LoginDialog";
import { SignupDialog } from "./SignupDialog";

const links = [
  { href: "#institucional", label: "Institucional" },
  { href: "#projetos", label: "Projetos" },
  { href: "#comunidades", label: "Comunidades" },
  { href: "#contato", label: "Contato" },
];

export function SiteHeader() {
  const [menu, setMenu] = useState(false);
  const [login, setLogin] = useState(false);
  const [signup, setSignup] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
        <a href="#topo" className="flex min-w-0 items-center gap-2">
          <img src={logo.url} alt="CUFAZ" className="h-9 w-auto shrink-0 sm:h-11" />
          <span className="sr-only">CUFAZ</span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
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
                <a
                  href={l.href}
                  onClick={() => setMenu(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="sm:hidden">
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
    </header>
  );
}
