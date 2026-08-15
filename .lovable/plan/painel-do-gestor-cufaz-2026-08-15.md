# Painel do Gestor — CUFAZ

Construir a visão do gestor como painel administrativo profissional, com backend real (Lovable Cloud) e os dados da planilha CUFA x Amazon já carregados.

## O que vem da planilha

Abas usadas: Resumo Geral e as 7 abas de atividade (Madureira: Corte e Costura, Futsal, Basquete; Complexo da Penha: Inglês, Jiu Jitsu, Natação; Paraisópolis: Karatê). Ignoradas: Guia de Preenchimento e PROJETO.

- 3 polos (Viaduto de Madureira/RJ, Complexo da Penha/RJ, Paraisópolis/SP) com endereço, ponto focal, perfil temático, link de fotos, vagas totais e orçamento mensal.
- 7 atividades com dias, descrição, turnos/horários, nº de vagas e beneficiários projetados — o limite de vagas já entra como cadastrado.
- Itens/serviços de cada atividade: item, categoria, descrição, quantidade e custo mensal. As categorias (Pessoal, Materiais esportivos, Encargos, Infraestrutura, Comunicação, Serviços técnicos essenciais, Evento pedagógico, Administrativo/RH) viram cadastro próprio.
- Cada item vira uma linha de orçamento previsto mensal da atividade; o realizado entra pelos pedidos de compra aprovados.

## Telas do painel

1. **Dashboard** — teto do projeto, custo mensal total, % do teto utilizado, beneficiários, vagas ocupadas x totais, pedidos aguardando aprovação, resumo por polo.
2. **Polos** — lista e formulário de criação/edição (nome, cidade, endereço, ponto focal, perfil temático, fotos, status). Responsáveis CUFA pré-cadastrados e vinculados ao polo; quando o responsável se cadastrar no site e escolher o polo, o vínculo é feito automaticamente.
3. **Atividades** — CRUD por polo, com descrição, dias, professor, status e itens de custo. Turmas/horários com turno, horário, limite de vagas e ocupação.
4. **Financeiro** — visão categorizada no formato do demonstrativo anexado: 1. Receitas, 2. Despesas por categoria, 3. Resumo financeiro (saldo anterior, receitas, despesas, saldo do mês), 4. Outras contas. Filtro por polo, atividade e mês/ano; comparativo previsto x realizado e exportação CSV.
5. **Pedidos de compra** — responsável CUFA solicita (item, categoria, quantidade, valor, justificativa, anexo opcional); gestor aprova ou reprova com observação. Pedido aprovado vira despesa realizada no financeiro. Histórico com filtros e status.
6. **Alunos** — lista com polo, atividade/turma, matrícula, status e presença futura; gestor pode matricular, transferir e cancelar, respeitando o limite de vagas.
7. **Professores** — cadastro, vínculo com polo/atividades, e leitura das avaliações feitas pelos alunos (estrutura já criada; o envio de avaliação entra na área do aluno mais adiante).

## Acesso

Login real de gestor com e-mail e senha (o acesso Adm atual, com senha fixa, é substituído). Papéis: gestor, responsável CUFA, professor, aluno — cada um só enxerga o que lhe cabe. O painel fica em rota própria protegida, com menu lateral, e é totalmente utilizável no celular.

## Detalhes técnicos

- Lovable Cloud (Postgres + Auth). Tabelas: `profiles`, `user_roles` (+ enum `app_role` e função `has_role`), `polos`, `polo_responsaveis`, `atividades`, `turmas`, `categorias_custo`, `itens_orcamento`, `matriculas`, `professores_atividades`, `avaliacoes_professor`, `pedidos_compra`, `lancamentos_financeiros`.
- RLS em todas as tabelas, com GRANTs explícitos; gestor via `has_role`, responsável limitado ao próprio polo, aluno/professor aos próprios registros.
- Seed dos polos, atividades, turmas, categorias e itens de orçamento por INSERT literal na migração.
- Leitura e escrita por `createServerFn` com `requireSupabaseAuth`; rotas do painel sob `src/routes/_authenticated/`, dados via TanStack Query.
- UI shadcn (sidebar, tabelas, dialogs, charts) nas cores do logo, mobile-first.

## Fora desta entrega

Área logada de aluno e professor (matrícula própria, vitrine de atividades, envio de avaliação) — vem depois, sobre esta mesma base.
