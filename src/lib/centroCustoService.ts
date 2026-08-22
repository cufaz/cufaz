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
  const { data, error } = await supabase
    .from("centros_custo" as any)
    .select("*")
    .order("codigo", { ascending: true });
  if (error) throw new Error(`Não foi possível carregar os centros de custo: ${error.message}`);
  return (data || []) as unknown as CentroCustoDB[];
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

  const query = cc.id
    ? supabase.from("centros_custo" as any).update(payload as any).eq("id", cc.id)
    : supabase.from("centros_custo" as any).insert(payload as any);
  const { data, error } = await query.select("*").single();
  if (error || !data) throw new Error(error?.message || "Não foi possível salvar o centro de custo.");
  window.dispatchEvent(new Event("cufa_centros_custo_updated"));
  return data as unknown as CentroCustoDB;
}

export async function deleteCentroCustoDB(id: string): Promise<boolean> {
  const { error } = await supabase.from("centros_custo" as any).delete().eq("id", id);
  if (error) throw new Error(`Não foi possível excluir o centro de custo: ${error.message}`);
  window.dispatchEvent(new Event("cufa_centros_custo_updated"));
  return true;
}
