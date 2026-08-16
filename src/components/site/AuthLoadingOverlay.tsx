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

    setProgress(15);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(interval);
          if (onComplete) setTimeout(onComplete, 80);
          return 100;
        }
        const diff = Math.floor(Math.random() * 20) + 15;
        return Math.min(prev + diff, 98);
      });
    }, 30);

    return () => clearInterval(interval);
  }, [open, onComplete]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background transition-all duration-200">
      <div className="flex flex-col items-center space-y-6 text-center max-w-sm px-6 w-full animate-in fade-in-50 zoom-in-95">
        {/* Animated Glowing Logo */}
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

        {/* 0% to 100% Progress Bar Container */}
        <div className="w-full space-y-2 pt-2">
          <div className="h-3 w-full rounded-full bg-muted/80 p-0.5 border border-border shadow-inner overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-gradient shadow-brand transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-extrabold text-primary px-1">
            <span className="uppercase tracking-wider">Carregando Ecossistema</span>
            <span className="tabular-nums text-sm font-black">{progress}%</span>
          </div>
        </div>

        {/* Spinner transition after 100% to prevent blank white screen flash */}
        {progress >= 98 && (
          <div className="flex items-center gap-2 text-xs font-extrabold text-primary animate-pulse pt-1">
            <Loader2 className="size-4 animate-spin" />
            <span>Redirecionando com segurança...</span>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
