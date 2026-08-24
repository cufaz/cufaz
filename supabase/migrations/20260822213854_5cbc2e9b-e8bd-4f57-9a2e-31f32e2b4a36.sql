GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos_financeiros TO authenticated;
GRANT ALL ON public.lancamentos_financeiros TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_custo TO authenticated;
GRANT ALL ON public.centros_custo TO service_role;

GRANT INSERT ON public.fornecedores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;

GRANT INSERT ON public.fornecedor_propostas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_propostas TO authenticated;
GRANT ALL ON public.fornecedor_propostas TO service_role;

GRANT INSERT ON public.fornecedor_documentos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_documentos TO authenticated;
GRANT ALL ON public.fornecedor_documentos TO service_role;

GRANT INSERT ON public.documentos_gestao TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos_gestao TO authenticated;
GRANT ALL ON public.documentos_gestao TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadastros_alunos TO anon, authenticated;
GRANT ALL ON public.cadastros_alunos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadastros_professores TO anon, authenticated;
GRANT ALL ON public.cadastros_professores TO service_role;