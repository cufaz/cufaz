import type { SupabaseClient } from "@supabase/supabase-js";

export function db(supabase: SupabaseClient): SupabaseClient {
  return supabase;
}

export async function assertGestor(supabase: SupabaseClient, userId: string) {
  if (!supabase) return;
  if (!userId || userId === "mock-gestor-user") return;
  try {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "gestor",
    });
    if (data) return;
  } catch {}
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
