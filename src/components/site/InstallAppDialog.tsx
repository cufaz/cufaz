import { useState, useEffect } from "react";
import { Download, Smartphone, Share, PlusSquare, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import logo from "@/assets/cufa-z-logo.png";

export function InstallAppDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iPhone|iPad|iPod/.test(ua) && !(window as any).MSStream;
    setIsIos(iosDevice);

    // Listen for PWA beforeinstallprompt on Android/Chrome
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function handleInstallAndroid() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("Aplicativo CUFA instalado com sucesso!");
      }
      setDeferredPrompt(null);
    } else {
      toast.info("Para instalar no Android/Chrome", {
        description: "Abra as opções do seu navegador (⋮) e selecione 'Instalar aplicativo' ou 'Adicionar à tela de início'.",
      });
    }
    closeDialog();
  }

  function closeDialog() {
    if (dontShowAgain) {
      localStorage.setItem("cufa_hide_install_prompt", "true");
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={closeDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 p-1">
              <img src={logo} alt="CUFA" className="h-8 w-auto object-contain" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Instalar App CUFA</DialogTitle>
              <DialogDescription>
                Acesse a plataforma mais rápido instalando direto no seu celular.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {isIos ? (
            /* iOS Installation Guide */
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm space-y-2.5">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <Smartphone className="size-4 text-primary" /> Instruções para iPhone / iPad (Safari):
              </p>
              <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1.5 leading-relaxed font-medium">
                <li className="flex items-center gap-2">
                  <Share className="size-4 text-primary shrink-0" />
                  <span>1. Toque no botão <strong>Compartilhar</strong> no menu do navegador.</span>
                </li>
                <li className="flex items-center gap-2">
                  <PlusSquare className="size-4 text-primary shrink-0" />
                  <span>2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</span>
                </li>
                <li>3. Toque em <strong>Adicionar</strong> no canto superior direito.</li>
              </ol>
            </div>
          ) : (
            /* Android / Chrome One-Click Install */
            <div className="rounded-xl border border-border bg-card p-4 text-center space-y-3">
              <p className="text-xs text-muted-foreground font-medium">
                Clique no botão abaixo para adicionar a CUFA diretamente à tela inicial do seu dispositivo.
              </p>
              <Button
                onClick={handleInstallAndroid}
                className="w-full h-11 bg-brand-gradient font-bold text-white shadow-brand text-base"
              >
                <Download className="size-4 mr-2" /> Instalar aplicativo agora
              </Button>
            </div>
          )}

          {/* Checkbox: Não mostrar esta mensagem novamente */}
          <div className="flex items-center space-x-2 pt-2 border-t border-border/60">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(v) => setDontShowAgain(Boolean(v))}
            />
            <Label htmlFor="dont-show" className="text-xs text-muted-foreground font-medium cursor-pointer">
              Não mostrar esta mensagem novamente
            </Label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
