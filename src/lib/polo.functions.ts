import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  fetchPoloAtividadesServer,
  fetchPoloAlunosServer,
  fetchPoloDashboardServer,
  registrarChamadaServer,
} from "./polo.server";
import { supabase } from "@/integrations/supabase/client";

export const getPoloAtividades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { poloId: string }) => d)
  .handler(async ({ data }: { data: { poloId: string } }) => {
    return await fetchPoloAtividadesServer(data.poloId);
  });

export const getPoloAlunos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { poloId: string }) => d)
  .handler(async ({ data }: { data: { poloId: string } }) => {
    return await fetchPoloAlunosServer(data.poloId);
  });

export const getPoloDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { poloId: string }) => d)
  .handler(async ({ data }: { data: { poloId: string } }) => {
    return await fetchPoloDashboardServer(data.poloId);
  });

export const getSolicitacoesProfessor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: { poloId: string }) => d)
  .handler(async ({ data }: { data: { poloId: string } }) => {
    try {
      const { data: solis, error } = await supabase
        .from("solicitacoes_professor" as any)
        .select("*, atividades(nome), turmas(nome), polos(nome)")
        .eq("polo_id", data.poloId)
        .order("created_at", { ascending: false });

      if (error || !solis) return [];
      return solis as any[];
    } catch {
      return [];
    }
  });

export const decidirSolicitacaoProfessor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: { id: string; decisao: "aprovada" | "recusada" }) => d)
  .handler(async ({ data }: { data: { id: string; decisao: "aprovada" | "recusada" } }) => {
    try {
      const { data: sol, error: fetchErr } = await (supabase
        .from("solicitacoes_professor" as any)
        .select("*")
        .eq("id", data.id)
        .single() as any);

      if (fetchErr || !sol) return { success: false, error: "Solicitação não encontrada" };

      // Update status
      await supabase
        .from("solicitacoes_professor" as any)
        .update({
          status: data.decisao,
          decidido_em: new Date().toISOString(),
        } as any)
        .eq("id", data.id);

      // If approved, update atividades.professor_id
      if (data.decisao === "aprovada" && (sol as any).professor_id && (sol as any).atividade_id) {
        await supabase
          .from("atividades")
          .update({ professor_id: (sol as any).professor_id } as any)
          .eq("id", (sol as any).atividade_id);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  });

export const registrarChamada = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: {
    turmaId: string;
    atividadeId: string;
    poloId: string;
    professorId?: string;
    data: string;
    itens: Array<{ matriculaId: string; alunoNome: string; presente: boolean }>;
  }) => d)
  .handler(async ({ data }: { data: any }) => {
    const success = await registrarChamadaServer(data);
    return { success };
  });
