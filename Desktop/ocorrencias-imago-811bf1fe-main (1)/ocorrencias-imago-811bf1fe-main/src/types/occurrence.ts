// Occurrence Types and Subtypes
// Note: "revisao_exame" is treated as a separate type in the UI but stored as subtipo in the database
export type OccurrenceType = "assistencial" | "administrativa" | "tecnica" | "revisao_exame";

// UI type that includes revisao_exame as a standalone type
export type OccurrenceUIType = "assistencial" | "administrativa" | "tecnica" | "revisao_exame";

export type AssistencialSubtype =
  | "erro_identificacao"
  | "extravasamento"
  | "quedas_traumas";

export type AdministrativaSubtype =
  | "faturamento"
  | "agendamento";

export type TecnicaSubtype = 
  | "equipamentos" 
  | "sistemas";

export type OccurrenceSubtype =
  | AssistencialSubtype
  | AdministrativaSubtype
  | TecnicaSubtype
  | "revisao_exame"; // Kept for database compatibility

// Triage Classification (severity order: ascending)
export type TriageClassification =
  | "circunstancia_risco"
  | "near_miss"
  | "incidente_sem_dano"
  | "evento_adverso"
  | "evento_sentinela";

// Occurrence Status - Complete Flow
export type OccurrenceStatus =
  | "registrada"
  | "em_triagem"
  | "em_analise"
  | "acao_em_andamento"
  | "concluida"
  | "improcedente";

// Outcome Types (Desfechos)
export type OutcomeType =
  | "imediato_correcao"
  | "orientacao"
  | "treinamento"
  | "alteracao_processo"
  | "manutencao_corretiva"
  | "notificacao_externa"
  | "improcedente";

// External Notification Data
export interface ExternalNotification {
  orgaoNotificado: string;
  data: string;
  responsavel: string;
  anexoComprovante?: string;
  documentoGerado?: string;
}

// CAPA - Corrective and Preventive Action
export interface CAPA {
  id: string;
  causaRaiz: string;
  acao: string;
  responsavel: string;
  prazo: string;
  evidencia?: string;
  verificacaoEficacia?: string;
  verificadoPor?: string;
  verificadoEm?: string;
  status: "pendente" | "em_andamento" | "concluida" | "verificada";
}

// Outcome Record
export interface OccurrenceOutcome {
  tipos: OutcomeType[];
  justificativa: string;
  desfechoPrincipal?: OutcomeType;
  notificacaoExterna?: ExternalNotification;
  capas?: CAPA[];
  definidoPor: string;
  definidoEm: string;
}

// Patient Data Block
export interface PatientData {
  nomeCompleto: string;
  cpf?: string;
  telefone?: string;
  idPaciente?: string;
  dataNascimento?: string;
  tipoExame?: string;
  unidadeLocal?: string;
  dataHoraEvento?: string;
}

// Registrador Data Block
export interface RegistradorData {
  setor: string;
  cargo: string;
}

// Pessoa Comunicada
export interface PessoaComunicada {
  nome: string;
  cargo: string;
  dataHora: string;
}

// ============ DADOS ESPECÍFICOS POR SUBTIPO ============

// Erro de Identificação
export interface ErroIdentificacaoData {
  etapaPercebida: 
    | "cadastro_recepcao"
    | "triagem"
    | "sala_exame"
    | "laudo"
    | "entrega"
    | "outro";
  etapaOutro?: string;
  divergencia: string[];
  divergenciaOutro?: string;
  comoDetectado:
    | "conferencia_verbal"
    | "sistema"
    | "pedido_medico"
    | "outro";
  comoDetectadoOutro?: string;
  exameStatus: "nao_iniciou" | "iniciou_interrompeu" | "realizado";
  impactoImediato: string[];
  impactoOutro?: string;
  medidasCorrecao: string;
  fatoresContribuintes: string[];
  fatoresOutro?: string;
}

// Extravasamento
export interface ExtravasamentoData {
  substancia: "contraste" | "soro" | "outro";
  substanciaOutro?: string;
  modalidade: "TC" | "RM" | "outro";
  modalidadeOutro?: string;
  localExtravasamento: string;
  volumeEstimado?: number;
  volumeNaoSei: boolean;
  sintomaDor: number; // 0-10
  sintomaEdema: "leve" | "medio" | "intenso" | "nenhum";
  sintomaAlteracaoCor: boolean;
  sintomaBolhas: boolean;
  sintomaDormencia: boolean;
  sintomasDescricao?: string;
  acoesImediatas: string[];
  acoesOutras?: string;
  avaliadoPor: string;
  avaliadoCargo: string;
  avaliadoHorario: string;
  orientacoesDadas: boolean;
  orientacoesDescricao?: string;
  desfechoExame: "concluido" | "remarcado" | "cancelado";
  desfechoEncaminhamento?: string;
}

// Revisão de Exame
export interface RevisaoExameData {
  exameModalidade: string;
  exameRegiao: string;
  exameData: string;
  motivoRevisao:
    | "pedido_medico"
    | "auditoria"
    | "duvida"
    | "segunda_leitura"
    | "reclamacao"
    | "outro";
  motivoOutro?: string;
  laudoEntregue: boolean;
  tipoDiscrepancia: string[];
  discrepanciaOutro?: string;
  potencialImpacto: "nenhum" | "baixo" | "medio" | "alto";
  impactoDescricao?: string;
  acaoTomada: string[];
  acaoOutra?: string;
  pessoasComunicadas: {
    tipo: "radiologista" | "coordenacao" | "solicitante";
    nome: string;
  }[];
}

// Quedas ou Traumas
export interface QuedasTraumasData {
  localExato:
    | "recepcao"
    | "corredor"
    | "banheiro"
    | "sala_exame"
    | "outro";
  localOutro?: string;
  atividadeMomento:
    | "andando"
    | "levantando"
    | "transferencia"
    | "saindo_maca"
    | "outro";
  atividadeOutro?: string;
  haviaAcompanhante: boolean;
  acompanhanteQuem?: string;
  fatoresAmbientais: string[];
  fatoresOutro?: string;
  lesaoDor: number; // 0-10
  lesaoLocal?: string;
  lesaoCorte: boolean;
  lesaoHematoma: boolean;
  lesaoSangramento: boolean;
  lesaoDeformidade: boolean;
  lesaoDesmaio: boolean;
  lesaoDescricao?: string;
  bateuCabeca: "sim" | "nao" | "nao_sei";
  acoesEncaminhamento: string;
  quemComunicado: string;
  quandoComunicado: string;
}

// Union de todos os dados específicos
export type DadosEspecificos =
  | ErroIdentificacaoData
  | ExtravasamentoData
  | RevisaoExameData
  | QuedasTraumasData
  | Record<string, unknown>;

// ============ FORM DATA ============

// Base Form Data - Campos comuns a todos
export interface BaseOccurrenceFormData {
  // Identificação do registrador
  registrador: RegistradorData;
  // Data e hora do evento
  dataHoraEvento: string;
  // Local
  unidadeLocal: string;
  // Dados do paciente
  paciente: PatientData;
  // Descrição objetiva
  descricaoDetalhada: string;
  // Ações imediatas
  acaoImediata: string;
  acoesImediatasChecklist: string[];
  // Dano/Lesão
  houveDano: boolean;
  descricaoDano?: string;
  // Comunicação
  pessoasComunicadas: PessoaComunicada[];
  // Anexos e observações
  anexos?: string[];
  observacoes?: string;
  contemDadoSensivel: boolean;
}

// Occurrence Form Data
export interface OccurrenceFormData extends BaseOccurrenceFormData {
  tipo: OccurrenceType;
  subtipo: OccurrenceSubtype;
  // Dados específicos do subtipo
  dadosEspecificos?: DadosEspecificos;
}

// Full Occurrence Record
export interface Occurrence extends OccurrenceFormData {
  id: string;
  protocolo: string;
  tenantId: string;
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
  status: OccurrenceStatus;
  triagem?: TriageClassification;
  triagemPor?: string;
  triagemEm?: string;
  desfecho?: OccurrenceOutcome;
  historicoStatus: StatusChange[];
  // Campos legados
  impactoPercebido?: string;
  pessoasEnvolvidas?: string;
}

// Status Change History
export interface StatusChange {
  de: OccurrenceStatus;
  para: OccurrenceStatus;
  por: string;
  em: string;
  motivo?: string;
}

// Subtype Labels
export const subtypeLabels: Record<OccurrenceSubtype, string> = {
  erro_identificacao: "Erro de identificação do paciente",
  extravasamento: "Extravasamento",
  revisao_exame: "Revisão de exame",
  quedas_traumas: "Quedas ou traumas",
  faturamento: "Faturamento",
  agendamento: "Agendamento",
  equipamentos: "Equipamento",
  sistemas: "Sistema",
};

// Subtype Descriptions
export const subtypeDescriptions: Record<OccurrenceSubtype, string> = {
  erro_identificacao: "Divergências na identificação do paciente em qualquer etapa do atendimento",
  extravasamento: "Vazamento de contraste ou outras substâncias durante procedimentos",
  revisao_exame: "Necessidade de revisão de laudo ou imagem após entrega",
  quedas_traumas: "Quedas, escorregões ou traumas ocorridos nas dependências",
  faturamento: "Problemas relacionados a cobranças, convênios ou pagamentos",
  agendamento: "Erros ou problemas no agendamento de exames",
  equipamentos: "Falhas ou problemas em equipamentos médicos",
  sistemas: "Problemas em sistemas de TI, software ou infraestrutura digital",
};

// Subtypes by Type (for wizard navigation)
// Note: revisao_exame is a standalone type now, not a subtype of assistencial
export const subtypesByType: Record<OccurrenceType, OccurrenceSubtype[]> = {
  assistencial: [
    "erro_identificacao",
    "extravasamento",
    "quedas_traumas",
  ],
  administrativa: [
    "faturamento",
    "agendamento",
  ],
  tecnica: ["equipamentos", "sistemas"],
  revisao_exame: ["revisao_exame"], // Self-referencing for compatibility
};

// Triage Labels and Config
export const triageConfig: Record<
  TriageClassification,
  { label: string; description: string; color: string; priority: number }
> = {
  circunstancia_risco: {
    label: "Circunstância de risco",
    description: "Situação com potencial de causar dano",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    priority: 1,
  },
  near_miss: {
    label: "Near Miss",
    description: "Quase falha - interceptada antes de atingir o paciente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    priority: 2,
  },
  incidente_sem_dano: {
    label: "Incidente sem dano",
    description: "Evento ocorreu mas não causou dano ao paciente",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    priority: 3,
  },
  evento_adverso: {
    label: "Evento adverso",
    description: "Evento causou dano ao paciente",
    color: "bg-red-100 text-red-800 border-red-200",
    priority: 4,
  },
  evento_sentinela: {
    label: "Evento sentinela",
    description: "Evento grave, inesperado, com dano permanente ou óbito",
    color: "bg-red-200 text-red-900 border-red-300",
    priority: 5,
  },
};

// Status Labels and Config
export const statusConfig: Record<
  OccurrenceStatus,
  { label: string; color: string; bgColor: string; description: string }
> = {
  registrada: {
    label: "Registrada",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    description: "Aguardando triagem inicial",
  },
  em_triagem: {
    label: "Em Triagem",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    description: "Classificação de gravidade em andamento",
  },
  em_analise: {
    label: "Em Análise",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    description: "Investigação e análise detalhada",
  },
  acao_em_andamento: {
    label: "Ação em Andamento",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    description: "Ações corretivas sendo executadas",
  },
  concluida: {
    label: "Concluída",
    color: "text-green-700",
    bgColor: "bg-green-100",
    description: "Todas as ações finalizadas",
  },
  improcedente: {
    label: "Improcedente",
    color: "text-gray-500",
    bgColor: "bg-gray-200",
    description: "Ocorrência encerrada como improcedente",
  },
};

// Status Flow - Valid Transitions
export const statusTransitions: Record<OccurrenceStatus, OccurrenceStatus[]> = {
  registrada: ["em_triagem", "improcedente"],
  em_triagem: ["em_analise", "improcedente"],
  em_analise: ["acao_em_andamento", "concluida", "improcedente"],
  acao_em_andamento: ["concluida", "improcedente"],
  concluida: [],
  improcedente: [],
};

// Outcome Labels and Config
export const outcomeConfig: Record<
  OutcomeType,
  { label: string; description: string; icon: string; requiresCapa: boolean }
> = {
  imediato_correcao: {
    label: "Imediato/Correção Pontual",
    description: "Ação imediata para correção do problema",
    icon: "zap",
    requiresCapa: false,
  },
  orientacao: {
    label: "Orientação",
    description: "Orientação aos envolvidos sobre procedimentos corretos",
    icon: "message-circle",
    requiresCapa: false,
  },
  treinamento: {
    label: "Treinamento",
    description: "Necessidade de treinamento para equipe",
    icon: "graduation-cap",
    requiresCapa: true,
  },
  alteracao_processo: {
    label: "Alteração de Processo/Protocolo",
    description: "Mudança em processos ou protocolos existentes",
    icon: "file-cog",
    requiresCapa: true,
  },
  manutencao_corretiva: {
    label: "Manutenção Corretiva",
    description: "Necessidade de manutenção em equipamentos",
    icon: "wrench",
    requiresCapa: true,
  },
  notificacao_externa: {
    label: "Notificação Externa",
    description: "Necessidade de notificar órgãos externos",
    icon: "send",
    requiresCapa: false,
  },
  improcedente: {
    label: "Improcedente",
    description: "Ocorrência não procede após análise",
    icon: "x-circle",
    requiresCapa: false,
  },
};

// Check if outcomes require CAPA
export const requiresCapa = (outcomes: OutcomeType[]): boolean => {
  return outcomes.some((o) => outcomeConfig[o].requiresCapa);
};

// Check if external notification is required
export const requiresExternalNotification = (outcomes: OutcomeType[]): boolean => {
  return outcomes.includes("notificacao_externa");
};
