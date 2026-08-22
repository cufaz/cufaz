REVOKE SELECT ON public.fornecedores FROM anon;
DROP POLICY IF EXISTS "fornecedores leitura" ON public.fornecedores;
CREATE POLICY "gestor le fornecedores"
ON public.fornecedores FOR SELECT TO authenticated
USING (public.is_gestor());

REVOKE SELECT ON public.fornecedor_propostas FROM anon;
DROP POLICY IF EXISTS "propostas leitura" ON public.fornecedor_propostas;
CREATE POLICY "gestor le propostas"
ON public.fornecedor_propostas FOR SELECT TO authenticated
USING (public.is_gestor());

REVOKE SELECT ON public.fornecedor_documentos FROM anon;
DROP POLICY IF EXISTS "documentos fornecedor leitura" ON public.fornecedor_documentos;
CREATE POLICY "gestor le documentos fornecedor"
ON public.fornecedor_documentos FOR SELECT TO authenticated
USING (public.is_gestor());

REVOKE INSERT ON public.documentos_gestao FROM anon;
DROP POLICY IF EXISTS "documentos gestao insert" ON public.documentos_gestao;
CREATE POLICY "gestor insere documentos gestao"
ON public.documentos_gestao FOR INSERT TO authenticated
WITH CHECK (public.is_gestor());