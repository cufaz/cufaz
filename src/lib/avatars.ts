import { supabase } from "@/integrations/supabase/client";

const KEY = (email: string) => `cufa_perfil_foto_${email.toLowerCase()}`;

/** Reduz a imagem para no máximo 256px e devolve um data URL leve (JPEG). */
export function resizeImage(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagem inválida."));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(String(reader.result));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** Salva a foto no banco (única por e-mail) e mantém um cache local. */
export async function saveAvatar(
  email: string | null | undefined,
  dataUrl: string | null,
  tipo: "aluno" | "professor",
) {
  if (!email) return;
  const mail = email.toLowerCase();
  try {
    localStorage.removeItem("cufa_perfil_foto");
    if (dataUrl) localStorage.setItem(KEY(mail), dataUrl);
    else localStorage.removeItem(KEY(mail));
    window.dispatchEvent(new Event("cufa_perfil_foto_updated"));
  } catch {}

  const table = tipo === "aluno" ? "cadastros_alunos" : "cadastros_professores";
  try {
    await supabase.from(table).update({ avatar_url: dataUrl } as never).eq("email", mail);
  } catch {}
}

/** Cache local da foto (usado enquanto o banco não responde). */
export function getAvatarCache(email?: string | null): string | null {
  if (!email) return null;
  try {
    return localStorage.getItem(KEY(email));
  } catch {
    return null;
  }
}

/** Foto oficial do usuário: banco primeiro, cache local como reserva. */
export async function fetchAvatar(
  email: string | null | undefined,
  tipo: "aluno" | "professor",
): Promise<string | null> {
  if (!email) return null;
  const mail = email.toLowerCase();
  const table = tipo === "aluno" ? "cadastros_alunos" : "cadastros_professores";
  try {
    const { data } = await supabase
      .from(table)
      .select("avatar_url")
      .eq("email", mail)
      .maybeSingle();
    const url = (data as { avatar_url?: string | null } | null)?.avatar_url ?? null;
    if (url) {
      try {
        localStorage.setItem(KEY(mail), url);
      } catch {}
      return url;
    }
  } catch {}
  return getAvatarCache(mail);
}

/** Idade em anos a partir de uma data (YYYY-MM-DD ou DD/MM/YYYY). */
export function calcIdade(dataNasc?: string | null): number | null {
  if (!dataNasc) return null;
  let iso = dataNasc.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) {
    const [d, m, y] = iso.split("/");
    iso = `${y}-${m}-${d}`;
  }
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - dt.getFullYear();
  const mDiff = hoje.getMonth() - dt.getMonth();
  if (mDiff < 0 || (mDiff === 0 && hoje.getDate() < dt.getDate())) idade--;
  if (idade < 0 || idade > 120) return null;
  return idade;
}
