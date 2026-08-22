import { supabase } from "@/integrations/supabase/client";

export interface CnaeItem {
  codigo: string;
  descricao: string;
}

export interface FornecedorDB {
  id?: string;
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string | null;
  data_abertura?: string | null;
  porte?: string | null;
  natureza_juridica?: string | null;
  situacao_cadastral?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  uf?: string | null;
  cep?: string | null;
  email?: string | null;
  telefone?: string | null;
  responsavel?: string | null;
  cnae?: string | null;
  cnae_principal_codigo?: string | null;
  cnae_principal_descricao?: string | null;
  cnae_secundarios?: CnaeItem[] | null;
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

export interface OcrCartaoCnpjResult {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  data_abertura: string;
  porte: string;
  natureza_juridica: string;
  situacao_cadastral: string;
  cnae_principal_codigo: string;
  cnae_principal_descricao: string;
  cnae_secundarios: CnaeItem[];
  endereco: string;
  cidade: string;
  uf: string;
  cep: string;
  cnae: string;
}

// Real AI extraction of the Cartão CNPJ (PDF only)
export async function parseCnpjCardOcr(file: File): Promise<OcrCartaoCnpjResult> {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Envie o Cartão CNPJ em PDF.");
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const base64 = btoa(binary);

  const { parseCartaoCnpj } = await import("./fornecedores.functions");
  const result = await parseCartaoCnpj({ data: { fileName: file.name, fileData: base64 } });
  return result as OcrCartaoCnpjResult;
}


export async function fetchFornecedoresDB(filters?: {
  status?: string;
  search?: string;
  categoria?: string;
  uf?: string;
}): Promise<FornecedorDB[]> {
  let query = supabase.from("fornecedores" as any).select("*");

  if (filters?.status && filters.status !== "todos") {
    query = query.eq("status", filters.status);
  }
  if (filters?.uf && filters.uf !== "todos") {
    query = query.eq("uf", filters.uf.toUpperCase());
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error(`Não foi possível carregar os fornecedores: ${error.message}`);

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
    const categoria = filters.categoria;
    list = list.filter((f) => f.categorias?.includes(categoria));
  }

  return list;
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

  return { fornecedor: null, propostas: [], documentos: [] };
}

// ---- Storage helpers (bucket privado "documentos") ----
export async function uploadDocumentoArquivo(file: File, pasta: string): Promise<string | null> {
  try {
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${pasta}/${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from("documentos").upload(path, file, {
      upsert: false,
      contentType: file.type || "application/pdf",
    });
    if (error) {
      console.warn("Falha no upload do documento:", error.message);
      return null;
    }
    return path;
  } catch (err) {
    console.warn("Falha no upload do documento:", err);
    return null;
  }
}

export async function getDocumentoUrl(path: string): Promise<string | null> {
  if (!path || path === "#") return null;
  if (path.startsWith("http")) return path;
  try {
    const { data } = await supabase.storage.from("documentos").createSignedUrl(path, 60 * 10);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}

export async function abrirDocumento(path: string): Promise<boolean> {
  const url = await getDocumentoUrl(path);
  if (!url) return false;
  window.open(url, "_blank", "noopener");
  return true;
}

export async function createFornecedorPublicDB(
  payload: Partial<FornecedorDB>,
  propostasInput: any[],
  cartaoCnpjFile?: File | null
): Promise<FornecedorDB | null> {
  const categorias = categorizeAtuacaoText(payload.atividades_texto || "");

  let cartaoPath = payload.cartao_cnpj_url || null;
  if (cartaoCnpjFile) {
    cartaoPath = (await uploadDocumentoArquivo(cartaoCnpjFile, "fornecedores")) || cartaoPath;
  }

  const newFornecedor: FornecedorDB = {
    cnpj: payload.cnpj || "",
    razao_social: payload.razao_social || "",
    nome_fantasia: payload.nome_fantasia || "",
    data_abertura: payload.data_abertura || null,
    porte: payload.porte || null,
    natureza_juridica: payload.natureza_juridica || null,
    situacao_cadastral: payload.situacao_cadastral || null,
    cnae_principal_codigo: payload.cnae_principal_codigo || null,
    cnae_principal_descricao: payload.cnae_principal_descricao || null,
    cnae_secundarios: payload.cnae_secundarios || [],
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
    cartao_cnpj_url: cartaoPath,
    banco_nome: payload.banco_nome || "",
    banco_agencia: payload.banco_agencia || "",
    banco_conta: payload.banco_conta || "",
    banco_pix: payload.banco_pix || "",
    status: "pendente",
  };

  const { data, error } = await supabase
    .from("fornecedores" as any)
    .insert(newFornecedor as any)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Erro ao cadastrar fornecedor:", error);
    throw new Error(error?.message || "Não foi possível salvar o cadastro do fornecedor.");
  }

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

  if (cartaoPath && cartaoCnpjFile) {
    const docPayload = {
      tipo: "Cartão CNPJ",
      nome: cartaoCnpjFile.name,
      url: cartaoPath,
    };
    await supabase
      .from("fornecedor_documentos" as any)
      .insert({ fornecedor_id: f.id!, ...docPayload } as any);
    await supabase.from("documentos_gestao" as any).insert({
      setor: "fornecedor",
      entidade_id: f.id!,
      entidade_nome: f.razao_social,
      ...docPayload,
    } as any);
  }

  window.dispatchEvent(new Event("cufa_fornecedores_updated"));
  window.dispatchEvent(new Event("cufa_documentos_updated"));
  return f;
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

  const { error } = await supabase
    .from("fornecedores" as any)
    .update(updatePayload as any)
    .eq("id", id);
  if (error) throw new Error(`Não foi possível atualizar o fornecedor: ${error.message}`);
  window.dispatchEvent(new Event("cufa_fornecedores_updated"));
  return true;
}

