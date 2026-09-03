import { supabase } from "@/integrations/supabase/client";

export interface PedidoDB {
  id: string;
  polo_id: string;
  polo_nome?: string;
  solicitante_nome: string;
  item: string;
  categoria?: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  status: "pendente" | "aprovado" | "reprovado" | "recusado";
  competencia: string;
  descricao?: string | null;
  observacao?: string | null;
  justificativa?: string | null;
  dataSolicitacao?: string | null;
  created_at?: string;
  decidido_em?: string | null;
  decidido_por?: string | null;
  observacao_gestor?: string | null;
  centro_custo_id?: string | null;
}

export async function autoMigrateLocalPedidos() {
  try {
    const keys = ["cufa_compras_polo", "cufa_compras_all"];
    let migratedCount = 0;
    for (const key of keys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list) && list.length > 0) {
          for (const item of list) {
            const poloName = item.polo_nome || item.polo || "Complexo da Penha";
            const poloIdCode = poloName.toLowerCase().includes("madureira")
              ? "madureira"
              : poloName.toLowerCase().includes("paraisopolis") || poloName.toLowerCase().includes("paraisópolis")
              ? "paraisopolis"
              : "penha";

            const valTotal = Number(item.valor_total || item.valor || 0);
            const valUnit = Number(item.valor_unitario || valTotal);
            const qty = Number(item.quantidade || 1);

            await supabase.from("pedidos_compra").insert({
              polo_id: poloIdCode,
              solicitante_nome: item.solicitante_nome || item.responsavelNome || "Responsável do Polo",
              item: item.item || item.nome || "Pedido de Compra",
              quantidade: qty,
              valor_unitario: valUnit,
              valor_total: valTotal,
              status: item.status || "pendente",
              competencia: item.competencia || "2026-08-01",
              descricao: item.observacao || item.descricao || "",
            } as any);
            migratedCount++;
          }
          localStorage.removeItem(key);
        }
      }
    }
    if (migratedCount > 0) {
      window.dispatchEvent(new Event("cufa_pedidos_updated"));
    }
  } catch {}
}

export async function fetchPedidosDB(): Promise<PedidoDB[]> {
  await autoMigrateLocalPedidos();
  const { data, error } = await supabase
    .from("pedidos_compra")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as PedidoDB[];
}

export async function createPedidoDB(pedido: Omit<PedidoDB, "id" | "created_at">) {
  const { data, error } = await supabase
    .from("pedidos_compra")
    .insert(pedido as any)
    .select()
    .single();

  if (error) throw error;
  window.dispatchEvent(new Event("cufa_pedidos_updated"));
  return data;
}

export async function updatePedidoDB(id: string, updates: Partial<PedidoDB>) {
  const { data, error } = await supabase
    .from("pedidos_compra")
    .update(updates as any)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  window.dispatchEvent(new Event("cufa_pedidos_updated"));
  return data;
}

export async function updatePedidoStatusDB(
  id: string,
  status: "aprovado" | "reprovado",
  observacaoGestor?: string,
  updates: Partial<Pick<PedidoDB, "polo_id" | "centro_custo_id" | "valor_total">> = {},
) {
  const { data, error } = await supabase
    .from("pedidos_compra")
    .update({
      status,
      observacao_gestor: observacaoGestor || null,
      decidido_em: new Date().toISOString(),
      ...updates,
    } as any)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) throw error;

  // When approved, insert realized expense record into lancamentos_financeiros table
  if (status === "aprovado" && data) {
    const p = data as any;
    await supabase.from("lancamentos_financeiros").insert({
      polo_id: p.polo_id,
      tipo: "despesa",
      natureza: "realizado",
      descricao: `[Compra Aprovada] ${p.item}`,
      valor: p.valor_total,
      competencia: p.competencia || "2026-08-01",
      pedido_id: id,
      centro_custo_id: p.centro_custo_id,
    } as any);
  }

  window.dispatchEvent(new Event("cufa_pedidos_updated"));
  return data;
}

export async function deletePedidoDB(id: string) {
  await supabase.from("lancamentos_financeiros").delete().eq("pedido_id", id);
  const { error } = await supabase.from("pedidos_compra").delete().eq("id", id);
  if (error) throw error;
  window.dispatchEvent(new Event("cufa_pedidos_updated"));
}
