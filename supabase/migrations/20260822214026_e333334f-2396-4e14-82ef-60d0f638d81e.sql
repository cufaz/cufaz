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

DROP POLICY IF EXISTS "cartao cnpj insert publico" ON public.documentos_gestao;
CREATE POLICY "cartao cnpj insert publico"
ON public.documentos_gestao
FOR INSERT
TO anon, authenticated
WITH CHECK (setor = 'fornecedor' AND tipo = 'Cartão CNPJ');