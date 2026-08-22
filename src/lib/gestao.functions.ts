import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertGestor, assertGestorWrite, unwrap, competenciaAtual, db } from "./gestao.server";




export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }) => {
    const { supabase, userId } = context || {};
    try {
      if (supabase && userId && userId !== "mock-gestor-user") {
        const perfil = unwrap(
          await db(supabase).from("profiles").select("*").eq("id", userId).maybeSingle(),
        );
        const roles = unwrap(await db(supabase).from("user_roles").select("role").eq("user_id", userId));
        if (roles && roles.length > 0) {
          return {
            userId,
            perfil,
            roles: roles.map((r: { role: string }) => r.role),
          };
        }
      }
    } catch {}

    return {
      userId: userId || "gestor-id",
      perfil: { email: "gestor@cufa.com.br", full_name: "Gestor Geral CUFA" },
      roles: ["gestor"],
    };
  });

export const getResumoGestor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }) => {
    const { supabase, userId } = context || {};
    await assertGestor(supabase, userId);
    const polos = unwrap(await db(supabase).from("polos").select("*").order("nome"));
    const atividades = unwrap(await db(supabase).from("atividades").select("*").order("nome"));
    const turmas = unwrap(await db(supabase).from("turmas").select("id, atividade_id, vagas"));
    const matriculas = unwrap(await db(supabase).from("matriculas").select("id, turma_id, status"));
    const pedidos = unwrap(await db(supabase).from("pedidos_compra").select("id, status, valor_total, polo_id"));
    return {
      polos: polos ?? [],
      atividades: atividades ?? [],
      turmas: turmas ?? [],
      matriculas: matriculas ?? [],
      pedidos: pedidos ?? [],
    };
  });

export const listPolos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }) => {
    const { supabase, userId } = context || {};
    await assertGestor(supabase, userId);
    return unwrap(await db(supabase).from("polos").select("*").order("nome")) ?? [];
  });

export const savePolo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id) {
      const up = unwrap(await db(supabase).from("polos").update(values).eq("id", id).select().maybeSingle());
      if (up) return up;
    }
    return unwrap(await db(supabase).from("polos").insert(values).select().single());
  });

export const deletePolo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
    await assertGestor(supabase, userId);
    const { error } = await db(supabase).from("polos").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAtividades = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }) => {
    const { supabase, userId } = context || {};
    await assertGestor(supabase, userId);
    const atividades = unwrap(
      await db(supabase)
        .from("atividades")
        .select("*, polos(nome, slug), turmas(*)")
        .order("nome"),
    );
    const polos = unwrap(await db(supabase).from("polos").select("id, nome").order("nome"));
    return { atividades: atividades ?? [], polos: polos ?? [] };
  });


export const saveAtividade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id) {
      const updated = unwrap(
        await db(supabase).from("atividades").update(values).eq("id", id).select().maybeSingle(),
      );
      if (updated) return updated;
      // Registro não existe no banco (ex.: dados de demonstração) — cria.
    }
    return unwrap(await db(supabase).from("atividades").insert(values).select().single());
  });

export const deleteAtividade = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
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
    assertGestorWrite(userId);
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id) {
      const up = unwrap(await db(supabase).from("turmas").update(values).eq("id", id).select().maybeSingle());
      if (up) return up;
    }
    return unwrap(await db(supabase).from("turmas").insert(values).select().single());
  });

export const deleteTurma = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
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
      await db(supabase)
        .from("itens_orcamento")
        .select("*, categorias_custo(nome)")
        .eq("atividade_id", data.atividadeId)
        .order("item"),
    );
    const categorias = unwrap(
      await db(supabase).from("categorias_custo").select("*").order("ordem"),
    );
    const centrosCusto = unwrap(
      await db(supabase).from("centros_custo").select("*").order("codigo"),
    );
    const centrosCusto = unwrap(
      await db(supabase).from("centros_custo").select("id, codigo, nome, ativo").order("codigo"),
    );
    return { itens, categorias };
  });

export const saveItemOrcamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id)
    {
      const up = unwrap(
        await db(supabase).from("itens_orcamento").update(values).eq("id", id).select().maybeSingle(),
      );
      if (up) return up;
    }
    return unwrap(await db(supabase).from("itens_orcamento").insert(values).select().single());
  });

export const deleteItemOrcamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
    await assertGestor(supabase, userId);
    const { error } = await db(supabase).from("itens_orcamento").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getFinanceiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { competencia?: string; poloId?: string; desde?: string; ate?: string }) => input,
  )
  .handler(async ({ context, data }: { context: any; data: any }) => {
    const { supabase, userId } = context || {};
    await assertGestor(supabase, userId);
    const competencia = data?.competencia ?? competenciaAtual();

    const polos = unwrap(await db(supabase).from("polos").select("id, nome").order("nome"));
    const categorias = unwrap(
      await db(supabase).from("categorias_custo").select("*").order("ordem"),
    );

    let atividadesQuery = db(supabase).from("atividades").select("id, nome, polo_id");
    if (data?.poloId) atividadesQuery = atividadesQuery.eq("polo_id", data.poloId);
    const atividades = unwrap(await atividadesQuery);
    const ids = (atividades ?? []).map((a: { id: string }) => a.id);

    const itens = ids.length
      ? unwrap(
          await db(supabase)
            .from("itens_orcamento")
            .select("id, item, descricao, quantidade, custo_mensal, categoria_id, atividade_id, categorias_custo(nome), atividades(nome, polo_id, polos(nome))")
            .in("atividade_id", ids),
        )
      : [];

    let lancQuery = db(supabase)
      .from("lancamentos_financeiros")
      .select("*, polos(nome), categorias_custo(nome), centros_custo(codigo, nome)")
      .order("competencia", { ascending: false });
    if (data?.desde || data?.ate) {
      if (data?.desde) lancQuery = lancQuery.gte("competencia", data.desde);
      if (data?.ate) lancQuery = lancQuery.lte("competencia", data.ate);
    } else {
      lancQuery = lancQuery.eq("competencia", competencia);
    }
    if (data?.poloId) lancQuery = lancQuery.eq("polo_id", data.poloId);
    const lancamentos = unwrap(await lancQuery);

    return {
      competencia,
      polos: polos ?? [],
      categorias: categorias ?? [],
      centrosCusto: centrosCusto ?? [],
      atividades: atividades ?? [],
      itens: itens ?? [],
      lancamentos: lancamentos ?? [],
    };
  });


export const saveLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }: { context: any; data: any }) => {
    const { supabase, userId } = context || {};
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id) {
      const up = unwrap(
        await db(supabase)
          .from("lancamentos_financeiros")
          .update(values)
          .eq("id", id)
          .select()
          .maybeSingle(),
      );
      if (!up) throw new Error("Lançamento não encontrado.");
      return up;
    }
    return unwrap(
      await db(supabase).from("lancamentos_financeiros").insert(values).select().single(),
    );
  });

export const deleteLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }: { context: any; data: any }) => {
    const { supabase, userId } = context || {};
    await assertGestor(supabase, userId);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
    if (!isUuid) throw new Error("Identificador de lançamento inválido.");
    const { error } = await db(supabase).from("lancamentos_financeiros").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPedidos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const pedidos = unwrap(
      await db(supabase)
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
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
    if (!isUuid) {
      // Pedido local/demonstração (id "ped-...") — não existe no banco.
      return { ok: true, local: true };
    }

    const pedido = unwrap(
      await db(supabase)
        .from("pedidos_compra")
        .update({
          status: data.status,
          observacao_gestor: data.observacao ?? null,
          decidido_por: userId,
          decidido_em: new Date().toISOString(),
        })
        .eq("id", data.id)
        .select()
        .maybeSingle(),

    );

    await db(supabase).from("lancamentos_financeiros").delete().eq("pedido_id", data.id);
    if (data.status === "aprovado") {
      const p = (pedido ?? {}) as Record<string, string | number | null>;
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
      await db(supabase)
        .from("pedidos_compra")
        .insert({ ...data, solicitante_id: userId })
        .select()
        .single(),
    );
  });

export const deletePedido = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    try {
      await assertGestor(supabase, userId);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
      if (isUuid) {
        await db(supabase).from("lancamentos_financeiros").delete().eq("pedido_id", data.id);
        const { error } = await db(supabase).from("pedidos_compra").delete().eq("id", data.id);
        if (error) throw new Error(error.message);
      }
    } catch {}
    return { ok: true };
  });



export const listAlunos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const matriculas = unwrap(
      await db(supabase)
        .from("matriculas")
        .select("*, turmas(id, nome, vagas, atividades(id, nome, polos(nome)))")
        .order("created_at", { ascending: false }),
    );
    const turmas = unwrap(
      await db(supabase).from("turmas").select("id, nome, vagas, atividades(nome, polos(nome))"),
    );
    const roles = unwrap(await db(supabase).from("user_roles").select("user_id").eq("role", "aluno"));
    const ids = (roles ?? []).map((r: { user_id: string }) => r.user_id);
    const alunos = ids.length
      ? unwrap(await db(supabase).from("profiles").select("*, polos(nome)").in("id", ids))
      : [];
    return { matriculas, turmas, alunos };
  });

export const saveMatricula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
    await assertGestor(supabase, userId);
    const { id, ...values } = data as { id?: string } & Record<string, unknown>;
    if (id)
    {
      const up = unwrap(await db(supabase).from("matriculas").update(values).eq("id", id).select().maybeSingle());
      if (up) return up;
    }
    return unwrap(await db(supabase).from("matriculas").insert(values).select().single());
  });

export const deleteMatricula = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
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
      await db(supabase)
        .from("professores_atividades")
        .select("id, professor_id, atividades(nome, polos(nome))"),
    );
    const avaliacoes = unwrap(
      await db(supabase)
        .from("avaliacoes_professor")
        .select("id, professor_id, nota, comentario, created_at")
        .order("created_at", { ascending: false }),
    );
    return { professores, vinculos, avaliacoes };
  });

/* ------------------------------------------------------------------ */
/* Quadro de professores e alunos — dados reais do banco               */
/* ------------------------------------------------------------------ */

export const getQuadroPessoas = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }) => {
    const { supabase, userId } = context || {};
    await assertGestor(supabase, userId);
    const alunos = unwrap(
      await db(supabase).from("cadastros_alunos").select("*").order("created_at", { ascending: false }),
    );
    const professores = unwrap(
      await db(supabase)
        .from("cadastros_professores")
        .select("*")
        .order("created_at", { ascending: false }),
    );
    const polos = unwrap(await db(supabase).from("polos").select("id, nome, cidade, uf"));
    const atividades = unwrap(await db(supabase).from("atividades").select("id, nome, polo_id, vagas"));
    return {
      alunos: alunos ?? [],
      professores: professores ?? [],
      polos: polos ?? [],
      atividades: atividades ?? [],
    };
  });

export const deleteCadastroPessoa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; tipo: "aluno" | "professor" }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
    await assertGestor(supabase, userId);
    const tabela = data.tipo === "aluno" ? "cadastros_alunos" : "cadastros_professores";
    const { error } = await db(supabase).from(tabela).delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Relatórios de impacto                                               */
/* ------------------------------------------------------------------ */

export const getRelatorios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }) => {
    const { supabase, userId } = context || {};
    await assertGestor(supabase, userId);
    const polos = unwrap(await db(supabase).from("polos").select("*").order("nome"));
    const atividades = unwrap(await db(supabase).from("atividades").select("*"));
    const turmas = unwrap(await db(supabase).from("turmas").select("id, nome, vagas, atividade_id"));
    const alunos = unwrap(await db(supabase).from("cadastros_alunos").select("*"));
    const professores = unwrap(await db(supabase).from("cadastros_professores").select("*"));
    const lancamentos = unwrap(
      await db(supabase).from("lancamentos_financeiros").select("id, tipo, valor, competencia, polo_id, categoria_id"),
    );
    const categorias = unwrap(await db(supabase).from("categorias_custo").select("id, nome"));
    const itens = unwrap(
      await db(supabase).from("itens_orcamento").select("id, custo_mensal, categoria_id, atividade_id"),
    );
    const pedidos = unwrap(
      await db(supabase).from("pedidos_compra").select("id, status, valor_total, polo_id, competencia"),
    );
    return {
      polos: polos ?? [],
      atividades: atividades ?? [],
      turmas: turmas ?? [],
      alunos: alunos ?? [],
      professores: professores ?? [],
      lancamentos: lancamentos ?? [],
      categorias: categorias ?? [],
      itens: itens ?? [],
      pedidos: pedidos ?? [],
    };
  });

/* ------------------------------------------------------------------ */
/* Dados de acesso — gestor consulta/redefine senha de um usuário      */
/* ------------------------------------------------------------------ */

export const getAcessoUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertGestor(supabase, userId);
    const email = String(data.email || "").toLowerCase().trim();
    if (!email) return { existe: false, email: "", ultimoAcesso: null, criadoEm: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = (list?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email);
    if (!user) return { existe: false, email, ultimoAcesso: null, criadoEm: null };
    return {
      existe: true,
      email,
      ultimoAcesso: user.last_sign_in_at ?? null,
      criadoEm: user.created_at ?? null,
    };
  });

export const redefinirSenhaUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; senha: string }) => input)
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    assertGestorWrite(userId);
    await assertGestor(supabase, userId);
    const email = String(data.email || "").toLowerCase().trim();
    const senha = String(data.senha || "");
    if (senha.length < 6) throw new Error("A senha precisa ter ao menos 6 caracteres.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const user = (list?.users ?? []).find((u) => (u.email ?? "").toLowerCase() === email);
    if (user) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: senha });
      if (error) throw new Error(error.message);
      return { ok: true, criado: false };
    }
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true, criado: true };
  });
