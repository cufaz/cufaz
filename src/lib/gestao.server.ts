import type { SupabaseClient } from "@supabase/supabase-js";

export function db(supabase: SupabaseClient): SupabaseClient {
  return supabase;
}

export async function assertGestor(supabase: SupabaseClient, userId: string) {
  if (!supabase || !userId || userId === "mock-gestor-user") {
    throw new Error("Sua sessão expirou. Entre novamente para continuar.");
  }
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "gestor",
  });
  if (error) throw new Error("Não foi possível validar o acesso do gestor.");
  if (!data) throw new Error("Este usuário não possui acesso de gestor.");
}

/** Bloqueia gravações quando não há sessão real de gestor (modo demonstração). */
export function assertGestorWrite(userId: string) {
  if (!userId || userId === "mock-gestor-user") {
    throw new Error(
      "Sessão expirada. Faça login como gestor (gestor@cufa.com.br) para salvar alterações.",
    );
  }
}

export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function competenciaAtual() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
