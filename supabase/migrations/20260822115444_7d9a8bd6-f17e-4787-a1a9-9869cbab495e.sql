ALTER TABLE public.atividades
  ADD COLUMN IF NOT EXISTS data_inicio_matricula date,
  ADD COLUMN IF NOT EXISTS data_fim_matricula date,
  ADD COLUMN IF NOT EXISTS data_inicio_atividade date,
  ADD COLUMN IF NOT EXISTS data_fim_atividade date,
  ADD COLUMN IF NOT EXISTS rascunho boolean NOT NULL DEFAULT false;

ALTER TABLE public.polos
  ADD COLUMN IF NOT EXISTS rascunho boolean NOT NULL DEFAULT false;

ALTER TABLE public.cadastros_alunos
  ADD COLUMN IF NOT EXISTS turma_nome text,
  ADD COLUMN IF NOT EXISTS modalidade text,
  ADD COLUMN IF NOT EXISTS cidade text,
  ADD COLUMN IF NOT EXISTS uf text,
  ADD COLUMN IF NOT EXISTS bairro text;