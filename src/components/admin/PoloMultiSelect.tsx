import { useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface PoloOption {
  id: string;
  nome: string;
}

export function PoloMultiSelect({
  polos,
  selectedIds,
  onChange,
  placeholder = "Filtrar por polo",
}: {
  polos: PoloOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredPolos = polos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected = polos.length > 0 && selectedIds.length === polos.length;

  function toggleAll() {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(polos.map((p) => p.id));
    }
  }

  function togglePolo(id: string) {
    if (selectedIds.includes(id)) {
      const updated = selectedIds.filter((item) => item !== id);
      onChange(updated);
    } else {
      onChange([...selectedIds, id]);
    }
  }

  function selectSinglePolo(id: string) {
    if (id === "") {
      onChange([]);
    } else {
      onChange([id]);
    }
  }

  function getDisplayText() {
    if (selectedIds.length === 0 || selectedIds.length === polos.length) {
      return "Todos os polos";
    }
    if (selectedIds.length === 1) {
      const found = polos.find((p) => p.id === selectedIds[0]);
      return found ? found.nome : "1 polo selecionado";
    }
    const first = polos.find((p) => p.id === selectedIds[0])?.nome;
    return `${first} (+${selectedIds.length - 1})`;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-10 w-full justify-between font-medium text-xs sm:text-sm bg-background border-input"
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        {/* Campo Buscador */}
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar polo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs font-medium"
          />
        </div>

        {/* Selecionar Todos Checkbox */}
        <div className="flex items-center space-x-2 px-2 py-1.5 border-b border-border/60">
          <Checkbox
            id="select-all-polos"
            checked={allSelected}
            onCheckedChange={toggleAll}
          />
          <label
            htmlFor="select-all-polos"
            className="text-xs font-bold text-foreground cursor-pointer select-none"
          >
            Todos os Polos ({polos.length})
          </label>
        </div>

        {/* Lista de Polos com Checkbox */}
        <div className="mt-1 max-h-48 overflow-y-auto space-y-1">
          {filteredPolos.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2 text-center">
              Nenhum polo encontrado.
            </p>
          ) : (
            filteredPolos.map((p) => {
              const isChecked = selectedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePolo(p.id);
                  }}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-muted/50 cursor-pointer select-none transition-colors"
                >
                  <Checkbox
                    id={`polo-${p.id}`}
                    checked={isChecked}
                    onCheckedChange={() => togglePolo(p.id)}
                  />
                  <span className="text-xs font-medium text-foreground truncate flex-1">
                    {p.nome}
                  </span>
                  {isChecked && <Check className="size-3.5 text-primary shrink-0" />}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-2 pt-2 border-t border-border flex justify-end">
          <Button
            size="sm"
            type="button"
            className="w-full h-8 text-xs font-bold bg-brand-gradient text-white shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            Aplicar ({selectedIds.length === 0 || selectedIds.length === polos.length ? "Todos" : selectedIds.length})
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
