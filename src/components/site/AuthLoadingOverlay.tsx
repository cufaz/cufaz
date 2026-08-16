import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import logo from "@/assets/cufa-z-logo.png";

export function AuthLoadingOverlay({
  open,
  message = "Autenticando e preparando o seu painel CUFA...",
  onComplete,
}: {
  open: boolean;
  message?: string;
  onComplete?: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      return;
    }

    // 5 Seconds Total Animation Time
    const totalMs = 5000;
    const intervalMs = 50;
    const step = 100 / (totalMs / intervalMs); // 1% per 50ms

    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) {
          clearInterval(interval);
          if (onComplete) setTimeout(onComplete, 200);
          return 100;
        }
        return Math.min(prev + step, 99);
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [open, onComplete]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background transition-all duration-300">
      {progress < 100 ? (
        <div className="flex flex-col items-center space-y-6 text-center max-w-sm px-6 w-full animate-in fade-in-50 zoom-in-95">
          {/* Animated Glowing Logo (Foto 1) */}
          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-brand-gradient opacity-30 blur-2xl animate-pulse" />
            <img
              src={logo}
              alt="CUFA Logo"
              className="relative h-20 w-auto object-contain drop-shadow-lg animate-bounce"
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground tracking-tight uppercase">
              Central Única das Favelas
            </h3>
            <p className="text-xs font-bold text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>

          {/* 0% to 100% Progress Bar Container (8 Segundos) */}
          <div className="w-full space-y-2 pt-2">
            <div className="h-3 w-full rounded-full bg-muted/80 p-0.5 border border-border shadow-inner overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-gradient shadow-brand transition-all duration-75 ease-out"
                style={{ width: `${Math.round(progress)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-extrabold text-primary px-1">
              <span className="uppercase tracking-wider">Carregando Ecossistema</span>
              <span className="tabular-nums text-sm font-black">{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      ) : (
        /* Foto 2: Spinner circular no centro da tela após fim da animação até a tela carregar */
        <div className="flex flex-col items-center justify-center space-y-5 animate-in fade-in-50">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <Loader2 className="size-16 animate-spin text-primary relative" />
          </div>
          <p className="text-xs font-black uppercase text-primary tracking-widest animate-pulse">
            Carregando Tela de Acesso...
          </p>
        </div>
      )}
    </div>,
    document.body,
  );
}
