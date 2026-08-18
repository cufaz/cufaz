# Ajustes CUFAZ — diário de classe, atividades e alinhamento de polos

## Verificações feitas

- O banco tem exatamente **3 polos**: Complexo da Penha, Paraisópolis, Viaduto de Madureira. **Não existe "Polo de Teste" no banco** — ele é texto fixo (hardcoded) em `professor/oportunidades.tsx`, `aluno/atividades.tsx`, `gestor/professores.tsx`, `gestor/diario-classe.tsx`, `gestor/atividades.tsx`, `gestor/gestores.tsx`, `gestor/financeiro.tsx` e `components/admin/GestorPanel.tsx`. Não há registro para apagar; o que precisa é remover o texto fixo.
- O diário de classe hoje é salvo em `localStorage` (`cufa_diario_classe`), com **um único registro por aluno** (sem data), lido em `professor/`, `aluno/`, `polo/` e `gestor/diario-classe.tsx`. Por isso o mesmo nível/relato aparece igual em todas as visões e não há histórico diário.

## Prompt técnico para o Antigravity

Copie o bloco abaixo:

---

Ajustes no sistema CUFAZ (TanStack Start + Supabase). Regra geral: nenhuma tela pode exibir dado fictício/hardcoded; sem registro, mostrar estado vazio.

**1. Diário de Classe do Professor (`src/routes/_authenticated/professor/diario-classe.tsx`)**
- O campo "Nível / Graduação do Aluno" deixa de ser select fixo: vira texto livre editável pelo professor (ícone de lápis ao lado do valor atual; clicar habilita edição inline). O texto digitado pelo professor é a nomenclatura oficial e deve aparecer igual em TODAS as visões (aluno, responsável de polo, gestor).
- Trocar o rótulo do card "Relatos & Faixas Registradas" por **"Registros"**.
- Remover os cards indicadores do topo da tela do **gestor** (`gestor/diario-classe.tsx`).
- O diário passa a ser **diário**: cada salvamento gera um registro com `data` (nível + relato + professor + oficina). Adicionar filtro de data na tela; o professor escolhe o dia e vê/edita o registro daquele dia. Manter histórico, não sobrescrever.
- A lista de alunos vira **lista em acordeão (efeito cascata)**: só nome/e-mail visíveis; ao clicar no nome, expande os campos (nível, data, relato, salvar).
- O filtro "Oficina" deve listar **apenas as atividades aprovadas** do professor (as que aparecem em "Minhas Atividades" com status aprovado), sem duplicar a opção placeholder com o mesmo nome.

**2. Modelo de dados do diário**
- Substituir o `localStorage` `cufa_diario_classe` por tabela no banco, ex.: `diario_classe (id, aluno_email, aluno_nome, professor_id, professor_nome, atividade_id, polo_nome, nivel text, relato text, data date, created_at)` com GRANTs e RLS: professor insere/edita os próprios registros; aluno lê os próprios; gestor lê tudo.
- Migrar o conteúdo existente do `localStorage` na primeira abertura, para não perder dados.

**3. Visão do aluno**
- `aluno/diario-classe.tsx`: exibir o histórico por data, com o nível exatamente como o professor escreveu.
- `aluno/minhas-atividades.tsx`: abaixo de "Matriculado em...", mostrar o **último relato do professor** e o **nível atual** daquela oficina.
- `aluno/perfil.tsx`: os campos novos criados no cadastro (endereço, telefone do avô/responsável adicional etc.) não estão sendo exibidos/salvos — incluir todos os campos do cadastro no perfil do aluno, carregando de `cadastros_alunos`.

**4. Site institucional / lista de atividades (tela inicial)**
- Remover as imagens dos cards de atividades: manter apenas título, polo e descrição.
- A lista deve vir do banco (`atividades`), incluindo toda atividade nova automaticamente, com **paginação de 5 em 5**.

**5. Polos alinhados**
- O banco tem só 3 polos: Complexo da Penha, Paraisópolis, Viaduto de Madureira. Remover TODAS as ocorrências hardcoded de "Polo de Teste" (e similares) em `professor/oportunidades.tsx`, `aluno/atividades.tsx`, `gestor/professores.tsx`, `gestor/diario-classe.tsx`, `gestor/atividades.tsx`, `gestor/gestores.tsx`, `gestor/financeiro.tsx`, `components/admin/GestorPanel.tsx`.
- Todo select/lista suspensa de polo deve usar o hook único que lê a tabela `polos` (`usePolosCadastrados` em `src/lib/cadastros.ts`). Se a leitura falhar, mostrar erro/vazio — nunca fallback fictício.
- Se existir qualquer registro remanescente de "Polo de Teste" no banco, apagar o polo e seus vínculos.

**6. NF de Serviço (professor)** — manter como está; sem alterações nesta rodada.

---

## Detalhes técnicos (implementação)

- Nova migração para `diario_classe` + GRANTs + políticas RLS por papel.
- Server functions com `requireSupabaseAuth` para criar/listar registros do diário.
- Componente compartilhado de nível/graduação para garantir que professor, aluno, polo e gestor leiam a mesma fonte.
- Paginação de atividades na home via query paginada (5 por página).
