// Database Schema Types for Multi-Tenant SaaS Architecture
// Prepared for PostgreSQL with Row Level Security (RLS)

export interface DatabaseSchema {
  tenants: TenantTable;
  users: UserTable;
  user_roles: UserRoleTable;
  occurrences: OccurrenceTable;
  occurrence_attachments: AttachmentTable;
  occurrence_comments: CommentTable;
  occurrence_history: HistoryTable;
  capa_actions: CAPATable;
  external_notifications: NotificationTable;
  audit_logs: AuditLogTable;
  tenant_settings: SettingsTable;
}

// Tenant Table - Multi-tenant isolation
export interface TenantTable {
  id: string; // UUID, Primary Key
  name: string;
  slug: string; // Unique, used in protocol generation
  logo_url?: string;
  primary_color?: string;
  plan: "free" | "basic" | "pro" | "enterprise";
  max_users: number;
  max_occurrences_month: number;
  features: string[]; // JSON array of enabled features
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// User Table - Links to auth.users
export interface UserTable {
  id: string; // UUID, References auth.users
  tenant_id: string; // Foreign Key to tenants
  email: string;
  full_name: string;
  avatar_url?: string;
  role: "admin" | "user";
  department?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

// User Roles Table - Separate from profiles for security
export interface UserRoleTable {
  id: string;
  user_id: string;
  role: "admin" | "user";
  tenant_id: string;
  created_at: string;
}

// Occurrence Table - Main data
export interface OccurrenceTable {
  id: string; // UUID
  tenant_id: string;
  protocol: string; // Generated: TENANT-YYYYMMDD-SEQ
  type: "assistencial" | "administrativa" | "tecnica";
  subtype: string;
  status: string;
  triage_classification?: string;
  triage_by?: string;
  triage_at?: string;
  
  // Patient data (encrypted at rest)
  patient_name: string;
  patient_phone: string;
  patient_id: string;
  patient_birth_date: string;
  exam_type: string;
  unit_location: string;
  event_datetime: string;
  
  // Occurrence details
  detailed_description: string;
  immediate_action: string;
  perceived_impact: string;
  people_involved?: string;
  contains_sensitive_data: boolean;
  is_anonymized: boolean;
  
  // Outcome
  outcome_types?: string[]; // JSON array
  outcome_justification?: string;
  main_outcome?: string;
  outcome_by?: string;
  outcome_at?: string;
  
  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

// Attachments Table
export interface AttachmentTable {
  id: string;
  tenant_id: string;
  occurrence_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  uploaded_by: string;
  uploaded_at: string;
  is_deleted: boolean;
}

// Comments Table
export interface CommentTable {
  id: string;
  tenant_id: string;
  occurrence_id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at?: string;
  is_internal: boolean; // Admin-only comments
}

// History Table - Status changes
export interface HistoryTable {
  id: string;
  tenant_id: string;
  occurrence_id: string;
  from_status: string;
  to_status: string;
  changed_by: string;
  changed_at: string;
  reason?: string;
}

// CAPA Table
export interface CAPATable {
  id: string;
  tenant_id: string;
  occurrence_id: string;
  root_cause: string;
  action: string;
  responsible: string;
  deadline: string;
  evidence?: string;
  efficacy_verification?: string;
  verified_by?: string;
  verified_at?: string;
  status: "pendente" | "em_andamento" | "concluida" | "verificada";
  created_at: string;
  updated_at: string;
}

// External Notifications Table
export interface NotificationTable {
  id: string;
  tenant_id: string;
  occurrence_id: string;
  notified_agency: string;
  notification_date: string;
  responsible: string;
  attachment_path?: string;
  generated_document_path?: string;
  created_at: string;
}

// Audit Logs Table - Immutable
export interface AuditLogTable {
  id: string;
  tenant_id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_protocol?: string;
  details?: Record<string, any>; // JSONB
  ip_address?: string;
  user_agent?: string;
  sensitive_data_accessed: boolean;
  created_at: string;
}

// Tenant Settings Table
export interface SettingsTable {
  id: string;
  tenant_id: string;
  units: string[]; // JSON array
  exam_types: string[]; // JSON array
  sla_triage_hours: number;
  sla_analysis_hours: number;
  sla_resolution_hours: number;
  custom_subtypes?: Record<string, string[]>; // JSONB
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

// RLS Policies (conceptual - to be implemented in migrations)
export const rlsPolicies = {
  tenants: {
    select: "Users can only see their own tenant",
    policy: "tenant_id = auth.jwt() -> 'tenant_id'",
  },
  occurrences: {
    select_admin: "Admins can see all occurrences in their tenant",
    select_user: "Users can only see their own occurrences",
    insert: "Users can insert for their tenant",
    update_admin: "Only admins can update",
    delete: "Only admins can delete",
  },
  audit_logs: {
    select: "Only admins can view audit logs",
    insert: "System only - no direct inserts",
    update: "No updates allowed - immutable",
    delete: "No deletes allowed - immutable",
  },
};

// Index suggestions for performance
export const indexSuggestions = [
  "CREATE INDEX idx_occurrences_tenant ON occurrences(tenant_id);",
  "CREATE INDEX idx_occurrences_status ON occurrences(tenant_id, status);",
  "CREATE INDEX idx_occurrences_created ON occurrences(tenant_id, created_at DESC);",
  "CREATE INDEX idx_occurrences_protocol ON occurrences(protocol);",
  "CREATE INDEX idx_occurrences_type ON occurrences(tenant_id, type);",
  "CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);",
  "CREATE INDEX idx_history_occurrence ON occurrence_history(occurrence_id);",
];
