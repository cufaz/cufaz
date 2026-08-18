# Alinhar o sistema aos dados reais (polos, atividades, pedidos, fotos, presença)

## Diagnóstico (verificado no banco e no código)

- O banco tem **3 polos**: Complexo da Penha, Viaduto de Madureira, Paraisópolis. "Cidade de Deus" e "Polo de Teste" **não existem no banco** — são listas fixas de exemplo dentro do código (`src/lib/gestao.functions.ts`), usadas como "plano B" quando a leitura falha. Por isso as listas suspensas mostram 4 ou 5 polos e a tela de Polos mostra 4.
- Os números divergentes (vagas/beneficiários "undefined", orçamento R$ 64.800 vs R$ 74.301,77) vêm dessas mesmas listas de exemplo, com nomes de campos diferentes dos do banco.
- **Pedidos de compra: a tabela do banco está vazia (0 registros).** O pedido pendente que aparecia nunca chegou ao banco — pedidos são gravados só no navegador (`localStorage`). Trocar de navegador, limpar dados ou entrar em outro dispositivo faz o pedido "sumir". Não foi apagado por ninguém.
- Fotos de perfil também vivem só no navegador. A chave antiga era global (`cufa_perfil_foto`), o que fazia a foto de um usuário aparecer para outro; hoje há chave por e-mail, mas o resto do sistema ainda lê caminhos antigos em vários lugares.
- A presença no painel do responsável é fixa: o código devolve "100%" se existir qualquer chamada ou aluno, senão "0%" — não é cálculo real.

## O que será feito

### 1. Polo como fonte única
- Remover todas as listas fixas de polos/atividades/lançamentos do código. Sem polo inventado em lugar nenhum.
- Criar um seletor único de polos, alimentado pelo banco, usado em Dashboard, Polos, Atividades, Financeiro, Pedidos, Alunos, Professores, Diário e cadastro público.
- Corrigir os campos exibidos na tela de Polos (vagas, beneficiários, UF) para os nomes reais do banco — acabam os "undefined".
- Se a leitura falhar, a tela mostra erro/estado vazio em vez de dados fictícios.

### 2. Atividades
- A tela de Atividades passa a listar **todas** as atividades de todos os polos (7 hoje) direto do banco, com beneficiários e custo/mês reais.
- Adicionar filtro de lista suspensa por atividade/modalidade, junto dos filtros de polo e período.

### 3. Pedidos de compra passam a ser reais
- Gravar pedido, aprovação, reprovação e exclusão na tabela do banco (`pedidos_compra`), não no navegador.
- Migrar automaticamente, na primeira abertura, os pedidos que ainda estiverem salvos no navegador do usuário, para não perder o histórico existente.
- Pedido aprovado continua virando despesa realizada no financeiro.

### 4. Fotos de perfil (correção definitiva)
- Criar um bucket de arquivos no backend para avatares; a foto passa a ser gravada no servidor, vinculada ao usuário/cadastro, e lida sempre pelo mesmo identificador.
- Remover as chaves globais antigas do navegador e o cache compartilhado que causava a troca de fotos entre pessoas.
- Um único componente de avatar em todo o sistema (gestor, responsável, professor, aluno).

### 5. Presença real
- Calcular a taxa de presença a partir das chamadas registradas: presenças ÷ (presenças + faltas) no período, por oficina e no total do polo. Sem chamada no período, mostrar "—" em vez de 0%/100%.

### 6. Alunos do polo — coluna Detalhes
- Nova coluna "Detalhes" com botão **Analisar**, abrindo painel com dados do aluno: contato, responsável legal, escola, oficinas/turmas, matrícula e histórico de presença.

### 7. Galeria de fotos
- Item continua no menu, marcado como **Em breve**, desabilitado e sem acesso à tela.

## Detalhes técnicos

- Excluir `defaultPolos`, `defaultAtividades`, `defaultPolosFinanceiro`, `defaultLancamentos` e afins de `src/lib/gestao.functions.ts`; os handlers passam a propagar erro em vez de devolver mock.
- Hook único `usePolos()` em `src/lib/cadastros.ts` (TanStack Query, chave `["polos"]`), consumido por `PoloMultiSelect` e por todos os selects.
- Novas server functions para pedidos (`criarPedido`, `decidirPedido`, `deletePedido`, `listarPedidos`) com `requireSupabaseAuth`; migração pontual do `localStorage` (`cufa_compras_polo`) para o banco.
- Bucket `avatars` no Storage com políticas por usuário; coluna `avatar_url` já existente em `cadastros_alunos`/`cadastros_professores` passa a guardar a URL pública.
- Presença calculada sobre os registros de chamada; ausência de dados retorna `null` tratado na UI.

## Prompt para o Antigravity

Ao final da implementação eu entrego, na conversa, um prompt em texto único descrevendo esses sete ajustes para você colar no Antigravity.
