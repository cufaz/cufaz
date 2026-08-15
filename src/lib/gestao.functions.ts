import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertGestor, unwrap, competenciaAtual, db } from "./gestao.server";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const perfil = unwrap(
      await db(supabase).from("profiles").select("*").eq("id", userId).maybeSingle(),
    );
    const roles = unwrap(await db(supabase).from("user_roles").select("role").eq("user_id", userId));
    return {
      userId,
      perfil,
      roles: (roles ?? []).map((r: { role: string }) => r.role),
    };
  });

export const getResumoGestor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const polos = unwrap(await db(supabase).from("polos").select("*").order("nome"));
    const atividades = unwrap(
      await db(supabase).from("atividades").select("*").order("nome"),
    );
    const turmas = unwrap(await db(supabase).from("turmas").select("id, atividade_id, vagas"));
    const matriculas = unwrap(
      await db(supabase).from("matriculas").select("id, turma_id, status"),
    );
    const pedidos = unwrap(
      await db(supabase).from("pedidos_compra").select("id, status, valor_total"),
    );
    return { polos, atividades, turmas, matriculas, pedidos };
  });

export const listPolos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    return unwrap(await db(supabase).from("polos").select("*").order("nome"));
  });

export const savePolo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id) return unwrap(await db(supabase).from("polos").update(values).eq("id", id).select().single());
    return unwrap(await db(supabase).from("polos").insert(values).select().single());
  });

export const deletePolo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { error } = await db(supabase).from("polos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAtividades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const atividades = unwrap(
      await supabase
        .from("atividades")
        .select("*, polos(nome, slug), turmas(*)")
        .order("nome"),
    );
    const polos = unwrap(await db(supabase).from("polos").select("id, nome").order("nome"));
    return { atividades, polos };
  });

export const saveAtividade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id)
      return unwrap(
        await db(supabase).from("atividades").update(values).eq("id", id).select().single(),
      );
    return unwrap(await db(supabase).from("atividades").insert(values).select().single());
  });

export const deleteAtividade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { error } = await db(supabase).from("atividades").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveTurma = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id) return unwrap(await db(supabase).from("turmas").update(values).eq("id", id).select().single());
    return unwrap(await db(supabase).from("turmas").insert(values).select().single());
  });

export const deleteTurma = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { error } = await db(supabase).from("turmas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getOrcamentoAtividade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { atividadeId: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const itens = unwrap(
      await supabase
        .from("itens_orcamento")
        .select("*, categorias_custo(nome)")
        .eq("atividade_id", data.atividadeId)
        .order("item"),
    );
    const categorias = unwrap(
      await db(supabase).from("categorias_custo").select("*").order("ordem"),
    );
    return { itens, categorias };
  });

export const saveItemOrcamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id)
      return unwrap(
        await db(supabase).from("itens_orcamento").update(values).eq("id", id).select().single(),
      );
    return unwrap(await db(supabase).from("itens_orcamento").insert(values).select().single());
  });

export const deleteItemOrcamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { error } = await db(supabase).from("itens_orcamento").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getFinanceiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { competencia?: string; poloId?: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const competencia = data.competencia ?? competenciaAtual();

    const polos = unwrap(await db(supabase).from("polos").select("id, nome").order("nome"));
    const categorias = unwrap(
      await db(supabase).from("categorias_custo").select("*").order("ordem"),
    );

    let atividadesQuery = db(supabase).from("atividades").select("id, nome, polo_id");
    if (data.poloId) atividadesQuery = atividadesQuery.eq("polo_id", data.poloId);
    const atividades = unwrap(await atividadesQuery);
    const ids = (atividades ?? []).map((a: { id: string }) => a.id);

    const itens = ids.length
      ? unwrap(
          await supabase
            .from("itens_orcamento")
            .select("id, item, custo_mensal, categoria_id, atividade_id")
            .in("atividade_id", ids),
        )
      : [];

    let lancQuery = db(supabase)
      .from("lancamentos_financeiros")
      .select("*")
      .eq("competencia", competencia);
    if (data.poloId) lancQuery = lancQuery.eq("polo_id", data.poloId);
    const lancamentos = unwrap(await lancQuery);

    return { competencia, polos, categorias, atividades, itens, lancamentos };
  });

export const saveLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id)
      return unwrap(
        await supabase
          .from("lancamentos_financeiros")
          .update(values)
          .eq("id", id)
          .select()
          .single(),
      );
    return unwrap(
      await db(supabase).from("lancamentos_financeiros").insert(values).select().single(),
    );
  });

export const deleteLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { error } = await db(supabase).from("lancamentos_financeiros").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPedidos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const pedidos = unwrap(
      await supabase
        .from("pedidos_compra")
        .select("*, polos(nome), atividades(nome), categorias_custo(nome)")
        .order("created_at", { ascending: false }),
    );
    return pedidos;
  });

export const decidirPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; status: "aprovado" | "reprovado"; observacao?: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const pedido = unwrap(
      await supabase
        .from("pedidos_compra")
        .update({
          status: data.status,
          observacao_gestor: data.observacao ?? null,
          decidido_por: userId,
          decidido_em: new Date().toISOString(),
        })
        .eq("id", data.id)
        .select()
        .single(),
    );

    await db(supabase).from("lancamentos_financeiros").delete().eq("pedido_id", data.id);
    if (data.status === "aprovado") {
      const p = pedido as Record<string, string | number | null>;
      const { error } = await db(supabase).from("lancamentos_financeiros").insert({
        polo_id: p['polo_id'],
        atividade_id: p['atividade_id'],
        categoria_id: p['categoria_id'],
        tipo: "despesa",
        natureza: "realizado",
        descricao: `Pedido aprovado: ${String(p['item'])}`,
        valor: p['valor_total'],
        competencia: p['competencia'],
        pedido_id: data.id,
      });
      if (error) throw new Error(error.message);
    }
    return pedido;
  });

export const criarPedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    return unwrap(
      await supabase
        .from("pedidos_compra")
        .insert({ ...data, solicitante_id: userId })
        .select()
        .single(),
    );
  });

export const listAlunos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const matriculas = unwrap(
      await supabase
        .from("matriculas")
        .select("*, turmas(id, nome, vagas, atividades(id, nome, polos(nome)))")
        .order("created_at", { ascending: false }),
    );
    const turmas = unwrap(
      await db(supabase).from("turmas").select("id, nome, vagas, atividades(nome, polos(nome))"),
    );
    return { matriculas, turmas };
  });

export const saveMatricula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id)
      return unwrap(await db(supabase).from("matriculas").update(values).eq("id", id).select().single());
    return unwrap(await db(supabase).from("matriculas").insert(values).select().single());
  });

export const deleteMatricula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const { error } = await db(supabase).from("matriculas").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listProfessores = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const roles = unwrap(await db(supabase).from("user_roles").select("user_id").eq("role", "professor"));
    const ids = (roles ?? []).map((r: { user_id: string }) => r.user_id);
    const professores = ids.length
      ? unwrap(await db(supabase).from("profiles").select("*, polos(nome)").in("id", ids))
      : [];
    const vinculos = unwrap(
      await supabase
        .from("professores_atividades")
        .select("id, professor_id, atividades(nome, polos(nome))"),
    );
    const avaliacoes = unwrap(
      await supabase
        .from("avaliacoes_professor")
        .select("id, professor_id, nota, comentario, created_at")
        .order("created_at", { ascending: false }),
    );
    return { professores, vinculos, avaliacoes };
  });
