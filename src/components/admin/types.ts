export interface Polo {
  id: string;
  nome: string;
  slug: string;
  cidade: string;
  uf: string;
  endereco: string;
  perfilTematico: string;
  pontoFocal: string;
  vagasTotais: number;
  beneficiariosProjetados: number;
  orcamentoMensal: number;
  ativo: boolean;
  fotosSpaceLink?: string;
}

export interface Lancamento {
  id: string;
  tipo: "receita" | "despesa";
  valor: number;
  descricao: string;
  categoria: string;
  poloId: string; // "todos" or specific polo ID
  data: string; // YYYY-MM-DD
}

export interface CategoriaDespesa {
  nome: string;
  previsto: number;
}
