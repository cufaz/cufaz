import { supabase } from "@/integrations/supabase/client";

export interface DiarioEntryDB {
  id?: string;
  aluno_email: string;
  aluno_nome: string;
  professor_id?: string | null;
  professor_nome: string;
  atividade_id?: string | null;
  atividade_nome: string;
  polo_nome: string;
  nivel: string;
  relato: string;
  data: string; // YYYY-MM-DD
  created_at?: string;
}

export async function fetchDiarioEntriesDB(filters?: {
  aluno_email?: string;
  professor_nome?: string;
  polo_nome?: string;
  atividade_nome?: string;
  data?: string;
}): Promise<DiarioEntryDB[]> {
  try {
    let query = supabase.from("diario_classe" as any).select("*");

    if (filters?.aluno_email) {
      query = query.eq("aluno_email", filters.aluno_email.toLowerCase());
    }
    if (filters?.polo_nome && filters.polo_nome !== "todos") {
      query = query.ilike("polo_nome", `%${filters.polo_nome}%`);
    }
    if (filters?.atividade_nome && filters.atividade_nome !== "todas") {
      query = query.ilike("atividade_nome", `%${filters.atividade_nome}%`);
    }
    if (filters?.data) {
      query = query.eq("data", filters.data);
    }

    const { data, error } = await query.order("data", { ascending: false }).order("created_at", { ascending: false });

    if (error || !data) {
      console.warn("Supabase query on diario_classe returned error or empty:", error?.message);
      return loadLocalDiarioEntries(filters);
    }

    return (data || []) as unknown as DiarioEntryDB[];
  } catch (err) {
    console.error("Error fetching diario_classe from DB:", err);
    return loadLocalDiarioEntries(filters);
  }
}

export async function saveDiarioEntryDB(entry: DiarioEntryDB): Promise<DiarioEntryDB | null> {
  const cleanEntry = {
    ...entry,
    aluno_email: entry.aluno_email.toLowerCase(),
    data: entry.data || new Date().toISOString().slice(0, 10),
  };

  try {
    const { data, error } = await supabase
      .from("diario_classe" as any)
      .insert(cleanEntry as any)
      .select("*")
      .single();

    if (error) {
      console.warn("Could not insert into diario_classe DB:", error.message);
    } else if (data) {
      window.dispatchEvent(new Event("cufa_diario_updated"));
      return (data as unknown) as DiarioEntryDB;
    }
  } catch (err) {
    console.error("Error inserting diario_classe into DB:", err);
  }

  // Fallback / local save
  saveLocalDiarioEntry(cleanEntry);
  window.dispatchEvent(new Event("cufa_diario_updated"));
  return cleanEntry;
}

export async function autoMigrateLocalDiario() {
  try {
    const stored = localStorage.getItem("cufa_diario_classe");
    if (!stored) return;

    const parsed = JSON.parse(stored);
    const list: any[] = Array.isArray(parsed) ? parsed : Object.values(parsed);

    if (list.length === 0) return;

    for (const item of list) {
      const entry: DiarioEntryDB = {
        aluno_email: (item.alunoEmail || item.aluno_email || "").toLowerCase(),
        aluno_nome: item.alunoNome || item.aluno_nome || "Aluno",
        professor_id: item.professorId || item.professor_id || null,
        professor_nome: item.professorNome || item.professor_nome || "Prof. Responsável",
        atividade_id: item.atividadeId || item.atividade_id || null,
        atividade_nome: item.modalidade || item.atividade_nome || "Jiu Jitsu",
        polo_nome: item.polo || item.polo_nome || "Complexo da Penha",
        nivel: item.nivelGraduacao || item.nivel || "Iniciante",
        relato: item.relato || "",
        data: item.dataAvaliacao || item.data || new Date().toISOString().slice(0, 10),
      };

      if (entry.aluno_email && entry.relato) {
        await supabase.from("diario_classe" as any).insert(entry as any);
      }
    }

    // Keep backup in history key and clear main legacy key
    localStorage.setItem("cufa_diario_classe_backup", stored);
    localStorage.removeItem("cufa_diario_classe");
  } catch (err) {
    console.warn("Auto migration of local diario failed:", err);
  }
}

// Local storage fallback helpers
function loadLocalDiarioEntries(filters?: {
  aluno_email?: string;
  polo_nome?: string;
  atividade_nome?: string;
  data?: string;
}): DiarioEntryDB[] {
  try {
    const stored = localStorage.getItem("cufa_diario_classe_list") || localStorage.getItem("cufa_diario_classe");
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    let list: any[] = Array.isArray(parsed) ? parsed : Object.values(parsed);

    let entries: DiarioEntryDB[] = list.map((item) => ({
      id: item.id || `local-${item.alunoEmail}-${item.dataAvaliacao}`,
      aluno_email: (item.alunoEmail || item.aluno_email || "").toLowerCase(),
      aluno_nome: item.alunoNome || item.aluno_nome || "Aluno",
      professor_id: item.professorId || item.professor_id || null,
      professor_nome: item.professorNome || item.professor_nome || "Prof. Responsável",
      atividade_id: item.atividadeId || item.atividade_id || null,
      atividade_nome: item.modalidade || item.atividade_nome || "Jiu Jitsu",
      polo_nome: item.polo || item.polo_nome || "Complexo da Penha",
      nivel: item.nivelGraduacao || item.nivel || "Iniciante",
      relato: item.relato || "",
      data: item.dataAvaliacao || item.data || new Date().toISOString().slice(0, 10),
      created_at: item.created_at || new Date().toISOString(),
    }));

    if (filters?.aluno_email) {
      entries = entries.filter((e) => e.aluno_email.toLowerCase() === filters.aluno_email?.toLowerCase());
    }
    if (filters?.polo_nome && filters.polo_nome !== "todos") {
      entries = entries.filter((e) => e.polo_nome.toLowerCase().includes(filters.polo_nome!.toLowerCase()));
    }
    if (filters?.atividade_nome && filters.atividade_nome !== "todas") {
      entries = entries.filter((e) => e.atividade_nome.toLowerCase() === filters.atividade_nome!.toLowerCase());
    }
    if (filters?.data) {
      entries = entries.filter((e) => e.data === filters.data);
    }

    return entries;
  } catch {
    return [];
  }
}

function saveLocalDiarioEntry(entry: DiarioEntryDB) {
  try {
    const stored = localStorage.getItem("cufa_diario_classe_list");
    let list: DiarioEntryDB[] = stored ? JSON.parse(stored) : [];
    list.unshift({ ...entry, id: entry.id || `local-${Date.now()}` });
    localStorage.setItem("cufa_diario_classe_list", JSON.stringify(list));
  } catch {}
}
