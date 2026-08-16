import { Loader2 } from "lucide-react";
import logo from "@/assets/cufa-z-logo.png";

export function AuthLoadingOverlay({
  open,
  message = "Autenticando e preparando o seu painel CUFA...",
}: {
  open: boolean;
  message?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center space-y-6 text-center max-w-sm px-6">
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-brand-gradient opacity-20 blur-xl animate-pulse" />
          <img
            src={logo}
            alt="CUFA Logo"
            className="relative h-20 w-auto object-contain drop-shadow-md animate-bounce"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground tracking-tight">
            Central Única das Favelas
          </h3>
          <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-2 text-primary">
          <Loader2 className="size-6 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Aguarde...</span>
        </div>
      </div>
    </div>
  );
}
