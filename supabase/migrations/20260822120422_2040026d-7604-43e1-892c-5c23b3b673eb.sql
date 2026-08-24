CREATE TABLE public.fornecedores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text NOT NULL,
  razao_social text NOT NULL DEFAULT '',
  nome_fantasia text,
  data_abertura text,
  porte text,
  natureza_juridica text,
  situacao_cadastral text,
  endereco text,
  cidade text,
  uf text,
  cep text,
  email text,
  telefone text,
  responsavel text,
  cnae text,
  cnae_principal_codigo text,
  cnae_principal_descricao text,
  cnae_secundarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  atividades_texto text,
  categorias text[] NOT NULL DEFAULT '{}',
  cartao_cnpj_url text,
  banco_nome text,
  banco_agencia text,
  banco_conta text,
  banco_pix text,
  status text NOT NULL DEFAULT 'pendente',
  texto_nota_fiscal text,
  codigo_tributacao text,
  observacao_gestor text,
  decidido_por text,
  decidido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.fornecedores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cadastro publico de fornecedor" ON public.fornecedores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "fornecedores leitura" ON public.fornecedores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gestor gerencia fornecedores" ON public.fornecedores FOR UPDATE TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());
CREATE POLICY "gestor apaga fornecedores" ON public.fornecedores FOR DELETE TO authenticated USING (public.is_gestor());
CREATE TRIGGER t_fornecedores_upd BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.fornecedor_propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  titulo text NOT NULL DEFAULT 'Proposta Comercial',
  descricao text,
  valor numeric NOT NULL DEFAULT 0,
  prazo text,
  arquivo_url text,
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.fornecedor_propostas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_propostas TO authenticated;
GRANT ALL ON public.fornecedor_propostas TO service_role;
ALTER TABLE public.fornecedor_propostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "propostas insert publico" ON public.fornecedor_propostas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "propostas leitura" ON public.fornecedor_propostas FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gestor gerencia propostas" ON public.fornecedor_propostas FOR UPDATE TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());
CREATE POLICY "gestor apaga propostas" ON public.fornecedor_propostas FOR DELETE TO authenticated USING (public.is_gestor());

CREATE TABLE public.fornecedor_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor_id uuid NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'Documento',
  nome text NOT NULL DEFAULT 'documento.pdf',
  url text NOT NULL DEFAULT '#',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.fornecedor_documentos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_documentos TO authenticated;
GRANT ALL ON public.fornecedor_documentos TO service_role;
ALTER TABLE public.fornecedor_documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documentos fornecedor insert publico" ON public.fornecedor_documentos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "documentos fornecedor leitura" ON public.fornecedor_documentos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "gestor apaga documentos fornecedor" ON public.fornecedor_documentos FOR DELETE TO authenticated USING (public.is_gestor());

CREATE TABLE public.centros_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL,
  nome text NOT NULL,
  setor text,
  responsavel text,
  descricao text,
  orcamento_mensal numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_custo TO authenticated;
GRANT ALL ON public.centros_custo TO service_role;
ALTER TABLE public.centros_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "centros custo leitura" ON public.centros_custo FOR SELECT TO authenticated USING (true);
CREATE POLICY "gestor gerencia centros custo" ON public.centros_custo FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());
CREATE TRIGGER t_centros_custo_upd BEFORE UPDATE ON public.centros_custo FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.documentos_gestao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setor text NOT NULL DEFAULT 'fornecedor',
  entidade_id text NOT NULL DEFAULT '',
  entidade_nome text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'Documento',
  nome text NOT NULL DEFAULT 'documento.pdf',
  url text NOT NULL DEFAULT '#',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.documentos_gestao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos_gestao TO authenticated;
GRANT ALL ON public.documentos_gestao TO service_role;
ALTER TABLE public.documentos_gestao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documentos gestao insert" ON public.documentos_gestao FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "documentos gestao leitura" ON public.documentos_gestao FOR SELECT TO authenticated USING (true);
CREATE POLICY "gestor apaga documentos gestao" ON public.documentos_gestao FOR DELETE TO authenticated USING (public.is_gestor());

ALTER TABLE public.lancamentos_financeiros ADD COLUMN IF NOT EXISTS centro_custo_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL;
ALTER TABLE public.pedidos_compra ADD COLUMN IF NOT EXISTS centro_custo_id uuid REFERENCES public.centros_custo(id) ON DELETE SET NULL;