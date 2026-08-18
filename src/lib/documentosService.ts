import { supabase } from "@/integrations/supabase/client";

export interface DocumentoGestaoDB {
  id?: string;
  setor: "fornecedor" | "professor" | "aluno";
  entidade_id: string;
  entidade_nome: string;
  tipo: string; // e.g. "Cartão CNPJ", "NF de Serviço", "Contrato", "Autorização Responsável"
  nome: string;
  url: string;
  created_at?: string;
}

export async function fetchDocumentosGestaoDB(): Promise<DocumentoGestaoDB[]> {
  try {
    const { data, error } = await supabase
      .from("documentos_gestao" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return (data || []) as unknown as DocumentoGestaoDB[];
    }
  } catch {}

  return loadLocalDocumentosGestao();
}

export async function saveDocumentoGestaoDB(doc: Partial<DocumentoGestaoDB>): Promise<DocumentoGestaoDB | null> {
  const payload = {
    setor: doc.setor || "fornecedor",
    entidade_id: doc.entidade_id || "gen",
    entidade_nome: doc.entidade_nome || "Entidade",
    tipo: doc.tipo || "Documento",
    nome: doc.nome || "documento.pdf",
    url: doc.url || "#",
  };

  try {
    const { data, error } = await supabase
      .from("documentos_gestao" as any)
      .insert(payload as any)
      .select("*")
      .single();

    if (!error && data) {
      window.dispatchEvent(new Event("cufa_documentos_updated"));
      return data as unknown as DocumentoGestaoDB;
    }
  } catch {}

  const localDoc = { ...payload, id: `doc-${Date.now()}`, created_at: new Date().toISOString() };
  saveLocalDocumentoGestao(localDoc);
  window.dispatchEvent(new Event("cufa_documentos_updated"));
  return localDoc;
}

export async function deleteDocumentoGestaoDB(id: string): Promise<boolean> {
  try {
    await supabase.from("documentos_gestao" as any).delete().eq("id", id);
  } catch {}

  deleteLocalDocumentoGestao(id);
  window.dispatchEvent(new Event("cufa_documentos_updated"));
  return true;
}

function loadLocalDocumentosGestao(): DocumentoGestaoDB[] {
  try {
    const stored = localStorage.getItem("cufa_documentos_gestao");
    if (stored) return JSON.parse(stored);
  } catch {}
  return [
    {
      id: "doc-f-1",
      setor: "fornecedor",
      entidade_id: "f1",
      entidade_nome: "Favela Artes Gráfica e Editora LTDA",
      tipo: "Cartão CNPJ",
      nome: "cartao_cnpj_favela_artes.pdf",
      url: "#",
      created_at: "2026-08-10",
    },
    {
      id: "doc-f-2",
      setor: "fornecedor",
      entidade_id: "f1",
      entidade_nome: "Favela Artes Gráfica e Editora LTDA",
      tipo: "Proposta Comercial",
      nome: "proposta_fornecimento_grafico.pdf",
      url: "#",
      created_at: "2026-08-12",
    },
    {
      id: "doc-p-1",
      setor: "professor",
      entidade_id: "p1",
      entidade_nome: "Prof.ª Santana Silva",
      tipo: "Contrato de Prestação de Serviços",
      nome: "contrato_professor_santana_2026.pdf",
      url: "#",
      created_at: "2026-08-01",
    },
    {
      id: "doc-p-2",
      setor: "professor",
      entidade_id: "p1",
      entidade_nome: "Prof.ª Santana Silva",
      tipo: "NF de Serviço",
      nome: "nota_fiscal_servico_agosto_2026.pdf",
      url: "#",
      created_at: "2026-08-15",
    },
    {
      id: "doc-a-1",
      setor: "aluno",
      entidade_id: "a1",
      entidade_nome: "Enzo Junior",
      tipo: "Termo de Autorização Assinado",
      nome: "termo_autorizacao_enzo_junior.pdf",
      url: "#",
      created_at: "2026-08-05",
    },
    {
      id: "doc-a-2",
      setor: "aluno",
      entidade_id: "a1",
      entidade_nome: "Enzo Junior",
      tipo: "Comprovante de Residência",
      nome: "comprovante_residencia_enzo.pdf",
      url: "#",
      created_at: "2026-08-05",
    },
  ];
}

function saveLocalDocumentoGestao(doc: DocumentoGestaoDB) {
  try {
    let list = loadLocalDocumentosGestao();
    list.unshift(doc);
    localStorage.setItem("cufa_documentos_gestao", JSON.stringify(list));
  } catch {}
}

function deleteLocalDocumentoGestao(id: string) {
  try {
    let list = loadLocalDocumentosGestao();
    list = list.filter((d) => d.id !== id);
    localStorage.setItem("cufa_documentos_gestao", JSON.stringify(list));
  } catch {}
}
