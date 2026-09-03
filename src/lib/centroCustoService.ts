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
  realizado?: number;
}

export async function fetchCentrosCustoDB(): Promise<CentroCustoDB[]> {
  const { data, error } = await supabase
    .from("centros_custo" as any)
    .select("*")
    .order("codigo", { ascending: true });
  if (error) throw new Error(`Não foi possível carregar os centros de custo: ${error.message}`);
  const centros = (data || []) as unknown as CentroCustoDB[];
  if (centros.length === 0) return [];

  const { data: lancamentos, error: lancamentosError } = await supabase
    .from("lancamentos_financeiros")
    .select("centro_custo_id, valor, tipo, natureza")
    .in("centro_custo_id", centros.map((centro) => centro.id));
  if (lancamentosError) throw new Error(`Não foi possível calcular o consumo dos centros de custo: ${lancamentosError.message}`);

  const realizados = new Map<string, number>();
  for (const lancamento of lancamentos || []) {
    if (lancamento.centro_custo_id && lancamento.tipo === "despesa" && lancamento.natureza === "realizado") {
      realizados.set(
        lancamento.centro_custo_id,
        (realizados.get(lancamento.centro_custo_id) || 0) + Number(lancamento.valor || 0),
      );
    }
  }
  return centros.map((centro) => ({ ...centro, realizado: realizados.get(centro.id) || 0 }));
}

export async function saveCentroCustoDB(cc: Partial<CentroCustoDB>): Promise<CentroCustoDB | null> {
  const payload = {
    nome: cc.nome || "",
    codigo: cc.codigo || "",
    setor: cc.setor || null,
    responsavel: cc.responsavel || null,
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
