GRANT SELECT, INSERT ON public.fornecedores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;

GRANT SELECT ON public.polos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.polos TO authenticated;
GRANT ALL ON public.polos TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lancamentos_financeiros TO authenticated;
GRANT ALL ON public.lancamentos_financeiros TO service_role;

GRANT SELECT ON public.categorias_custo TO authenticated;
GRANT ALL ON public.categorias_custo TO service_role;

GRANT SELECT ON public.atividades TO authenticated;
GRANT ALL ON public.atividades TO service_role;

GRANT SELECT ON public.itens_orcamento TO authenticated;
GRANT ALL ON public.itens_orcamento TO service_role;