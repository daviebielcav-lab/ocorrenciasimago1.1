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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          tenant_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          tenant_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          tenant_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_attachments: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_image: boolean | null
          occurrence_id: string
          uploaded_by: string
          uploaded_em: string
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_image?: boolean | null
          occurrence_id: string
          uploaded_by: string
          uploaded_em?: string
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_image?: boolean | null
          occurrence_id?: string
          uploaded_by?: string
          uploaded_em?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_attachments_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_capas: {
        Row: {
          acao: string
          atualizado_em: string
          causa_raiz: string
          criado_em: string
          evidencia_url: string | null
          id: string
          occurrence_id: string
          prazo: string
          responsavel: string
          status: Database["public"]["Enums"]["capa_status"]
          verificacao_eficacia: string | null
          verificado_em: string | null
          verificado_por: string | null
        }
        Insert: {
          acao: string
          atualizado_em?: string
          causa_raiz: string
          criado_em?: string
          evidencia_url?: string | null
          id?: string
          occurrence_id: string
          prazo: string
          responsavel: string
          status?: Database["public"]["Enums"]["capa_status"]
          verificacao_eficacia?: string | null
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Update: {
          acao?: string
          atualizado_em?: string
          causa_raiz?: string
          criado_em?: string
          evidencia_url?: string | null
          id?: string
          occurrence_id?: string
          prazo?: string
          responsavel?: string
          status?: Database["public"]["Enums"]["capa_status"]
          verificacao_eficacia?: string | null
          verificado_em?: string | null
          verificado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_capas_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_capas_verificado_por_fkey"
            columns: ["verificado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_comments: {
        Row: {
          atualizado_em: string
          content: string
          criado_em: string
          criado_por: string
          id: string
          occurrence_id: string
        }
        Insert: {
          atualizado_em?: string
          content: string
          criado_em?: string
          criado_por: string
          id?: string
          occurrence_id: string
        }
        Update: {
          atualizado_em?: string
          content?: string
          criado_em?: string
          criado_por?: string
          id?: string
          occurrence_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_comments_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_comments_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrence_status_history: {
        Row: {
          alterado_em: string
          alterado_por: string
          id: string
          motivo: string | null
          occurrence_id: string
          status_de: Database["public"]["Enums"]["occurrence_status"]
          status_para: Database["public"]["Enums"]["occurrence_status"]
        }
        Insert: {
          alterado_em?: string
          alterado_por: string
          id?: string
          motivo?: string | null
          occurrence_id: string
          status_de: Database["public"]["Enums"]["occurrence_status"]
          status_para: Database["public"]["Enums"]["occurrence_status"]
        }
        Update: {
          alterado_em?: string
          alterado_por?: string
          id?: string
          motivo?: string | null
          occurrence_id?: string
          status_de?: Database["public"]["Enums"]["occurrence_status"]
          status_para?: Database["public"]["Enums"]["occurrence_status"]
        }
        Relationships: [
          {
            foreignKeyName: "occurrence_status_history_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrence_status_history_occurrence_id_fkey"
            columns: ["occurrence_id"]
            isOneToOne: false
            referencedRelation: "occurrences"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrences: {
        Row: {
          acao_imediata: string | null
          acoes_imediatas_checklist: Json | null
          atualizado_em: string
          contem_dado_sensivel: boolean | null
          criado_em: string
          criado_por: string
          dados_especificos: Json | null
          descricao_dano: string | null
          descricao_detalhada: string
          desfecho_definido_em: string | null
          desfecho_definido_por: string | null
          desfecho_justificativa: string | null
          desfecho_principal: Database["public"]["Enums"]["outcome_type"] | null
          desfecho_tipos: Database["public"]["Enums"]["outcome_type"][] | null
          encaminhada_em: string | null
          finalizada_em: string | null
          houve_dano: boolean | null
          id: string
          impacto_percebido: string | null
          medico_destino: string | null
          mensagem_admin_medico: string | null
          mensagem_medico: string | null
          notificacao_anexo_url: string | null
          notificacao_data: string | null
          notificacao_orgao: string | null
          notificacao_responsavel: string | null
          observacoes: string | null
          paciente_data_hora_evento: string | null
          paciente_data_nascimento: string | null
          paciente_id: string | null
          paciente_nome_completo: string | null
          paciente_telefone: string | null
          paciente_tipo_exame: string | null
          paciente_unidade_local: string | null
          pdf_conclusao_url: string | null
          pdf_gerado_em: string | null
          pessoas_comunicadas: Json | null
          pessoas_envolvidas: string | null
          protocolo: string
          public_token: string | null
          registrador_cargo: string | null
          registrador_setor: string | null
          status: Database["public"]["Enums"]["occurrence_status"]
          subtipo: Database["public"]["Enums"]["occurrence_subtype"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["occurrence_type"]
          triagem: Database["public"]["Enums"]["triage_classification"] | null
          triagem_em: string | null
          triagem_por: string | null
        }
        Insert: {
          acao_imediata?: string | null
          acoes_imediatas_checklist?: Json | null
          atualizado_em?: string
          contem_dado_sensivel?: boolean | null
          criado_em?: string
          criado_por: string
          dados_especificos?: Json | null
          descricao_dano?: string | null
          descricao_detalhada: string
          desfecho_definido_em?: string | null
          desfecho_definido_por?: string | null
          desfecho_justificativa?: string | null
          desfecho_principal?:
            | Database["public"]["Enums"]["outcome_type"]
            | null
          desfecho_tipos?: Database["public"]["Enums"]["outcome_type"][] | null
          encaminhada_em?: string | null
          finalizada_em?: string | null
          houve_dano?: boolean | null
          id?: string
          impacto_percebido?: string | null
          medico_destino?: string | null
          mensagem_admin_medico?: string | null
          mensagem_medico?: string | null
          notificacao_anexo_url?: string | null
          notificacao_data?: string | null
          notificacao_orgao?: string | null
          notificacao_responsavel?: string | null
          observacoes?: string | null
          paciente_data_hora_evento?: string | null
          paciente_data_nascimento?: string | null
          paciente_id?: string | null
          paciente_nome_completo?: string | null
          paciente_telefone?: string | null
          paciente_tipo_exame?: string | null
          paciente_unidade_local?: string | null
          pdf_conclusao_url?: string | null
          pdf_gerado_em?: string | null
          pessoas_comunicadas?: Json | null
          pessoas_envolvidas?: string | null
          protocolo: string
          public_token?: string | null
          registrador_cargo?: string | null
          registrador_setor?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          subtipo: Database["public"]["Enums"]["occurrence_subtype"]
          tenant_id: string
          tipo: Database["public"]["Enums"]["occurrence_type"]
          triagem?: Database["public"]["Enums"]["triage_classification"] | null
          triagem_em?: string | null
          triagem_por?: string | null
        }
        Update: {
          acao_imediata?: string | null
          acoes_imediatas_checklist?: Json | null
          atualizado_em?: string
          contem_dado_sensivel?: boolean | null
          criado_em?: string
          criado_por?: string
          dados_especificos?: Json | null
          descricao_dano?: string | null
          descricao_detalhada?: string
          desfecho_definido_em?: string | null
          desfecho_definido_por?: string | null
          desfecho_justificativa?: string | null
          desfecho_principal?:
            | Database["public"]["Enums"]["outcome_type"]
            | null
          desfecho_tipos?: Database["public"]["Enums"]["outcome_type"][] | null
          encaminhada_em?: string | null
          finalizada_em?: string | null
          houve_dano?: boolean | null
          id?: string
          impacto_percebido?: string | null
          medico_destino?: string | null
          mensagem_admin_medico?: string | null
          mensagem_medico?: string | null
          notificacao_anexo_url?: string | null
          notificacao_data?: string | null
          notificacao_orgao?: string | null
          notificacao_responsavel?: string | null
          observacoes?: string | null
          paciente_data_hora_evento?: string | null
          paciente_data_nascimento?: string | null
          paciente_id?: string | null
          paciente_nome_completo?: string | null
          paciente_telefone?: string | null
          paciente_tipo_exame?: string | null
          paciente_unidade_local?: string | null
          pdf_conclusao_url?: string | null
          pdf_gerado_em?: string | null
          pessoas_comunicadas?: Json | null
          pessoas_envolvidas?: string | null
          protocolo?: string
          public_token?: string | null
          registrador_cargo?: string | null
          registrador_setor?: string | null
          status?: Database["public"]["Enums"]["occurrence_status"]
          subtipo?: Database["public"]["Enums"]["occurrence_subtype"]
          tenant_id?: string
          tipo?: Database["public"]["Enums"]["occurrence_type"]
          triagem?: Database["public"]["Enums"]["triage_classification"] | null
          triagem_em?: string | null
          triagem_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occurrences_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_desfecho_definido_por_fkey"
            columns: ["desfecho_definido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_triagem_por_fkey"
            columns: ["triagem_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          last_login_at: string | null
          last_login_ip: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_login_ip?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          last_login_ip?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_protocol_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_public_token: { Args: never; Returns: string }
      get_user_tenant_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_tenant_admin: { Args: { _user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          _action: string
          _details?: Json
          _entity_id?: string
          _entity_type?: string
        }
        Returns: string
      }
      user_belongs_to_tenant: {
        Args: { _tenant_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      capa_status: "pendente" | "em_andamento" | "concluida" | "verificada"
      occurrence_status:
        | "registrada"
        | "em_triagem"
        | "em_analise"
        | "acao_em_andamento"
        | "concluida"
        | "improcedente"
      occurrence_subtype:
        | "erro_identificacao"
        | "medicacao_contraste"
        | "quedas_traumas"
        | "qualidade_imagem_laudo"
        | "radiacao_seguranca"
        | "atendimento_recepcao"
        | "agendamento"
        | "entrega_resultados"
        | "faturamento"
        | "equipamentos"
        | "sistemas"
        | "predial"
        | "extravasamento"
        | "revisao_exame"
      occurrence_type: "assistencial" | "administrativa" | "tecnica"
      outcome_type:
        | "imediato_correcao"
        | "orientacao"
        | "treinamento"
        | "alteracao_processo"
        | "manutencao_corretiva"
        | "notificacao_externa"
        | "improcedente"
      triage_classification:
        | "circunstancia_risco"
        | "near_miss"
        | "incidente_sem_dano"
        | "evento_adverso"
        | "evento_sentinela"
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
      app_role: ["admin", "user"],
      capa_status: ["pendente", "em_andamento", "concluida", "verificada"],
      occurrence_status: [
        "registrada",
        "em_triagem",
        "em_analise",
        "acao_em_andamento",
        "concluida",
        "improcedente",
      ],
      occurrence_subtype: [
        "erro_identificacao",
        "medicacao_contraste",
        "quedas_traumas",
        "qualidade_imagem_laudo",
        "radiacao_seguranca",
        "atendimento_recepcao",
        "agendamento",
        "entrega_resultados",
        "faturamento",
        "equipamentos",
        "sistemas",
        "predial",
        "extravasamento",
        "revisao_exame",
      ],
      occurrence_type: ["assistencial", "administrativa", "tecnica"],
      outcome_type: [
        "imediato_correcao",
        "orientacao",
        "treinamento",
        "alteracao_processo",
        "manutencao_corretiva",
        "notificacao_externa",
        "improcedente",
      ],
      triage_classification: [
        "circunstancia_risco",
        "near_miss",
        "incidente_sem_dano",
        "evento_adverso",
        "evento_sentinela",
      ],
    },
  },
} as const
