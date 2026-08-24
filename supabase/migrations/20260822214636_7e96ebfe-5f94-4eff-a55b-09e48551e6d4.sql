REVOKE ALL ON public.lancamentos_financeiros FROM PUBLIC, anon;
REVOKE ALL ON public.centros_custo FROM PUBLIC, anon;
REVOKE ALL ON public.fornecedores FROM PUBLIC, anon;
REVOKE ALL ON public.fornecedor_propostas FROM PUBLIC, anon;
REVOKE ALL ON public.fornecedor_documentos FROM PUBLIC, anon;
REVOKE ALL ON public.documentos_gestao FROM PUBLIC, anon;
REVOKE ALL ON public.cadastros_alunos FROM PUBLIC, anon;
REVOKE ALL ON public.cadastros_professores FROM PUBLIC, anon;

GRANT INSERT ON public.fornecedores TO anon;
GRANT INSERT ON public.fornecedor_propostas TO anon;
GRANT INSERT ON public.fornecedor_documentos TO anon;
GRANT INSERT ON public.documentos_gestao TO anon;
GRANT INSERT ON public.cadastros_alunos TO anon;
GRANT INSERT ON public.cadastros_professores TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos_financeiros TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_custo TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_propostas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedor_documentos TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.documentos_gestao TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadastros_alunos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadastros_professores TO authenticated;

GRANT ALL ON public.lancamentos_financeiros, public.centros_custo, public.fornecedores, public.fornecedor_propostas, public.fornecedor_documentos, public.documentos_gestao, public.cadastros_alunos, public.cadastros_professores TO service_role;