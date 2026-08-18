# Sincronizar o Painel do Polo com o banco (fim dos dados fictícios)

## O que eu verifiquei agora

- No banco: `cadastros_alunos` = 0 registros, `matriculas` = 0 registros.
- As telas do polo (Dashboard, Alunos, Atividades) leem tudo de `localStorage`
  (`cufa_alunos_cadastrados`, `cufa_alunos_polo`, `cufa_professores_solicitacoes`,
  `cufa_compras_polo`) e têm listas de atividades/turmas escritas no código.
- Turmas reais no banco: Jiu Jitsu 1 turma (80 vagas), Inglês 30, Natação 40,
  Karatê 30, Basquete 25, Futsal 40, Corte e Costura 16 — diferente do que a tela mostra.

Conclusão: os "2 alunos" do site publicado e os "2 alunos" diferentes no preview
não são cache — são dados guardados no navegador de cada ambiente. Por isso
"0 / 40" nunca conta matrícula e a Taxa de Frequência fica "—".
Limpar cache não resolve; o que resolve é ler e gravar no banco.

## Correções

1. **Alunos do polo** — lista vem de `cadastros_alunos` + `matriculas` filtrando pelo polo
   do responsável logado. Sem nomes, telefones, escolas ou responsáveis inventados:
   campo vazio aparece como "Não informado".
2. **Atividades e Turmas do Polo** — cards gerados de `atividades` + `turmas` do polo,
   com "Beneficiários" = matrículas ativas contadas por turma/atividade / vagas reais.
   Nada de turmas fixas no código.
3. **Professor vinculado** — vem de `atividades.professor_id` / `professores_atividades`,
   e as solicitações de vínculo passam a viver em tabela própria, não em `localStorage`,
   para que aprovar/recusar valha em qualquer dispositivo.
4. **Dashboard do Polo** — Alunos Matriculados, Atividades Ofertadas, Vagas e
   Solicitações de Compra vindos do banco; a barra laranja passa a refletir o
   % de vagas preenchidas (hoje está sempre cheia); "Presença" por oficina e
   "Taxa de Frequência Média" calculadas das chamadas gravadas no banco, exibindo
   "—" apenas quando realmente não houver chamada.
5. **Chamadas** — gravadas em tabela (`chamadas` / `chamada_itens`) para que
   frequência do aluno, do professor e do polo batam em todos os acessos.
6. **Cache** — em vez de limpeza agendada, atualização em tempo real:
   dados via TanStack Query com `refetchOnWindowFocus`, invalidação após cada
   gravação e versionamento do build para descartar `localStorage` antigo uma vez.

## Técnico

- Nova migration: `chamadas`, `chamada_itens`, `solicitacoes_professor` (todas com
  GRANT + RLS por polo/gestor). `matriculas` passa a ser preenchida no cadastro/matrícula do aluno.
- Leitura pública/autenticada via `createServerFn` com `requireSupabaseAuth`;
  contagens agregadas por `turma_id` no servidor.
- Remoção dos blocos `loadMergedPoloAlunosList`, `loadMergedPoloStudents`,
  arrays fixos de atividades em `src/routes/_authenticated/polo/atividades.tsx`
  e do `defaultSolicitacao` do Jiu Jitsu.
- Rotina única de migração: ao primeiro acesso, o que estiver em `localStorage`
  é descartado (não promovido), evitando ressuscitar dados fictícios.

## Prompt para o Antigravity

Ao aprovar, eu devolvo no chat o prompt técnico completo (schema SQL, arquivos a
alterar, contratos das server functions e critérios de aceite) com base neste plano.
