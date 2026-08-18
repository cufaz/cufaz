-- Migration: Polo Panel DB Tables (chamadas, chamada_itens, solicitacoes_professor, matriculas.atividade_id)
-- Order: CREATE -> GRANT -> ENABLE RLS -> POLICIES

-- 1. Table: chamadas
CREATE TABLE IF NOT EXISTS public.chamadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
    atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
    polo_id UUID NOT NULL REFERENCES public.polos(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES public.profiles(id),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(turma_id, data)
);

-- 2. Table: chamada_itens
CREATE TABLE IF NOT EXISTS public.chamada_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chamada_id UUID NOT NULL REFERENCES public.chamadas(id) ON DELETE CASCADE,
    matricula_id UUID REFERENCES public.matriculas(id) ON DELETE CASCADE,
    aluno_nome TEXT NOT NULL DEFAULT '',
    presente BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(chamada_id, matricula_id)
);

-- 3. Table: solicitacoes_professor
CREATE TABLE IF NOT EXISTS public.solicitacoes_professor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professor_id UUID REFERENCES public.profiles(id),
    professor_nome TEXT NOT NULL DEFAULT '',
    professor_email TEXT,
    atividade_id UUID NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
    turma_id UUID REFERENCES public.turmas(id) ON DELETE CASCADE,
    polo_id UUID NOT NULL REFERENCES public.polos(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente | aprovada | recusada
    decidido_por UUID REFERENCES public.profiles(id),
    decidido_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(professor_id, turma_id)
);

-- 4. Alter matriculas to add denormalized atividade_id
ALTER TABLE public.matriculas ADD COLUMN IF NOT EXISTS atividade_id UUID REFERENCES public.atividades(id);

-- 5. Indices for performance
CREATE INDEX IF NOT EXISTS idx_matriculas_turma_status ON public.matriculas(turma_id, status);
CREATE INDEX IF NOT EXISTS idx_chamada_itens_chamada ON public.chamada_itens(chamada_id);

-- 6. GRANTs (No anon access; authenticated & service_role)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamadas TO authenticated;
GRANT ALL ON public.chamadas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamada_itens TO authenticated;
GRANT ALL ON public.chamada_itens TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes_professor TO authenticated;
GRANT ALL ON public.solicitacoes_professor TO service_role;

-- 7. ENABLE RLS
ALTER TABLE public.chamadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamada_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_professor ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES
-- chamadas Policies
CREATE POLICY "Leitura de chamadas para gestor, polo ou professor"
ON public.chamadas FOR SELECT
TO authenticated
USING (
  public.is_gestor() 
  OR polo_id = public.meu_polo() 
  OR professor_id = auth.uid()
);

CREATE POLICY "Escrita de chamadas para professor, polo ou gestor"
ON public.chamadas FOR ALL
TO authenticated
USING (
  public.is_gestor() 
  OR polo_id = public.meu_polo() 
  OR professor_id = auth.uid()
);

-- chamada_itens Policies
CREATE POLICY "Leitura de chamada_itens para autenticados do polo ou gestor"
ON public.chamada_itens FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chamadas c
    WHERE c.id = chamada_itens.chamada_id
    AND (public.is_gestor() OR c.polo_id = public.meu_polo() OR c.professor_id = auth.uid())
  )
);

CREATE POLICY "Escrita de chamada_itens para autorizados da chamada"
ON public.chamada_itens FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chamadas c
    WHERE c.id = chamada_itens.chamada_id
    AND (public.is_gestor() OR c.polo_id = public.meu_polo() OR c.professor_id = auth.uid())
  )
);

-- solicitacoes_professor Policies
CREATE POLICY "Leitura de solicitacoes_professor para gestor, polo ou próprio professor"
ON public.solicitacoes_professor FOR SELECT
TO authenticated
USING (
  public.is_gestor() 
  OR polo_id = public.meu_polo() 
  OR professor_id = auth.uid()
);

CREATE POLICY "Inserção de solicitacoes_professor pelo próprio professor"
ON public.solicitacoes_professor FOR INSERT
TO authenticated
WITH CHECK (
  professor_id = auth.uid() OR public.is_gestor() OR polo_id = public.meu_polo()
);

CREATE POLICY "Update de solicitacoes_professor para gestor ou polo"
ON public.solicitacoes_professor FOR UPDATE
TO authenticated
USING (
  public.is_gestor() OR polo_id = public.meu_polo()
);
