import { supabase } from "@/integrations/supabase/client";

export interface FornecedorDB {
  id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  email?: string | null;
  telefone?: string | null;
  responsavel?: string | null;
  cnae?: string | null;
  atividades_texto?: string | null;
  categorias?: string[];
  cartao_cnpj_url?: string | null;
  banco_nome?: string | null;
  banco_agencia?: string | null;
  banco_conta?: string | null;
  banco_pix?: string | null;
  status: "pendente" | "aprovado" | "reprovado";
  texto_nota_fiscal?: string | null;
  codigo_tributacao?: string | null;
  observacao_gestor?: string | null;
  decidido_por?: string | null;
  decidido_em?: string | null;
  created_at?: string;
}

export interface FornecedorPropostaDB {
  id?: string;
  fornecedor_id: string;
  titulo: string;
  descricao?: string | null;
  valor: number;
  prazo?: string | null;
  arquivo_url?: string | null;
  status?: string;
  created_at?: string;
}

export interface FornecedorDocumentoDB {
  id?: string;
  fornecedor_id: string;
  tipo: string;
  nome: string;
  url: string;
  created_at?: string;
}

// Categorization dictionary for AI categorization
const CATEGORIAS_PADRAO = [
  "Alimentação & Catering",
  "Material de Construção & Reforma",
  "Confecção, Moldes & Uniformes",
  "Material Esportivo & Equipamentos",
  "Impressão Gráfica & Comunicação Visual",
  "Tecnologia, TI & Licenças",
  "Transporte & Logística",
  "Serviços Gerais & Manutenção",
];

export function categorizeAtuacaoText(text: string): string[] {
  const clean = text.toLowerCase();
  const matched = new Set<string>();

  if (clean.includes("comida") || clean.includes("aliment") || clean.includes("marmita") || clean.includes("lanche") || clean.includes("catering") || clean.includes("refeicao")) {
    matched.add("Alimentação & Catering");
  }
  if (clean.includes("tinta") || clean.includes("cimento") || clean.includes("constru") || clean.includes("reforma") || clean.includes("eletric") || clean.includes("encan")) {
    matched.add("Material de Construção & Reforma");
  }
  if (clean.includes("costura") || clean.includes("tecido") || clean.includes("roupa") || clean.includes("kimono") || clean.includes("uniforme") || clean.includes("camis")) {
    matched.add("Confecção, Moldes & Uniformes");
  }
  if (clean.includes("bola") || clean.includes("tatame") || clean.includes("esport") || clean.includes("trofeu") || clean.includes("medalha") || clean.includes("rede")) {
    matched.add("Material Esportivo & Equipamentos");
  }
  if (clean.includes("grafic") || clean.includes("banner") || clean.includes("adesiv") || clean.includes("impress") || clean.includes("placa") || clean.includes("panfle")) {
    matched.add("Impressão Gráfica & Comunicação Visual");
  }
  if (clean.includes("computador") || clean.includes("site") || clean.includes("sistema") || clean.includes("internet") || clean.includes("ti") || clean.includes("software")) {
    matched.add("Tecnologia, TI & Licenças");
  }
  if (clean.includes("frete") || clean.includes("transporte") || clean.includes("van") || clean.includes("onibus") || clean.includes("viagem") || clean.includes("entrega")) {
    matched.add("Transporte & Logística");
  }

  if (matched.size === 0) {
    matched.add("Serviços Gerais & Manutenção");
  }

  return Array.from(matched);
}

// Simulated OCR / AI Extractor for Cartão CNPJ PDF/Image Upload
export async function parseCnpjCardOcr(file: File): Promise<{
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  cnae: string;
}> {
  // Simulate AI parsing delay
  await new Promise((r) => setTimeout(r, 1200));

  const fileName = file.name.toLowerCase();
  let cnpj = "12.345.678/0001-99";
  let razao = "FORNECEDOR DE TESTE LTDA";
  let fantasia = "SERVIÇOS PERIFÉRICOS CUFA";
  let end = "Avenida Brasil, nº 5000";
  let cid = "Rio de Janeiro";
  let ufStr = "RJ";
  let cepStr = "21040-361";
  let cnaeStr = "47.89-0-99 - Comércio varejista de outros produtos";

  if (fileName.includes("grafica") || fileName.includes("impressa")) {
    razao = "GRÁFICA E EDITORA FAVELA ARTES ME";
    fantasia = "FAVELA ARTES GRÁFICA";
    cnaeStr = "18.13-0-01 - Impressão de material para uso publicitário";
  } else if (fileName.includes("costura") || fileName.includes("textil")) {
    razao = "TEXTIL E CONFECÇÕES MADUREIRA LTDA";
    fantasia = "MADUREIRA TECIDOS";
    cnaeStr = "14.12-6-01 - Confecção de peças do vestuário";
  }

  return {
    cnpj,
    razao_social: razao,
    nome_fantasia: fantasia,
    endereco: end,
    cidade: cid,
    uf: ufStr,
    cep: cepStr,
    cnae: cnaeStr,
  };
}

export async function fetchFornecedoresDB(filters?: {
  status?: string;
  search?: string;
  categoria?: string;
  uf?: string;
}): Promise<FornecedorDB[]> {
  try {
    let query = supabase.from("fornecedores" as any).select("*");

    if (filters?.status && filters.status !== "todos") {
      query = query.eq("status", filters.status);
    }
    if (filters?.uf && filters.uf !== "todos") {
      query = query.eq("uf", filters.uf.toUpperCase());
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    let list = (data || []) as unknown as FornecedorDB[];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (f) =>
          f.razao_social?.toLowerCase().includes(q) ||
          f.cnpj?.includes(q) ||
          f.nome_fantasia?.toLowerCase().includes(q) ||
          f.responsavel?.toLowerCase().includes(q)
      );
    }

    if (filters?.categoria && filters.categoria !== "todas") {
      list = list.filter((f) => f.categorias?.includes(filters.categoria!));
    }

    return list;
  } catch (err) {
    console.error("fetchFornecedoresDB error:", err);
    return [];
  }
}

export async function fetchFornecedorByCnpjDB(cnpj: string): Promise<{
  fornecedor: FornecedorDB | null;
  propostas: FornecedorPropostaDB[];
  documentos: FornecedorDocumentoDB[];
}> {
  const cleanCnpj = cnpj.replace(/\D/g, "");

  try {
    const { data: fData } = await supabase
      .from("fornecedores" as any)
      .select("*")
      .ilike("cnpj", `%${cleanCnpj}%`)
      .maybeSingle();

    if (fData) {
      const f = fData as unknown as FornecedorDB;
      const { data: pData } = await supabase
        .from("fornecedor_propostas" as any)
        .select("*")
        .eq("fornecedor_id", f.id!);
      const { data: dData } = await supabase
        .from("fornecedor_documentos" as any)
        .select("*")
        .eq("fornecedor_id", f.id!);

      return {
        fornecedor: f,
        propostas: (pData || []) as unknown as FornecedorPropostaDB[],
        documentos: (dData || []) as unknown as FornecedorDocumentoDB[],
      };
    }
  } catch {}

  // Fallback to local storage
  const localF = loadLocalFornecedores().find((f) => f.cnpj.replace(/\D/g, "") === cleanCnpj);
  if (localF) {
    const propostas = loadLocalPropostas(localF.id!);
    const documentos = loadLocalDocumentos(localF.id!);
    return { fornecedor: localF, propostas, documentos };
  }

  return { fornecedor: null, propostas: [], documentos: [] };
}

export async function createFornecedorPublicDB(
  payload: Partial<FornecedorDB>,
  propostasInput: any[]
): Promise<FornecedorDB | null> {
  const categorias = categorizeAtuacaoText(payload.atividades_texto || "");
  const newFornecedor: FornecedorDB = {
    cnpj: payload.cnpj || "",
    razao_social: payload.razao_social || "",
    nome_fantasia: payload.nome_fantasia || "",
    endereco: payload.endereco || "",
    cidade: payload.cidade || "Rio de Janeiro",
    uf: payload.uf || "RJ",
    cep: payload.cep || "",
    email: payload.email || "",
    telefone: payload.telefone || "",
    responsavel: payload.responsavel || "",
    cnae: payload.cnae || "",
    atividades_texto: payload.atividades_texto || "",
    categorias,
    cartao_cnpj_url: payload.cartao_cnpj_url || null,
    banco_nome: payload.banco_nome || "",
    banco_agencia: payload.banco_agencia || "",
    banco_conta: payload.banco_conta || "",
    banco_pix: payload.banco_pix || "",
    status: "pendente",
  };

  try {
    const { data, error } = await supabase
      .from("fornecedores" as any)
      .insert(newFornecedor as any)
      .select("*")
      .single();

    if (data && !error) {
      const f = data as unknown as FornecedorDB;
      if (propostasInput && propostasInput.length > 0) {
        const propPayloads = propostasInput.map((p) => ({
          fornecedor_id: f.id!,
          titulo: p.titulo || "Proposta Comercial",
          descricao: p.descricao || "",
          valor: Number(p.valor || 0),
          prazo: p.prazo || "15 dias",
          arquivo_url: p.arquivo_url || null,
          status: "pendente",
        }));
        await supabase.from("fornecedor_propostas" as any).insert(propPayloads as any);
      }
      window.dispatchEvent(new Event("cufa_fornecedores_updated"));
      return f;
    }
  } catch (err) {
    console.warn("Public insert into fornecedores DB failed:", err);
  }

  // Local fallback save
  saveLocalFornecedor(newFornecedor, propostasInput);
  window.dispatchEvent(new Event("cufa_fornecedores_updated"));
  return newFornecedor;
}

export async function updateFornecedorStatusDB(
  id: string,
  status: "aprovado" | "reprovado",
  details: {
    texto_nota_fiscal: string;
    codigo_tributacao: string;
    observacao_gestor?: string;
  }
): Promise<boolean> {
  const updatePayload = {
    status,
    texto_nota_fiscal: details.texto_nota_fiscal,
    codigo_tributacao: details.codigo_tributacao,
    observacao_gestor: details.observacao_gestor || "",
    decidido_em: new Date().toISOString(),
    decidido_por: "Gestor CUFA",
  };

  try {
    const { error } = await supabase
      .from("fornecedores" as any)
      .update(updatePayload as any)
      .eq("id", id);

    if (!error) {
      window.dispatchEvent(new Event("cufa_fornecedores_updated"));
      return true;
    }
  } catch {}

  // Update local storage
  updateLocalFornecedorStatus(id, updatePayload);
  window.dispatchEvent(new Event("cufa_fornecedores_updated"));
  return true;
}

// Local Storage Fallback Helpers
function loadLocalFornecedores(filters?: { status?: string; uf?: string }): FornecedorDB[] {
  try {
    const stored = localStorage.getItem("cufa_fornecedores_list");
    if (!stored) return getDefaultInitialFornecedores();

    let list: FornecedorDB[] = JSON.parse(stored);
    if (filters?.status && filters.status !== "todos") {
      list = list.filter((f) => f.status === filters.status);
    }
    if (filters?.uf && filters.uf !== "todos") {
      list = list.filter((f) => f.uf === filters.uf);
    }
    return list;
  } catch {
    return getDefaultInitialFornecedores();
  }
}

function getDefaultInitialFornecedores(): FornecedorDB[] {
  return [];
}

function saveLocalFornecedor(f: FornecedorDB, propostas: any[]) {
  try {
    const stored = localStorage.getItem("cufa_fornecedores_list");
    let list: FornecedorDB[] = stored ? JSON.parse(stored) : [];
    const id = `f-${Date.now()}`;
    const entry = { ...f, id, created_at: new Date().toISOString().slice(0, 10) };
    list.unshift(entry);
    localStorage.setItem("cufa_fornecedores_list", JSON.stringify(list));

    if (propostas && propostas.length > 0) {
      localStorage.setItem(`cufa_fornecedor_propostas_${id}`, JSON.stringify(propostas));
    }
  } catch {}
}

function updateLocalFornecedorStatus(id: string, updatePayload: any) {
  try {
    const stored = localStorage.getItem("cufa_fornecedores_list");
    let list: FornecedorDB[] = stored ? JSON.parse(stored) : [];
    const idx = list.findIndex((f) => f.id === id);
    if (idx !== -1 && list[idx]) {
      list[idx] = { ...list[idx], ...updatePayload };
      localStorage.setItem("cufa_fornecedores_list", JSON.stringify(list));
    }
  } catch {}
}

function loadLocalPropostas(fornecedorId: string): FornecedorPropostaDB[] {
  try {
    const stored = localStorage.getItem(`cufa_fornecedor_propostas_${fornecedorId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function loadLocalDocumentos(fornecedorId: string): FornecedorDocumentoDB[] {
  try {
    const stored = localStorage.getItem(`cufa_fornecedor_documentos_${fornecedorId}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}
