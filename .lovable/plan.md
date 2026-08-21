# Cartão CNPJ com leitura real + Lovable e publicado falando a mesma língua

## O que eu verifiquei agora

- `src/lib/fornecedoresService.ts` → `parseCnpjCardOcr()` **não lê o arquivo**: espera 1,2s e devolve
  dados fixos ("FORNECEDOR DE TESTE LTDA", CNPJ 12.345.678/0001-99). Por isso o PDF real
  (FAVELALLOG TRANSPORTE E LOGISTICA LTDA) não aparece nos campos.
- O upload em `src/routes/fornecedor/cadastro.tsx` (linha 307) aceita `application/pdf,image/*`.
- O Dashboard do Gestor (`src/routes/_authenticated/gestor/index.tsx`) mistura banco com
  `localStorage` (`cufa_lancamentos_custom`, `cufa_compras_polo`, `cufa_deleted_lancamentos`,
  `cufa_alunos_cadastrados`). Isso explica "R$ 500,00 / 0.2% / Turmas 0" no publicado e
  "R$ 7.000,00 / 3.2% / Turmas 7" no Lovable: cada navegador tem seus próprios dados locais.

## Correções

### 1. Leitura real do Cartão CNPJ (só PDF)
- Upload passa a aceitar **apenas PDF** (`accept="application/pdf"`), com validação de tipo e
  mensagem clara se enviarem imagem.
- `parseCnpjCardOcr` deixa de ser simulada: o PDF vai para uma server function que envia o
  arquivo à IA da plataforma e extrai, em JSON estruturado: CNPJ, razão social, nome fantasia,
  data de abertura, porte, natureza jurídica, situação cadastral, CNAE principal (código +
  descrição), CNAEs secundários (lista), logradouro/número/bairro, CEP, município, UF,
  e-mail e telefone.
- Os campos do formulário são preenchidos com o que veio do PDF; campo ausente fica vazio
  (nada de valor fictício de exemplo).
- Erros de leitura mostram aviso real ("não foi possível ler o cartão, preencha manualmente")
  em vez de "analisado com sucesso".

### 2. Publicado x Lovable com os mesmos números
- Dashboard do Gestor passa a ler exclusivamente do banco: lançamentos, pedidos, turmas e alunos.
- Remoção da leitura/gravação de `cufa_lancamentos_custom`, `cufa_compras_polo`,
  `cufa_deleted_lancamentos` e `cufa_alunos_cadastrados` nessa tela; exclusão de lançamento
  passa a apagar no banco.
- Limpeza única do `localStorage` antigo no primeiro acesso após o deploy, para os dois
  ambientes começarem iguais.
- Após publicar, os cards (Valores utilizados, % orçamento, Turmas, Alunos) devem bater
  entre preview e link público, em qualquer navegador.

## Técnico

- Nova server function `parseCartaoCnpj` em `src/lib/fornecedores.functions.ts`: recebe o PDF em
  base64, chama o gateway de IA (`google/gemini-3.7-flash`) com bloco `file` + saída estruturada
  por schema Zod, e devolve o DTO já normalizado (CNPJ/CEP/telefone formatados).
- `parseCnpjCardOcr` vira um wrapper que chama essa função; o mock e os `if (fileName.includes(...))`
  são removidos.
- Dashboard do gestor consome os dados via `gestao.functions.ts` + TanStack Query
  (`refetchOnWindowFocus`), sem estado local persistido.

## Observação

O "Cadastro público de fornecedor" continua sem senha, como já está hoje — só a origem dos
dados muda.
