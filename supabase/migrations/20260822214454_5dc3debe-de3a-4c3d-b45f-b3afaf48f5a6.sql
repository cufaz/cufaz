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
GRANT SELECT, INSERT, DELETE ON public.documentos_gestao TO authenticated;
GRANT ALL ON public.documentos_gestao TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadastros_alunos TO anon, authenticated;
GRANT ALL ON public.cadastros_alunos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadastros_professores TO anon, authenticated;
GRANT ALL ON public.cadastros_professores TO service_role;

GRANT SELECT ON public.polos, public.categorias_custo, public.atividades, public.itens_orcamento TO authenticated;
GRANT ALL ON public.polos, public.categorias_custo, public.atividades, public.itens_orcamento TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lancamentos_financeiros') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lancamentos_financeiros;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'centros_custo') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.centros_custo;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'fornecedores') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.fornecedores;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cadastros_alunos') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cadastros_alunos;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'cadastros_professores') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cadastros_professores;
  END IF;
END $$;