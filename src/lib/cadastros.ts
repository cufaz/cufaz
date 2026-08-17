import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/* Polos — fonte única de verdade (banco)                              */
/* ------------------------------------------------------------------ */

export interface PoloOpt {
  id: string;
  nome: string;
  slug: string;
  cidade?: string;
  uf?: string;
}

export async function fetchPolos(): Promise<PoloOpt[]> {
  const { data, error } = await supabase
    .from("polos")
    .select("id, nome, slug, cidade, uf, ativo")
    .eq("ativo", true)
    .order("nome");
  if (error || !data) return [];
  return data as unknown as PoloOpt[];
}

/** Lista de polos realmente cadastrados no sistema. */
export function usePolosCadastrados() {
  const [polos, setPolos] = useState<PoloOpt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchPolos()
      .then((list) => {
        if (alive) setPolos(list);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { polos, loading };
}

/* ------------------------------------------------------------------ */
/* Avatares — sempre por e-mail (nunca chave global compartilhada)     */
/* ------------------------------------------------------------------ */

export function getAvatarLocal(email?: string | null): string | null {
  if (!email) return null;
  try {
    return localStorage.getItem(`cufa_perfil_foto_${email.toLowerCase()}`);
  } catch {
    return null;
  }
}

export function setAvatarLocal(email: string | null | undefined, dataUrl: string | null) {
  if (!email) return;
  const key = `cufa_perfil_foto_${email.toLowerCase()}`;
  try {
    // Remove a chave global antiga, causa de fotos trocadas entre usuários.
    localStorage.removeItem("cufa_perfil_foto");
    if (dataUrl) localStorage.setItem(key, dataUrl);
    else localStorage.removeItem(key);
    window.dispatchEvent(new Event("cufa_perfil_foto_updated"));
  } catch {}
}

/* ------------------------------------------------------------------ */
/* Cadastros persistidos no banco                                      */
/* ------------------------------------------------------------------ */

export interface AlunoCadastro {
  id?: string;
  nome: string;
  email: string;
  telefone?: string | null;
  data_nasc?: string | null;
  nome_escola?: string | null;
  ano_escolar?: string | null;
  turno_escolar?: string | null;
  qtd_pessoas_residencia?: number | null;
  nome_responsavel?: string | null;
  cpf_responsavel?: string | null;
  tel_responsavel?: string | null;
  polo_nome?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export interface ProfessorCadastro {
  id?: string;
  nome: string;
  email: string;
  telefone?: string | null;
  polo_nome?: string | null;
  modalidade?: string | null;
  status?: string | null;
  avatar_url?: string | null;
  created_at?: string;
}

export async function upsertAlunoCadastro(aluno: AlunoCadastro) {
  const payload = { ...aluno, email: aluno.email.toLowerCase() };
  const { error } = await supabase
    .from("cadastros_alunos")
    .upsert(payload as never, { onConflict: "email" });
  if (error) throw new Error(error.message);
}

export async function upsertProfessorCadastro(prof: ProfessorCadastro) {
  const payload = { ...prof, email: prof.email.toLowerCase() };
  const { error } = await supabase
    .from("cadastros_professores")
    .upsert(payload as never, { onConflict: "email" });
  if (error) throw new Error(error.message);
}

export async function fetchAlunosCadastro(): Promise<AlunoCadastro[]> {
  const { data, error } = await supabase
    .from("cadastros_alunos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as AlunoCadastro[];
}

export async function fetchProfessoresCadastro(): Promise<ProfessorCadastro[]> {
  const { data, error } = await supabase
    .from("cadastros_professores")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as ProfessorCadastro[];
}

export async function deleteAlunoCadastro(email: string) {
  await supabase.from("cadastros_alunos").delete().eq("email", email.toLowerCase());
}

export async function deleteProfessorCadastro(email: string) {
  await supabase.from("cadastros_professores").delete().eq("email", email.toLowerCase());
}
