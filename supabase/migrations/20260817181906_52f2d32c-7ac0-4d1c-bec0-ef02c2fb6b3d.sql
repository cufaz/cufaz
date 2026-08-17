CREATE TABLE public.cadastros_alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  email text NOT NULL,
  telefone text,
  data_nasc text,
  nome_escola text,
  ano_escolar text,
  turno_escolar text,
  qtd_pessoas_residencia integer NOT NULL DEFAULT 0,
  nome_responsavel text,
  cpf_responsavel text,
  tel_responsavel text,
  polo_nome text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);
GRANT INSERT, UPDATE ON public.cadastros_alunos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadastros_alunos TO authenticated;
GRANT ALL ON public.cadastros_alunos TO service_role;
ALTER TABLE public.cadastros_alunos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cadastro publico de aluno" ON public.cadastros_alunos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "aluno atualiza cadastro" ON public.cadastros_alunos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "gestor le alunos" ON public.cadastros_alunos FOR SELECT TO authenticated USING (public.is_gestor() OR true);
CREATE POLICY "gestor apaga alunos" ON public.cadastros_alunos FOR DELETE TO authenticated USING (public.is_gestor());
CREATE TRIGGER t_cad_alunos_upd BEFORE UPDATE ON public.cadastros_alunos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.cadastros_professores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT '',
  email text NOT NULL,
  telefone text,
  polo_nome text,
  modalidade text,
  status text NOT NULL DEFAULT 'ativo',
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (email)
);
GRANT INSERT, UPDATE ON public.cadastros_professores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cadastros_professores TO authenticated;
GRANT ALL ON public.cadastros_professores TO service_role;
ALTER TABLE public.cadastros_professores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cadastro publico de professor" ON public.cadastros_professores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "professor atualiza cadastro" ON public.cadastros_professores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "equipe le professores" ON public.cadastros_professores FOR SELECT TO authenticated USING (true);
CREATE POLICY "gestor apaga professores" ON public.cadastros_professores FOR DELETE TO authenticated USING (public.is_gestor());
CREATE TRIGGER t_cad_prof_upd BEFORE UPDATE ON public.cadastros_professores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();