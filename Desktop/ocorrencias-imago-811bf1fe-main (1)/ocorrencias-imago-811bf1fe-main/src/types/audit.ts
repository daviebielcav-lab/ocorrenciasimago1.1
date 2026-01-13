// Audit Log Types for Security and LGPD Compliance

export type AuditAction =
  | "occurrence_create"
  | "occurrence_view"
  | "occurrence_update"
  | "occurrence_delete"
  | "triage_set"
  | "status_change"
  | "outcome_set"
  | "capa_create"
  | "capa_update"
  | "attachment_upload"
  | "attachment_download"
  | "pdf_export"
  | "report_generate"
  | "data_anonymize"
  | "user_login"
  | "user_logout"
  | "settings_change"
  | "sensitive_data_access";

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userRole: "admin" | "user";
  action: AuditAction;
  resourceType: "occurrence" | "report" | "user" | "settings" | "system";
  resourceId?: string;
  resourceProtocolo?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  sensitiveDataAccessed?: boolean;
}

// Audit action labels for display
export const auditActionLabels: Record<AuditAction, string> = {
  occurrence_create: "Criou ocorrência",
  occurrence_view: "Visualizou ocorrência",
  occurrence_update: "Atualizou ocorrência",
  occurrence_delete: "Excluiu ocorrência",
  triage_set: "Realizou triagem",
  status_change: "Alterou status",
  outcome_set: "Definiu desfecho",
  capa_create: "Criou CAPA",
  capa_update: "Atualizou CAPA",
  attachment_upload: "Anexou arquivo",
  attachment_download: "Baixou anexo",
  pdf_export: "Exportou PDF",
  report_generate: "Gerou relatório",
  data_anonymize: "Anonimizou dados",
  user_login: "Login",
  user_logout: "Logout",
  settings_change: "Alterou configurações",
  sensitive_data_access: "Acessou dados sensíveis",
};

// Helper to create audit log entries
export function createAuditEntry(
  params: Omit<AuditLogEntry, "id" | "timestamp">
): AuditLogEntry {
  return {
    ...params,
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
}

// Data retention policies
export const dataRetentionPolicies = {
  auditLogs: {
    retentionDays: 365 * 5, // 5 years for healthcare compliance
    description: "Logs de auditoria mantidos por 5 anos para compliance",
  },
  occurrences: {
    retentionDays: 365 * 10, // 10 years
    description: "Ocorrências mantidas por 10 anos",
  },
  sensitiveData: {
    retentionDays: 365 * 5,
    description: "Dados sensíveis podem ser anonimizados após 5 anos",
    canAnonymize: true,
  },
};

// Permission matrix
export type Permission =
  | "occurrence:create"
  | "occurrence:read_own"
  | "occurrence:read_all"
  | "occurrence:update"
  | "occurrence:delete"
  | "triage:set"
  | "outcome:set"
  | "capa:manage"
  | "report:view"
  | "report:export"
  | "kanban:view"
  | "kanban:drag"
  | "settings:view"
  | "settings:edit"
  | "audit:view"
  | "data:anonymize";

export const rolePermissions: Record<"admin" | "user", Permission[]> = {
  admin: [
    "occurrence:create",
    "occurrence:read_own",
    "occurrence:read_all",
    "occurrence:update",
    "occurrence:delete",
    "triage:set",
    "outcome:set",
    "capa:manage",
    "report:view",
    "report:export",
    "kanban:view",
    "kanban:drag",
    "settings:view",
    "settings:edit",
    "audit:view",
    "data:anonymize",
  ],
  user: [
    "occurrence:create",
    "occurrence:read_own",
    "kanban:view",
  ],
};

export function hasPermission(role: "admin" | "user", permission: Permission): boolean {
  return rolePermissions[role].includes(permission);
}

// LGPD data categories
export const lgpdDataCategories = {
  identification: {
    label: "Dados de Identificação",
    fields: ["nomeCompleto", "idPaciente", "dataNascimento"],
    canAnonymize: true,
  },
  contact: {
    label: "Dados de Contato",
    fields: ["telefone", "email"],
    canAnonymize: true,
  },
  health: {
    label: "Dados de Saúde",
    fields: ["tipoExame", "descricaoDetalhada"],
    sensitive: true,
    canAnonymize: true,
  },
  operational: {
    label: "Dados Operacionais",
    fields: ["unidadeLocal", "dataHoraEvento"],
    canAnonymize: false,
  },
};

// Anonymization helper
export function anonymizePatientData(data: Record<string, any>): Record<string, any> {
  const anonymized = { ...data };
  
  // Anonymize identification
  if (anonymized.nomeCompleto) {
    anonymized.nomeCompleto = "PACIENTE ANONIMIZADO";
  }
  if (anonymized.telefone) {
    anonymized.telefone = "***";
  }
  if (anonymized.dataNascimento) {
    anonymized.dataNascimento = "****-**-**";
  }
  if (anonymized.idPaciente) {
    anonymized.idPaciente = `ANON-${anonymized.idPaciente.slice(-4)}`;
  }
  
  return anonymized;
}
