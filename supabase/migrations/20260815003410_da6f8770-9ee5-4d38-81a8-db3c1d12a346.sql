
CREATE TYPE public.app_role AS ENUM ('gestor','responsavel','professor','aluno');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL DEFAULT '',
  email text,
  telefone text,
  documento text,
  polo_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_gestor()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'gestor')
$$;

CREATE OR REPLACE FUNCTION public.meu_polo()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT polo_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, telefone, documento)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome',''), NEW.email,
          NEW.raw_user_meta_data->>'telefone', NEW.raw_user_meta_data->>'documento')
  ON CONFLICT (id) DO NOTHING;
  IF NEW.raw_user_meta_data->>'role' IN ('responsavel','professor','aluno') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::public.app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.polos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  cidade text NOT NULL,
  uf text NOT NULL,
  endereco text,
  perfil_tematico text,
  ponto_focal text,
  fotos_url text,
  vagas_totais integer NOT NULL DEFAULT 0,
  beneficiarios_projetados integer NOT NULL DEFAULT 0,
  orcamento_mensal numeric(12,2) NOT NULL DEFAULT 0,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD CONSTRAINT profiles_polo_fk FOREIGN KEY (polo_id) REFERENCES public.polos(id) ON DELETE SET NULL;

CREATE TABLE public.categorias_custo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  tipo text NOT NULL DEFAULT 'despesa',
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  polo_id uuid NOT NULL REFERENCES public.polos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  dias text,
  perfil_tematico text,
  vagas integer NOT NULL DEFAULT 0,
  beneficiarios_projetados integer NOT NULL DEFAULT 0,
  custo_mensal numeric(12,2) NOT NULL DEFAULT 0,
  professor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  imagem_url text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  nome text NOT NULL,
  turno text NOT NULL DEFAULT 'Manhã',
  horario text,
  vagas integer NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.itens_orcamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  categoria_id uuid REFERENCES public.categorias_custo(id) ON DELETE SET NULL,
  item text NOT NULL,
  descricao text,
  quantidade text,
  custo_mensal numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.matriculas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  aluno_nome text NOT NULL DEFAULT '',
  turma_id uuid NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ativa',
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.professores_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  atividade_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professor_id, atividade_id)
);

CREATE TABLE public.avaliacoes_professor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aluno_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  atividade_id uuid REFERENCES public.atividades(id) ON DELETE SET NULL,
  nota integer NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.pedidos_compra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  polo_id uuid NOT NULL REFERENCES public.polos(id) ON DELETE CASCADE,
  atividade_id uuid REFERENCES public.atividades(id) ON DELETE SET NULL,
  categoria_id uuid REFERENCES public.categorias_custo(id) ON DELETE SET NULL,
  solicitante_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  solicitante_nome text NOT NULL DEFAULT '',
  item text NOT NULL,
  descricao text,
  quantidade numeric(12,2) NOT NULL DEFAULT 1,
  valor_unitario numeric(12,2) NOT NULL DEFAULT 0,
  valor_total numeric(12,2) NOT NULL DEFAULT 0,
  justificativa text,
  competencia date NOT NULL DEFAULT date_trunc('month', now())::date,
  status text NOT NULL DEFAULT 'pendente',
  observacao_gestor text,
  decidido_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decidido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lancamentos_financeiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  polo_id uuid REFERENCES public.polos(id) ON DELETE CASCADE,
  atividade_id uuid REFERENCES public.atividades(id) ON DELETE SET NULL,
  categoria_id uuid REFERENCES public.categorias_custo(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'despesa',
  natureza text NOT NULL DEFAULT 'realizado',
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  competencia date NOT NULL DEFAULT date_trunc('month', now())::date,
  pedido_id uuid REFERENCES public.pedidos_compra(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER t_profiles_upd BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_polos_upd BEFORE UPDATE ON public.polos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_ativ_upd BEFORE UPDATE ON public.atividades FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_turmas_upd BEFORE UPDATE ON public.turmas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_itens_upd BEFORE UPDATE ON public.itens_orcamento FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_matr_upd BEFORE UPDATE ON public.matriculas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_ped_upd BEFORE UPDATE ON public.pedidos_compra FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER t_lanc_upd BEFORE UPDATE ON public.lancamentos_financeiros FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.polos, public.categorias_custo, public.atividades, public.turmas, public.itens_orcamento, public.matriculas, public.professores_atividades, public.avaliacoes_professor, public.pedidos_compra, public.lancamentos_financeiros TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.polos, public.atividades, public.turmas TO anon;
GRANT ALL ON public.profiles, public.user_roles, public.polos, public.categorias_custo, public.atividades, public.turmas, public.itens_orcamento, public.matriculas, public.professores_atividades, public.avaliacoes_professor, public.pedidos_compra, public.lancamentos_financeiros TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_professor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos_financeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perfil proprio leitura" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_gestor());
CREATE POLICY "perfil proprio update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_gestor()) WITH CHECK (id = auth.uid() OR public.is_gestor());
CREATE POLICY "gestor cria perfil" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid() OR public.is_gestor());
CREATE POLICY "gestor apaga perfil" ON public.profiles FOR DELETE TO authenticated USING (public.is_gestor());

CREATE POLICY "papeis proprios" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_gestor());

CREATE POLICY "polos publicos" ON public.polos FOR SELECT USING (true);
CREATE POLICY "gestor gerencia polos" ON public.polos FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());

CREATE POLICY "categorias leitura" ON public.categorias_custo FOR SELECT TO authenticated USING (true);
CREATE POLICY "gestor gerencia categorias" ON public.categorias_custo FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());

CREATE POLICY "atividades publicas" ON public.atividades FOR SELECT USING (true);
CREATE POLICY "gestor gerencia atividades" ON public.atividades FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());

CREATE POLICY "turmas publicas" ON public.turmas FOR SELECT USING (true);
CREATE POLICY "gestor gerencia turmas" ON public.turmas FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());

CREATE POLICY "itens leitura" ON public.itens_orcamento FOR SELECT TO authenticated USING (
  public.is_gestor() OR EXISTS (SELECT 1 FROM public.atividades a WHERE a.id = atividade_id AND a.polo_id = public.meu_polo())
);
CREATE POLICY "gestor gerencia itens" ON public.itens_orcamento FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());

CREATE POLICY "matriculas leitura" ON public.matriculas FOR SELECT TO authenticated USING (
  public.is_gestor() OR aluno_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.turmas t JOIN public.atividades a ON a.id = t.atividade_id
    WHERE t.id = turma_id AND (a.polo_id = public.meu_polo() OR a.professor_id = auth.uid())
  )
);
CREATE POLICY "gestor gerencia matriculas" ON public.matriculas FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());
CREATE POLICY "aluno cria matricula" ON public.matriculas FOR INSERT TO authenticated WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "vinculo professor leitura" ON public.professores_atividades FOR SELECT TO authenticated USING (public.is_gestor() OR professor_id = auth.uid());
CREATE POLICY "gestor gerencia vinculo" ON public.professores_atividades FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());

CREATE POLICY "avaliacoes leitura" ON public.avaliacoes_professor FOR SELECT TO authenticated USING (public.is_gestor() OR professor_id = auth.uid() OR aluno_id = auth.uid());
CREATE POLICY "aluno avalia" ON public.avaliacoes_professor FOR INSERT TO authenticated WITH CHECK (aluno_id = auth.uid());
CREATE POLICY "gestor gerencia avaliacoes" ON public.avaliacoes_professor FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());

CREATE POLICY "pedidos leitura" ON public.pedidos_compra FOR SELECT TO authenticated USING (public.is_gestor() OR solicitante_id = auth.uid() OR polo_id = public.meu_polo());
CREATE POLICY "responsavel cria pedido" ON public.pedidos_compra FOR INSERT TO authenticated WITH CHECK (solicitante_id = auth.uid() AND polo_id = public.meu_polo());
CREATE POLICY "gestor gerencia pedidos" ON public.pedidos_compra FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());

CREATE POLICY "financeiro leitura" ON public.lancamentos_financeiros FOR SELECT TO authenticated USING (public.is_gestor() OR polo_id = public.meu_polo());
CREATE POLICY "gestor gerencia financeiro" ON public.lancamentos_financeiros FOR ALL TO authenticated USING (public.is_gestor()) WITH CHECK (public.is_gestor());

INSERT INTO public.categorias_custo (nome, tipo, ordem) VALUES
 ('Pessoal','despesa',1),
 ('Encargos','despesa',2),
 ('Materiais','despesa',3),
 ('Materiais esportivos','despesa',4),
 ('Materiais / consumo','despesa',5),
 ('Materiais / Serviços','despesa',6),
 ('Materiais esportivos / Serviços','despesa',7),
 ('Infraestrutura','despesa',8),
 ('Comunicação','despesa',9),
 ('Divulgação','despesa',10),
 ('Serviços técnicos essenciais','despesa',11),
 ('Administrativo / RH essencial','despesa',12),
 ('Evento pedagógico','despesa',13),
 ('Evento pedagógico / esportivo','despesa',14),
 ('Outros','despesa',15),
 ('Extras','despesa',16),
 ('Repasse Amazon','receita',20),
 ('Doações','receita',21),
 ('Outras receitas','receita',22);

INSERT INTO public.polos (nome, slug, cidade, uf, endereco, perfil_tematico, ponto_focal, fotos_url, vagas_totais, beneficiarios_projetados, orcamento_mensal) VALUES
 ('Viaduto de Madureira','madureira','Rio de Janeiro','RJ','Rua Francisco Batista, 1 - Sob o Viaduto Negrão de Lima - Madureira - RJ','Formação esportiva e artesanato','Aline Góes / Renata Áthyna / Carlos Mello','https://www.instagram.com/cufario/',81,81,74301.77),
 ('Complexo da Penha','penha','Rio de Janeiro','RJ','Estrada José Rucas 1266 Vila Cruzeiro Penha - RJ','Educação e esporte','Alessandra Vieira','https://www.instagram.com/cufapenha/',150,150,109017.99),
 ('Paraisópolis','paraisopolis','São Paulo','SP','Rua Major José Marioto Ferreira, 120 - Paraisopolis - SP','Esporte e desenvolvimento comunitário','Fênix CUFA','https://www.instagram.com/cufaparaisopolissp/',30,30,34620.40);
