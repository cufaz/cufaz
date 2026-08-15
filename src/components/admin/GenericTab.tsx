import { useState } from "react";
import { Loader2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GenericTab({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: { id: string; nome: string; info: string; tag: string }[];
}) {
  const [search, setSearch] = useState("");
  const [isFiltering, setIsFiltering] = useState(false);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setIsFiltering(true);
    setSearch(val);
    setTimeout(() => {
      setIsFiltering(false);
    }, 300);
  }

  const filtered = items.filter(
    (i) =>
      i.nome.toLowerCase().includes(search.toLowerCase()) ||
      i.info.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative space-y-6">
      {isFiltering && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center z-50 rounded-2xl min-h-[300px]">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="mt-2 text-xs font-bold text-foreground">Filtrando...</p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Button className="bg-brand-gradient text-white font-bold shadow-brand">
          <Plus className="size-4 mr-1.5" /> Adicionar {title.slice(0, -1)}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          placeholder={`Buscar em ${title}...`}
          value={search}
          onChange={handleSearchChange}
          className="pl-9 h-10 font-medium"
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
        <div className="divide-y divide-border/60">
          {filtered.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{item.tag}</span>
                <h4 className="font-bold text-base text-foreground mt-0.5">{item.nome}</h4>
                <p className="text-xs text-muted-foreground">{item.info}</p>
              </div>
              <Button size="sm" variant="outline" className="font-semibold text-xs">
                Gerenciar
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
