-- Migration: Fornecedores Tables, Grants and RLS Policies
-- Ensures public registration of suppliers without permission denied errors.

-- 1. Table: fornecedores
CREATE TABLE IF NOT EXISTS public.fornecedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj TEXT NOT NULL UNIQUE,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    data_abertura TEXT,
    porte TEXT,
    natureza_juridica TEXT,
    situacao_cadastral TEXT,
    endereco TEXT,
    cidade TEXT DEFAULT 'Rio de Janeiro',
    uf TEXT DEFAULT 'RJ',
    cep TEXT,
    email TEXT,
    telefone TEXT,
    responsavel TEXT,
    cnae TEXT,
    cnae_principal_codigo TEXT,
    cnae_principal_descricao TEXT,
    cnae_secundarios JSONB,
    atividades_texto TEXT,
    categorias TEXT[],
    cartao_cnpj_url TEXT,
    banco_nome TEXT,
    banco_agencia TEXT,
    banco_conta TEXT,
    banco_pix TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    texto_nota_fiscal TEXT,
    codigo_tributacao TEXT,
    observacao_gestor TEXT,
    decidido_por TEXT,
    decidido_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: fornecedor_propostas
CREATE TABLE IF NOT EXISTS public.fornecedor_propostas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    valor NUMERIC(12,2) NOT NULL DEFAULT 0,
    prazo TEXT DEFAULT '15 dias',
    arquivo_url TEXT,
    status TEXT DEFAULT 'pendente',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Table: fornecedor_documentos
CREATE TABLE IF NOT EXISTS public.fornecedor_documentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    nome TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. GRANTs for Public & Authenticated Access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_propostas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_documentos TO anon, authenticated;
GRANT ALL ON public.fornecedores, public.fornecedor_propostas, public.fornecedor_documentos TO service_role;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor_propostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor_documentos ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- fornecedores policies
DROP POLICY IF EXISTS "Public e gestor inserem fornecedores" ON public.fornecedores;
CREATE POLICY "Public e gestor inserem fornecedores" ON public.fornecedores FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public e gestor leem fornecedores" ON public.fornecedores;
CREATE POLICY "Public e gestor leem fornecedores" ON public.fornecedores FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public e gestor atualizam fornecedores" ON public.fornecedores;
CREATE POLICY "Public e gestor atualizam fornecedores" ON public.fornecedores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- fornecedor_propostas policies
DROP POLICY IF EXISTS "Public e gestor inserem propostas" ON public.fornecedor_propostas;
CREATE POLICY "Public e gestor inserem propostas" ON public.fornecedor_propostas FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public e gestor leem propostas" ON public.fornecedor_propostas;
CREATE POLICY "Public e gestor leem propostas" ON public.fornecedor_propostas FOR SELECT TO anon, authenticated USING (true);

-- fornecedor_documentos policies
DROP POLICY IF EXISTS "Public e gestor inserem documentos" ON public.fornecedor_documentos;
CREATE POLICY "Public e gestor inserem documentos" ON public.fornecedor_documentos FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Public e gestor leem documentos" ON public.fornecedor_documentos;
CREATE POLICY "Public e gestor leem documentos" ON public.fornecedor_documentos FOR SELECT TO anon, authenticated USING (true);
