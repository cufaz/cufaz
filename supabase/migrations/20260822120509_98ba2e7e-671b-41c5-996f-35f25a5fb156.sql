CREATE POLICY "documentos upload publico" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'documentos');
CREATE POLICY "documentos leitura equipe" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documentos');
CREATE POLICY "documentos gestor apaga" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documentos' AND public.is_gestor());