import type { SupabaseClient } from "@supabase/supabase-js";

export function db(supabase: SupabaseClient): SupabaseClient {
  return supabase;
}

export async function assertGestor(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "gestor",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito ao gestor.");
}

export function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

export function competenciaAtual() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
