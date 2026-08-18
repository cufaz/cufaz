import { supabase } from "@/integrations/supabase/client";

export interface PoloAtividadeItem {
  atividadeId: string;
  nome: string;
  ativo: boolean;
  professorNome: string | null;
  vagasTotais: number;
  matriculasAtivas: number;
  turmas: Array<{
    id: string;
    nome: string;
    turno: string | null;
    horario: string | null;
    vagas: number;
    matriculasAtivas: number;
  }>;
}

export interface PoloAlunoItem {
  matriculaId: string;
  alunoId: string | null;
  nome: string;
  email: string | null;
  telefone: string | null;
  responsavel: string | null;
  escola: string | null;
  turmaId: string | null;
  turmaNome: string | null;
  atividadeNome: string | null;
  poloNome: string | null;
  status: string;
  dataMatricula: string | null;
}

export interface PoloDashboardData {
  totalAlunos: number;
  vagasTotais: number;
  totalAtividades: number;
  totalTurmas: number;
  pedidosPendentes: number;
  taxaFrequencia: number | null;
  porAtividade: Array<{
    nome: string;
    turmas: number;
    alunos: number;
    vagas: number;
    percentPreenchidas: number;
    presencaPercent: number | null;
  }>;
}

export async function fetchPoloAtividadesServer(poloId: string): Promise<PoloAtividadeItem[]> {
  try {
    // 1. Fetch activities for this polo
    const { data: ativs, error: ativErr } = await supabase
      .from("atividades")
      .select("id, nome, ativo, vagas, polo_id, professor_id, profiles(nome)")
      .eq("polo_id", poloId);

    if (ativErr || !ativs) return [];

    const ativIds = ativs.map((a: any) => a.id);
    if (ativIds.length === 0) return [];

    // 2. Fetch turmas for these activities
    const { data: turmas } = await supabase
      .from("turmas")
      .select("id, nome, turno, horario, vagas, atividade_id")
      .in("atividade_id", ativIds);

    const turmaList = turmas || [];
    const turmaIds = turmaList.map((t: any) => t.id);

    // 3. Count active matriculas per turma
    const turmaCountMap: Record<string, number> = {};
    if (turmaIds.length > 0) {
      const { data: mats } = await supabase
        .from("matriculas")
        .select("turma_id, status")
        .in("turma_id", turmaIds)
        .eq("status", "ativa");

      (mats || []).forEach((m: any) => {
        if (m.turma_id) {
          turmaCountMap[m.turma_id] = (turmaCountMap[m.turma_id] || 0) + 1;
        }
      });
    }

    // 4. Map activities and turmas
    return ativs.map((a: any) => {
      const aTurmas = turmaList.filter((t: any) => t.atividade_id === a.id);
      const turmasFormatted = aTurmas.map((t: any) => ({
        id: t.id,
        nome: t.nome || "Turma Regular",
        turno: t.turno || null,
        horario: t.horario || null,
        vagas: Number(t.vagas || 0),
        matriculasAtivas: turmaCountMap[t.id] || 0,
      }));

      const ativVagas = turmasFormatted.reduce((acc, t) => acc + t.vagas, Number(a.vagas || 0));
      const ativMatriculas = turmasFormatted.reduce((acc, t) => acc + t.matriculasAtivas, 0);

      return {
        atividadeId: a.id,
        nome: a.nome,
        ativo: Boolean(a.ativo ?? true),
        professorNome: a.profiles?.nome || null,
        vagasTotais: ativVagas,
        matriculasAtivas: ativMatriculas,
        turmas: turmasFormatted,
      };
    });
  } catch (err) {
    console.error("fetchPoloAtividadesServer error:", err);
    return [];
  }
}

export async function fetchPoloAlunosServer(poloId: string): Promise<PoloAlunoItem[]> {
  try {
    const { data: mats, error } = await supabase
      .from("matriculas")
      .select("id, aluno_id, aluno_email, status, created_at, turma_id, turmas(id, nome, atividade_id, atividades(nome, polo_id, polos(nome)))")
      .order("created_at", { ascending: false });

    if (error || !mats) return [];

    // Filter matriculas belonging to this polo
    const poloMats = mats.filter((m: any) => {
      const pId = m.turmas?.atividades?.polo_id;
      return pId === poloId;
    });

    if (poloMats.length === 0) return [];

    const emails = poloMats.map((m: any) => m.aluno_email?.toLowerCase()).filter(Boolean);

    // Fetch matching cadastros_alunos
    const cadastrosMap = new Map<string, any>();
    if (emails.length > 0) {
      const { data: cads } = await supabase
        .from("cadastros_alunos" as any)
        .select("email, nome, telefone, tel_responsavel, nome_responsavel, nome_escola")
        .in("email", emails);

      (cads || []).forEach((c: any) => {
        if (c.email) cadastrosMap.set(c.email.toLowerCase(), c);
      });
    }

    return poloMats.map((m: any) => {
      const cad = cadastrosMap.get((m.aluno_email || "").toLowerCase());
      return {
        matriculaId: m.id,
        alunoId: m.aluno_id || null,
        nome: cad?.nome || m.aluno_email?.split("@")[0] || "Aluno Matriculado",
        email: m.aluno_email || null,
        telefone: cad?.telefone || null,
        responsavel: cad?.nome_responsavel || cad?.tel_responsavel || null,
        escola: cad?.nome_escola || null,
        turmaId: m.turma_id || null,
        turmaNome: m.turmas?.nome || null,
        atividadeNome: m.turmas?.atividades?.nome || null,
        poloNome: m.turmas?.atividades?.polos?.nome || null,
        status: m.status || "ativa",
        dataMatricula: m.created_at ? m.created_at.slice(0, 10) : null,
      };
    });
  } catch (err) {
    console.error("fetchPoloAlunosServer error:", err);
    return [];
  }
}

export async function fetchPoloDashboardServer(poloId: string): Promise<PoloDashboardData> {
  try {
    const ativs = await fetchPoloAtividadesServer(poloId);
    const alunos = await fetchPoloAlunosServer(poloId);

    const totalAlunos = alunos.filter((a) => a.status === "ativa").length;
    const vagasTotais = ativs.reduce((acc, a) => acc + a.vagasTotais, 0);
    const totalAtividades = ativs.length;
    const totalTurmas = ativs.reduce((acc, a) => acc + a.turmas.length, 0);

    // Count pending purchase orders for this polo
    let pedidosPendentes = 0;
    try {
      const { data: peds } = await supabase
        .from("pedidos_compra")
        .select("id, status, polo_id")
        .eq("status", "pendente")
        .eq("polo_id", poloId);
      pedidosPendentes = peds?.length || 0;
    } catch {}

    // Calculate attendance / taxaFrequencia over last 30 days
    let taxaFrequencia: number | null = null;
    let totalItensChamada = 0;
    let totalPresentes = 0;

    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    const dataIso = dataLimite.toISOString().slice(0, 10);

    try {
      const { data: chams } = await supabase
        .from("chamadas" as any)
        .select("id, atividade_id, chamada_itens(presente)")
        .eq("polo_id", poloId)
        .gte("data", dataIso);

      if (chams && chams.length > 0) {
        chams.forEach((c: any) => {
          (c.chamada_itens || []).forEach((ci: any) => {
            totalItensChamada++;
            if (ci.presente) totalPresentes++;
          });
        });

        if (totalItensChamada > 0) {
          taxaFrequencia = Math.round((totalPresentes / totalItensChamada) * 100);
        }
      }
    } catch {}

    // Breakdown per activity
    const porAtividade = ativs.map((a) => {
      const pct = a.vagasTotais > 0 ? Math.round((a.matriculasAtivas / a.vagasTotais) * 100) : 0;
      return {
        nome: a.nome,
        turmas: a.turmas.length,
        alunos: a.matriculasAtivas,
        vagas: a.vagasTotais,
        percentPreenchidas: Math.min(100, pct),
        presencaPercent: taxaFrequencia,
      };
    });

    return {
      totalAlunos,
      vagasTotais,
      totalAtividades,
      totalTurmas,
      pedidosPendentes,
      taxaFrequencia,
      porAtividade,
    };
  } catch (err) {
    console.error("fetchPoloDashboardServer error:", err);
    return {
      totalAlunos: 0,
      vagasTotais: 0,
      totalAtividades: 0,
      totalTurmas: 0,
      pedidosPendentes: 0,
      taxaFrequencia: null,
      porAtividade: [],
    };
  }
}

export async function registrarChamadaServer(payload: {
  turmaId: string;
  atividadeId: string;
  poloId: string;
  professorId?: string;
  data: string;
  itens: Array<{ matriculaId: string; alunoNome: string; presente: boolean }>;
}): Promise<boolean> {
  try {
    // 1. Upsert chamadas record
    const { data: chamada, error: cErr } = await supabase
      .from("chamadas" as any)
      .upsert(
        {
          turma_id: payload.turmaId,
          atividade_id: payload.atividadeId,
          polo_id: payload.poloId,
          professor_id: payload.professorId || null,
          data: payload.data,
        },
        { onConflict: "turma_id, data" }
      )
      .select("id")
      .single();

    if (cErr || !chamada) {
      console.error("Error upserting chamada:", cErr);
      return false;
    }

    const chamadaId = (chamada as any).id;

    // 2. Delete existing items for this chamada and insert fresh
    await supabase.from("chamada_itens" as any).delete().eq("chamada_id", chamadaId);

    const itemRows = payload.itens.map((i) => ({
      chamada_id: chamadaId,
      matricula_id: i.matriculaId,
      aluno_nome: i.alunoNome,
      presente: i.presente,
    }));

    if (itemRows.length > 0) {
      await supabase.from("chamada_itens" as any).insert(itemRows as any);
    }

    return true;
  } catch (err) {
    console.error("registrarChamadaServer error:", err);
    return false;
  }
}
