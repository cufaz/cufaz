import { supabase } from "@/integrations/supabase/client";

type CachedRole = { userId: string; role: string; allowed: boolean; at: number };

let roleCache: CachedRole | null = null;
const ROLE_TTL = 5 * 60_000;

/** Fast local session read (no network round-trip). */
export async function getCachedUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

/** Role check cached per user for a few minutes to keep navigation instant. */
export async function hasRoleCached(userId: string, role: string) {
  const now = Date.now();
  if (
    roleCache &&
    roleCache.userId === userId &&
    roleCache.role === role &&
    now - roleCache.at < ROLE_TTL
  ) {
    return roleCache.allowed;
  }

  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: role as never,
  });
  const allowed = !error && Boolean(data);
  roleCache = { userId, role, allowed, at: now };
  return allowed;
}

export function clearRoleCache() {
  roleCache = null;
}
