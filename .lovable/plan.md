# Contabilidade, Fornecedores, Centro de Custo e ações no Financeiro

Prompt técnico entregue no chat. Caso queira que eu mesmo implemente, o escopo seria:

## 1. Financeiro — ações no realizado
Menu de três pontinhos em cada valor da coluna "Realizado" com Editar e Excluir. A exclusão remove o lançamento do banco e recalcula totais, resumo, variação previsto x realizado, PDF e Excel.

## 2. Nova seção Contabilidade (entre Financeiro e Gestores)
Visão geral com indicadores e gráficos, e submenu: Fornecedores, Centro de Custo, Gestão de Documentos. Badge contador de cadastros pendentes.

## 3. Fornecedores
- Formulário público sem senha, com upload do Cartão CNPJ e extração automática dos dados.
- Campos de atuação/fornecimento com categorização automática (empresas equivalentes agrupadas na mesma categoria).
- Propostas ilimitadas com anexos.
- Item "Fornecedor" no menu do site após "Credenciado": consulta por CNPJ mostra status e os textos definidos pelo gestor.
- Tela do gestor com aprovar/reprovar; ao aprovar, gestor informa o texto do corpo da nota fiscal e o código de tributação.

## 4. Centro de Custo
CRUD com cards, indicadores e filtros. Campo de centro de custo no modal de item do orçamento e no modal de novo pedido, junto com lista suspensa de atividades do polo selecionado.

## 5. Gestão de Documentos
Menu suspenso por setor (Fornecedor, Professor, Aluno) listando documentos, propostas, cartão CNPJ, contratos e NFs, com upload seguro.

## Técnico
Tabelas novas: `fornecedores`, `fornecedor_propostas`, `fornecedor_documentos`, `centros_custo`, e coluna `centro_custo_id` em `itens_orcamento`, `pedidos_compra` e `lancamentos_financeiros` — todas com GRANT e RLS na mesma migration. Escritas via `createServerFn` com `requireSupabaseAuth` e checagem de gestor. Buckets privados para documentos.
