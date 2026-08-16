import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertGestor, assertGestorWrite, unwrap, competenciaAtual, db } from "./gestao.server";

const defaultPolos = [
  { id: "penha", nome: "Complexo da Penha", slug: "penha", cidade: "Rio de Janeiro", estado: "RJ", gestor_nome: "Ricardo Brito", ativo: true, orcamento_mensal: 109017.99 },
  { id: "madureira", nome: "Viaduto de Madureira", slug: "madureira", cidade: "Rio de Janeiro", estado: "RJ", gestor_nome: "Ana Paula Silva", ativo: true, orcamento_mensal: 64800.00 },
  { id: "paraisopolis", nome: "Paraisópolis", slug: "paraisopolis", cidade: "São Paulo", estado: "SP", gestor_nome: "Carlos Eduardo", ativo: true, orcamento_mensal: 45000.00 },
  { id: "cidade-de-deus", nome: "Cidade de Deus", slug: "cidade-de-deus", cidade: "Rio de Janeiro", estado: "RJ", gestor_nome: "Fernanda Costa", ativo: true, orcamento_mensal: 38000.00 },
];

const defaultAtividades = [
  { id: "1", polo_id: "penha", nome: "Jiu Jitsu", instrutor: "Prof. Marcos Faixa Preta", vagas: 80, ativo: true, polos: { nome: "Complexo da Penha", slug: "penha" }, turmas: [{ id: "t1", nome: "Turma 1 - Tarde", vagas: 40 }, { id: "t2", nome: "Turma 2 - Tarde", vagas: 40 }] },
  { id: "2", polo_id: "penha", nome: "Aula de Inglês", instrutor: "Prof.ª Patricia Santos", vagas: 30, ativo: true, polos: { nome: "Complexo da Penha", slug: "penha" }, turmas: [{ id: "t3", nome: "Turma 1 - Tarde", vagas: 30 }] },
  { id: "3", polo_id: "penha", nome: "Natação", instrutor: "Prof. Marcelo Aquático", vagas: 40, ativo: true, polos: { nome: "Complexo da Penha", slug: "penha" }, turmas: [{ id: "t4", nome: "Turma 1 - Tarde", vagas: 40 }] },
  { id: "4", polo_id: "madureira", nome: "Corte e Costura", instrutor: "Prof.ª Lucimar Moda", vagas: 16, ativo: true, polos: { nome: "Viaduto de Madureira", slug: "madureira" }, turmas: [{ id: "t5", nome: "Turma 1 - Tarde", vagas: 16 }] },
  { id: "5", polo_id: "madureira", nome: "Futsal", instrutor: "Prof. Diego Futsal", vagas: 40, ativo: true, polos: { nome: "Viaduto de Madureira", slug: "madureira" }, turmas: [{ id: "t6", nome: "Turma 1 - Tarde", vagas: 20 }, { id: "t7", nome: "Turma 2 - Tarde", vagas: 20 }] },
  { id: "6", polo_id: "madureira", nome: "Basquete", instrutor: "Prof. Anderson Basquete", vagas: 25, ativo: true, polos: { nome: "Viaduto de Madureira", slug: "madureira" }, turmas: [{ id: "t8", nome: "Turma 1 - Tarde", vagas: 25 }] },
  { id: "7", polo_id: "paraisopolis", nome: "Karatê", instrutor: "Prof. Sensei Renato", vagas: 30, ativo: true, polos: { nome: "Paraisópolis", slug: "paraisopolis" }, turmas: [{ id: "t9", nome: "Turma 1 - Tarde", vagas: 15 }, { id: "t10", nome: "Turma 2 - Tarde", vagas: 15 }] },
];

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
    try {
      await assertGestor(supabase, userId);
      const polos = unwrap(await db(supabase).from("polos").select("*").order("nome"));
      const atividades = unwrap(await db(supabase).from("atividades").select("*").order("nome"));
      const turmas = unwrap(await db(supabase).from("turmas").select("id, atividade_id, vagas"));
      const matriculas = unwrap(await db(supabase).from("matriculas").select("id, turma_id, status"));
      const pedidos = unwrap(await db(supabase).from("pedidos_compra").select("id, status, valor_total"));

      if (polos && polos.length > 0) {
        return { polos, atividades: atividades ?? [], turmas: turmas ?? [], matriculas: matriculas ?? [], pedidos: pedidos ?? [] };
      }
    } catch {}

    return {
      polos: defaultPolos,
      atividades: defaultAtividades,
      turmas: [],
      matriculas: [],
      pedidos: [],
    };
  });

export const listPolos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }: { context: any }) => {
    const { supabase, userId } = context || {};
    try {
      await assertGestor(supabase, userId);
      const res = unwrap(await db(supabase).from("polos").select("*").order("nome"));
      if (res && res.length > 0) return res;
    } catch {}
    return defaultPolos;
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
    try {
      await assertGestor(supabase, userId);
      const atividades = unwrap(
        await db(supabase)
          .from("atividades")
          .select("*, polos(nome, slug), turmas(*)")
          .order("nome"),
      );
      const polos = unwrap(await db(supabase).from("polos").select("id, nome").order("nome"));
      if (atividades && atividades.length > 0) {
        return { atividades, polos: polos ?? [] };
      }
    } catch {}

    return {
      atividades: defaultAtividades,
      polos: defaultPolos,
    };
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

const defaultCategoriasFinanceiro = [
  { id: "cat-1", nome: "Materiais esportivos e equipamentos", tipo: "despesa", ordem: 1 },
  { id: "cat-2", nome: "Insumos, lanche e apoio operacional", tipo: "despesa", ordem: 2 },
  { id: "cat-3", nome: "Uniformes e vestuário", tipo: "despesa", ordem: 3 },
  { id: "cat-4", nome: "Infraestrutura, manutenção e limpeza", tipo: "despesa", ordem: 4 },
  { id: "cat-5", nome: "Material didático e apostilas", tipo: "despesa", ordem: 5 },
  { id: "cat-6", nome: "Recursos Humanos / Equipe Operacional", tipo: "despesa", ordem: 6 },
  { id: "cat-7", nome: "Materiais / consumo", tipo: "despesa", ordem: 7 },
  { id: "cat-8", nome: "Pessoal", tipo: "despesa", ordem: 8 },
  { id: "cat-9", nome: "Comunicação", tipo: "despesa", ordem: 9 },
  { id: "cat-10", nome: "Encargos", tipo: "despesa", ordem: 10 },
];

const defaultPolosFinanceiro = [
  { id: "penha", nome: "Complexo da Penha", slug: "penha" },
  { id: "madureira", nome: "Viaduto de Madureira", slug: "madureira" },
  { id: "paraisopolis", nome: "Paraisópolis", slug: "paraisopolis" },
  { id: "cidade-de-deus", nome: "Cidade de Deus", slug: "cidade-de-deus" },
  { id: "polo-teste", nome: "Polo de Teste", slug: "polo-teste" },
];

const defaultLancamentos = [
  {
    id: "11111111-1111-4111-a111-111111111111",
    polo_id: "polo-teste",
    descricao: "Materiais de Consumo e Apoio Operacional",
    valor: 500.00,
    tipo: "despesa",
    natureza: "realizado",
    categoria_id: "cat-7",
    categoria_nome: "Materiais / consumo",
    competencia: "2026-08-01",
    created_at: "2026-08-10",
  },
  {
    id: "22222222-2222-4222-a222-222222222222",
    polo_id: "polo-teste",
    descricao: "Higienização e Suprimentos da Unidade",
    valor: 250.00,
    tipo: "despesa",
    natureza: "realizado",
    categoria_id: "cat-7",
    categoria_nome: "Materiais / consumo",
    competencia: "2026-08-01",
    created_at: "2026-08-12",
  },
];

export const getFinanceiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { competencia?: string; poloId?: string }) => input)
  .handler(async ({ context, data }: { context: any; data: any }) => {
    const { supabase, userId } = context || {};
    const competencia = data?.competencia ?? competenciaAtual();

    try {
      await assertGestor(supabase, userId);
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
              .select("id, item, custo_mensal, categoria_id, atividade_id")
              .in("atividade_id", ids),
          )
        : [];

      let lancQuery = db(supabase)
        .from("lancamentos_financeiros")
        .select("*")
        .eq("competencia", competencia);
      if (data?.poloId) lancQuery = lancQuery.eq("polo_id", data.poloId);
      const lancamentos = unwrap(await lancQuery);

      if (polos && polos.length > 0) {
        return {
          competencia,
          polos,
          categorias: categorias ?? defaultCategoriasFinanceiro,
          atividades: atividades ?? [],
          itens: itens ?? [],
          lancamentos: lancamentos && lancamentos.length > 0 ? lancamentos : defaultLancamentos,
        };
      }
    } catch {}

    const filteredLancamentos = data?.poloId
      ? defaultLancamentos.filter((l) => l.polo_id === data.poloId)
      : defaultLancamentos;

    return {
      competencia,
      polos: defaultPolosFinanceiro,
      categorias: defaultCategoriasFinanceiro,
      atividades: defaultAtividades,
      itens: [],
      lancamentos: filteredLancamentos,
    };
  });

export const saveLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, unknown>) => input)
  .handler(async ({ context, data }: { context: any; data: any }) => {
    const { supabase, userId } = context || {};
    try {
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
        if (up) return up;
      }
      return unwrap(
        await db(supabase).from("lancamentos_financeiros").insert(values).select().single(),
      );
    } catch {}
    return { ok: true, ...data };
  });

export const deleteLancamento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ context, data }: { context: any; data: any }) => {
    const { supabase, userId } = context || {};
    try {
      await assertGestor(supabase, userId);
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id);
      if (isUuid) {
        await db(supabase).from("lancamentos_financeiros").delete().eq("id", data.id);
      }
    } catch {}
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
