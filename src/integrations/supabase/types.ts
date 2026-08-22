export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      atividades: {
        Row: {
          ativo: boolean
          beneficiarios_projetados: number
          created_at: string
          custo_mensal: number
          data_fim_atividade: string | null
          data_fim_matricula: string | null
          data_inicio_atividade: string | null
          data_inicio_matricula: string | null
          descricao: string | null
          dias: string | null
          id: string
          imagem_url: string | null
          nome: string
          perfil_tematico: string | null
          polo_id: string
          professor_id: string | null
          rascunho: boolean
          slug: string
          updated_at: string
          vagas: number
        }
        Insert: {
          ativo?: boolean
          beneficiarios_projetados?: number
          created_at?: string
          custo_mensal?: number
          data_fim_atividade?: string | null
          data_fim_matricula?: string | null
          data_inicio_atividade?: string | null
          data_inicio_matricula?: string | null
          descricao?: string | null
          dias?: string | null
          id?: string
          imagem_url?: string | null
          nome: string
          perfil_tematico?: string | null
          polo_id: string
          professor_id?: string | null
          rascunho?: boolean
          slug: string
          updated_at?: string
          vagas?: number
        }
        Update: {
          ativo?: boolean
          beneficiarios_projetados?: number
          created_at?: string
          custo_mensal?: number
          data_fim_atividade?: string | null
          data_fim_matricula?: string | null
          data_inicio_atividade?: string | null
          data_inicio_matricula?: string | null
          descricao?: string | null
          dias?: string | null
          id?: string
          imagem_url?: string | null
          nome?: string
          perfil_tematico?: string | null
          polo_id?: string
          professor_id?: string | null
          rascunho?: boolean
          slug?: string
          updated_at?: string
          vagas?: number
        }
        Relationships: [
          {
            foreignKeyName: "atividades_polo_id_fkey"
            columns: ["polo_id"]
            isOneToOne: false
            referencedRelation: "polos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_professor: {
        Row: {
          aluno_id: string | null
          atividade_id: string | null
          comentario: string | null
          created_at: string
          id: string
          nota: number
          professor_id: string
        }
        Insert: {
          aluno_id?: string | null
          atividade_id?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          nota: number
          professor_id: string
        }
        Update: {
          aluno_id?: string | null
          atividade_id?: string | null
          comentario?: string | null
          created_at?: string
          id?: string
          nota?: number
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_professor_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_professor_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_professor_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cadastros_alunos: {
        Row: {
          ano_escolar: string | null
          avatar_url: string | null
          bairro: string | null
          cidade: string | null
          cpf_responsavel: string | null
          created_at: string
          data_nasc: string | null
          email: string
          id: string
          modalidade: string | null
          nome: string
          nome_escola: string | null
          nome_responsavel: string | null
          polo_nome: string | null
          qtd_pessoas_residencia: number
          tel_responsavel: string | null
          telefone: string | null
          turma_nome: string | null
          turno_escolar: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          ano_escolar?: string | null
          avatar_url?: string | null
          bairro?: string | null
          cidade?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          data_nasc?: string | null
          email: string
          id?: string
          modalidade?: string | null
          nome?: string
          nome_escola?: string | null
          nome_responsavel?: string | null
          polo_nome?: string | null
          qtd_pessoas_residencia?: number
          tel_responsavel?: string | null
          telefone?: string | null
          turma_nome?: string | null
          turno_escolar?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ano_escolar?: string | null
          avatar_url?: string | null
          bairro?: string | null
          cidade?: string | null
          cpf_responsavel?: string | null
          created_at?: string
          data_nasc?: string | null
          email?: string
          id?: string
          modalidade?: string | null
          nome?: string
          nome_escola?: string | null
          nome_responsavel?: string | null
          polo_nome?: string | null
          qtd_pessoas_residencia?: number
          tel_responsavel?: string | null
          telefone?: string | null
          turma_nome?: string | null
          turno_escolar?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cadastros_professores: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          modalidade: string | null
          nome: string
          polo_nome: string | null
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          modalidade?: string | null
          nome?: string
          polo_nome?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          modalidade?: string | null
          nome?: string
          polo_nome?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categorias_custo: {
        Row: {
          created_at: string
          id: string
          nome: string
          ordem: number
          tipo: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          ordem?: number
          tipo?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          ordem?: number
          tipo?: string
        }
        Relationships: []
      }
      centros_custo: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          orcamento_mensal: number
          responsavel: string | null
          setor: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          orcamento_mensal?: number
          responsavel?: string | null
          setor?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          orcamento_mensal?: number
          responsavel?: string | null
          setor?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documentos_gestao: {
        Row: {
          created_at: string
          entidade_id: string
          entidade_nome: string
          id: string
          nome: string
          setor: string
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string
          entidade_id?: string
          entidade_nome?: string
          id?: string
          nome?: string
          setor?: string
          tipo?: string
          url?: string
        }
        Update: {
          created_at?: string
          entidade_id?: string
          entidade_nome?: string
          id?: string
          nome?: string
          setor?: string
          tipo?: string
          url?: string
        }
        Relationships: []
      }
      fornecedor_documentos: {
        Row: {
          created_at: string
          fornecedor_id: string
          id: string
          nome: string
          tipo: string
          url: string
        }
        Insert: {
          created_at?: string
          fornecedor_id: string
          id?: string
          nome?: string
          tipo?: string
          url?: string
        }
        Update: {
          created_at?: string
          fornecedor_id?: string
          id?: string
          nome?: string
          tipo?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedor_documentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedor_propostas: {
        Row: {
          arquivo_url: string | null
          created_at: string
          descricao: string | null
          fornecedor_id: string
          id: string
          prazo: string | null
          status: string
          titulo: string
          valor: number
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor_id: string
          id?: string
          prazo?: string | null
          status?: string
          titulo?: string
          valor?: number
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor_id?: string
          id?: string
          prazo?: string | null
          status?: string
          titulo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "fornecedor_propostas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          atividades_texto: string | null
          banco_agencia: string | null
          banco_conta: string | null
          banco_nome: string | null
          banco_pix: string | null
          cartao_cnpj_url: string | null
          categorias: string[]
          cep: string | null
          cidade: string | null
          cnae: string | null
          cnae_principal_codigo: string | null
          cnae_principal_descricao: string | null
          cnae_secundarios: Json
          cnpj: string
          codigo_tributacao: string | null
          created_at: string
          data_abertura: string | null
          decidido_em: string | null
          decidido_por: string | null
          email: string | null
          endereco: string | null
          id: string
          natureza_juridica: string | null
          nome_fantasia: string | null
          observacao_gestor: string | null
          porte: string | null
          razao_social: string
          responsavel: string | null
          situacao_cadastral: string | null
          status: string
          telefone: string | null
          texto_nota_fiscal: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          atividades_texto?: string | null
          banco_agencia?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_pix?: string | null
          cartao_cnpj_url?: string | null
          categorias?: string[]
          cep?: string | null
          cidade?: string | null
          cnae?: string | null
          cnae_principal_codigo?: string | null
          cnae_principal_descricao?: string | null
          cnae_secundarios?: Json
          cnpj: string
          codigo_tributacao?: string | null
          created_at?: string
          data_abertura?: string | null
          decidido_em?: string | null
          decidido_por?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          observacao_gestor?: string | null
          porte?: string | null
          razao_social?: string
          responsavel?: string | null
          situacao_cadastral?: string | null
          status?: string
          telefone?: string | null
          texto_nota_fiscal?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          atividades_texto?: string | null
          banco_agencia?: string | null
          banco_conta?: string | null
          banco_nome?: string | null
          banco_pix?: string | null
          cartao_cnpj_url?: string | null
          categorias?: string[]
          cep?: string | null
          cidade?: string | null
          cnae?: string | null
          cnae_principal_codigo?: string | null
          cnae_principal_descricao?: string | null
          cnae_secundarios?: Json
          cnpj?: string
          codigo_tributacao?: string | null
          created_at?: string
          data_abertura?: string | null
          decidido_em?: string | null
          decidido_por?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          natureza_juridica?: string | null
          nome_fantasia?: string | null
          observacao_gestor?: string | null
          porte?: string | null
          razao_social?: string
          responsavel?: string | null
          situacao_cadastral?: string | null
          status?: string
          telefone?: string | null
          texto_nota_fiscal?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      itens_orcamento: {
        Row: {
          atividade_id: string
          categoria_id: string | null
          created_at: string
          custo_mensal: number
          descricao: string | null
          id: string
          item: string
          quantidade: string | null
          updated_at: string
        }
        Insert: {
          atividade_id: string
          categoria_id?: string | null
          created_at?: string
          custo_mensal?: number
          descricao?: string | null
          id?: string
          item: string
          quantidade?: string | null
          updated_at?: string
        }
        Update: {
          atividade_id?: string
          categoria_id?: string | null
          created_at?: string
          custo_mensal?: number
          descricao?: string | null
          id?: string
          item?: string
          quantidade?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itens_orcamento_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_orcamento_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_custo"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          atividade_id: string | null
          categoria_id: string | null
          centro_custo_id: string | null
          competencia: string
          created_at: string
          descricao: string
          id: string
          natureza: string
          pedido_id: string | null
          polo_id: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          atividade_id?: string | null
          categoria_id?: string | null
          centro_custo_id?: string | null
          competencia?: string
          created_at?: string
          descricao: string
          id?: string
          natureza?: string
          pedido_id?: string | null
          polo_id?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          atividade_id?: string | null
          categoria_id?: string | null
          centro_custo_id?: string | null
          competencia?: string
          created_at?: string
          descricao?: string
          id?: string
          natureza?: string
          pedido_id?: string | null
          polo_id?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_polo_id_fkey"
            columns: ["polo_id"]
            isOneToOne: false
            referencedRelation: "polos"
            referencedColumns: ["id"]
          },
        ]
      }
      matriculas: {
        Row: {
          aluno_id: string | null
          aluno_nome: string
          created_at: string
          id: string
          observacao: string | null
          status: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          aluno_id?: string | null
          aluno_nome?: string
          created_at?: string
          id?: string
          observacao?: string | null
          status?: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string | null
          aluno_nome?: string
          created_at?: string
          id?: string
          observacao?: string | null
          status?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_compra: {
        Row: {
          atividade_id: string | null
          categoria_id: string | null
          centro_custo_id: string | null
          competencia: string
          created_at: string
          decidido_em: string | null
          decidido_por: string | null
          descricao: string | null
          id: string
          item: string
          justificativa: string | null
          observacao_gestor: string | null
          polo_id: string
          quantidade: number
          solicitante_id: string | null
          solicitante_nome: string
          status: string
          updated_at: string
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          atividade_id?: string | null
          categoria_id?: string | null
          centro_custo_id?: string | null
          competencia?: string
          created_at?: string
          decidido_em?: string | null
          decidido_por?: string | null
          descricao?: string | null
          id?: string
          item: string
          justificativa?: string | null
          observacao_gestor?: string | null
          polo_id: string
          quantidade?: number
          solicitante_id?: string | null
          solicitante_nome?: string
          status?: string
          updated_at?: string
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          atividade_id?: string | null
          categoria_id?: string | null
          centro_custo_id?: string | null
          competencia?: string
          created_at?: string
          decidido_em?: string | null
          decidido_por?: string | null
          descricao?: string | null
          id?: string
          item?: string
          justificativa?: string | null
          observacao_gestor?: string | null
          polo_id?: string
          quantidade?: number
          solicitante_id?: string | null
          solicitante_nome?: string
          status?: string
          updated_at?: string
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_compra_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_decidido_por_fkey"
            columns: ["decidido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_polo_id_fkey"
            columns: ["polo_id"]
            isOneToOne: false
            referencedRelation: "polos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_compra_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      polos: {
        Row: {
          ativo: boolean
          beneficiarios_projetados: number
          cidade: string
          created_at: string
          endereco: string | null
          fotos_url: string | null
          id: string
          nome: string
          observacoes: string | null
          orcamento_mensal: number
          perfil_tematico: string | null
          ponto_focal: string | null
          rascunho: boolean
          slug: string
          uf: string
          updated_at: string
          vagas_totais: number
        }
        Insert: {
          ativo?: boolean
          beneficiarios_projetados?: number
          cidade: string
          created_at?: string
          endereco?: string | null
          fotos_url?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          orcamento_mensal?: number
          perfil_tematico?: string | null
          ponto_focal?: string | null
          rascunho?: boolean
          slug: string
          uf: string
          updated_at?: string
          vagas_totais?: number
        }
        Update: {
          ativo?: boolean
          beneficiarios_projetados?: number
          cidade?: string
          created_at?: string
          endereco?: string | null
          fotos_url?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          orcamento_mensal?: number
          perfil_tematico?: string | null
          ponto_focal?: string | null
          rascunho?: boolean
          slug?: string
          uf?: string
          updated_at?: string
          vagas_totais?: number
        }
        Relationships: []
      }
      professores_atividades: {
        Row: {
          atividade_id: string
          created_at: string
          id: string
          professor_id: string
        }
        Insert: {
          atividade_id: string
          created_at?: string
          id?: string
          professor_id: string
        }
        Update: {
          atividade_id?: string
          created_at?: string
          id?: string
          professor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professores_atividades_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professores_atividades_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          documento: string | null
          email: string | null
          id: string
          nome: string
          polo_id: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          documento?: string | null
          email?: string | null
          id: string
          nome?: string
          polo_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          documento?: string | null
          email?: string | null
          id?: string
          nome?: string
          polo_id?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_polo_fk"
            columns: ["polo_id"]
            isOneToOne: false
            referencedRelation: "polos"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          atividade_id: string
          ativo: boolean
          created_at: string
          horario: string | null
          id: string
          nome: string
          turno: string
          updated_at: string
          vagas: number
        }
        Insert: {
          atividade_id: string
          ativo?: boolean
          created_at?: string
          horario?: string | null
          id?: string
          nome: string
          turno?: string
          updated_at?: string
          vagas?: number
        }
        Update: {
          atividade_id?: string
          ativo?: boolean
          created_at?: string
          horario?: string | null
          id?: string
          nome?: string
          turno?: string
          updated_at?: string
          vagas?: number
        }
        Relationships: [
          {
            foreignKeyName: "turmas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_gestor: { Args: never; Returns: boolean }
      meu_polo: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "gestor" | "responsavel" | "professor" | "aluno"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["gestor", "responsavel", "professor", "aluno"],
    },
  },
} as const
