import { supabase } from "@/integrations/supabase/client";

export interface CentroCustoDB {
  id: string;
  nome: string;
  codigo: string;
  setor?: string | null;
  responsavel?: string | null;
  descricao?: string | null;
  orcamento_mensal: number;
  ativo?: boolean;
  created_at?: string;
}

export async function fetchCentrosCustoDB(): Promise<CentroCustoDB[]> {
  try {
    const { data, error } = await supabase
      .from("centros_custo" as any)
      .select("*")
      .order("codigo", { ascending: true });

    if (!error && data && data.length > 0) {
      return (data || []) as unknown as CentroCustoDB[];
    }
  } catch {}

  return loadLocalCentrosCusto();
}

export async function saveCentroCustoDB(cc: Partial<CentroCustoDB>): Promise<CentroCustoDB | null> {
  const payload = {
    nome: cc.nome || "",
    codigo: cc.codigo || `CC-${Math.floor(100 + Math.random() * 900)}`,
    setor: cc.setor || "Geral",
    responsavel: cc.responsavel || "Gestor de Polo",
    descricao: cc.descricao || "",
    orcamento_mensal: Number(cc.orcamento_mensal || 0),
    ativo: cc.ativo ?? true,
  };

  try {
    if (cc.id) {
      const { data, error } = await supabase
        .from("centros_custo" as any)
        .update(payload as any)
        .eq("id", cc.id)
        .select("*")
        .single();
      if (!error && data) {
        window.dispatchEvent(new Event("cufa_centros_custo_updated"));
        return data as unknown as CentroCustoDB;
      }
    } else {
      const { data, error } = await supabase
        .from("centros_custo" as any)
        .insert(payload as any)
        .select("*")
        .single();
      if (!error && data) {
        window.dispatchEvent(new Event("cufa_centros_custo_updated"));
        return data as unknown as CentroCustoDB;
      }
    }
  } catch {}

  saveLocalCentroCusto(payload, cc.id);
  window.dispatchEvent(new Event("cufa_centros_custo_updated"));
  return { ...payload, id: cc.id || `cc-${Date.now()}` } as CentroCustoDB;
}

export async function deleteCentroCustoDB(id: string): Promise<boolean> {
  try {
    await supabase.from("centros_custo" as any).delete().eq("id", id);
  } catch {}

  deleteLocalCentroCusto(id);
  window.dispatchEvent(new Event("cufa_centros_custo_updated"));
  return true;
}

// Local Storage Fallback Helpers
function loadLocalCentrosCusto(): CentroCustoDB[] {
  try {
    const stored = localStorage.getItem("cufa_centros_custo");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function getDefaultInitialCentrosCusto(): CentroCustoDB[] {
  return [];
}

function saveLocalCentroCusto(payload: any, id?: string) {
  try {
    let list = loadLocalCentrosCusto();
    if (id) {
      const idx = list.findIndex((c) => c.id === id);
      if (idx !== -1 && list[idx]) list[idx] = { ...list[idx], ...payload };
    } else {
      list.push({ ...payload, id: `cc-${Date.now()}` });
    }
    localStorage.setItem("cufa_centros_custo", JSON.stringify(list));
  } catch {}
}

function deleteLocalCentroCusto(id: string) {
  try {
    let list = loadLocalCentrosCusto();
    list = list.filter((c) => c.id !== id);
    localStorage.setItem("cufa_centros_custo", JSON.stringify(list));
  } catch {}
}
