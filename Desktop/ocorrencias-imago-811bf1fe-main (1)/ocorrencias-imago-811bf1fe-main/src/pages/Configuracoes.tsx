import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Shield,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  User,
  Clock,
  FileText,
  Settings,
  Loader2,
  Users,
} from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AuditAction,
  auditActionLabels,
  dataRetentionPolicies,
  rolePermissions,
} from "@/types/audit";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { UserManagement } from "@/components/admin/UserManagement";

const actionColors: Record<string, string> = {
  occurrence_create: "bg-green-100 text-green-700",
  occurrence_view: "bg-blue-100 text-blue-700",
  occurrence_update: "bg-yellow-100 text-yellow-700",
  occurrence_delete: "bg-red-100 text-red-700",
  triage_set: "bg-purple-100 text-purple-700",
  status_change: "bg-orange-100 text-orange-700",
  pdf_export: "bg-cyan-100 text-cyan-700",
  user_login: "bg-gray-100 text-gray-700",
  user_logout: "bg-gray-100 text-gray-700",
  sensitive_data_access: "bg-red-100 text-red-700",
};

export default function Configuracoes() {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user names separately
      const userIds = [...new Set((data || []).map((l: any) => l.user_id).filter(Boolean))];
      let userMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        
        if (profiles) {
          userMap = profiles.reduce((acc, p) => ({ ...acc, [p.id]: p.full_name }), {});
        }
      }

      return (data || []).map((log: any) => ({
        id: log.id,
        action: log.action,
        timestamp: log.created_at,
        userName: log.user_id ? userMap[log.user_id] || "Sistema" : "Sistema",
        resourceId: log.entity_id,
        details: log.details,
        entityType: log.entity_type,
      }));
    },
    enabled: !!profile?.tenant_id,
  });

  const filteredLogs = auditLogs.filter((log: any) => {
    const matchesSearch =
      !searchTerm ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesUser = userFilter === "all" || log.userName === userFilter;
    return matchesSearch && matchesAction && matchesUser;
  });

  const uniqueUsers = [...new Set(auditLogs.map((l: any) => l.userName).filter(Boolean))];

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">
              Segurança, auditoria e configurações do sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="usuarios" className="space-y-6">
          <TabsList>
            <TabsTrigger value="usuarios" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Shield className="h-4 w-4" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="lgpd" className="gap-2">
              <Eye className="h-4 w-4" />
              LGPD
            </TabsTrigger>
          </TabsList>

          {/* User Management */}
          <TabsContent value="usuarios" className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <UserManagement />
            </div>
          </TabsContent>

          {/* Audit Logs */}
          <TabsContent value="audit" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuário ou ação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background"
                />
              </div>
              <div className="flex gap-2">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {Object.entries(auditActionLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user} value={user}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Data/Hora</TableHead>
                    <TableHead className="font-semibold">Usuário</TableHead>
                    <TableHead className="font-semibold">Ação</TableHead>
                    <TableHead className="font-semibold">Recurso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          <span className="text-muted-foreground">Carregando...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <p className="text-muted-foreground">
                          Nenhum registro de auditoria encontrado
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">{log.userName}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                              actionColors[log.action] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {auditActionLabels[log.action as AuditAction] || log.action}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {log.entityType || "-"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Permissions Matrix */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Matriz de Permissões
                </h3>
                <div className="space-y-4">
                  {Object.entries(rolePermissions).map(([role, permissions]) => (
                    <div key={role}>
                      <h4 className="font-medium text-sm mb-2 capitalize">
                        {role === "admin" ? "Administrador" : "Usuário Padrão"}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {permissions.slice(0, 6).map((perm) => (
                          <span
                            key={perm}
                            className="text-xs px-2 py-0.5 bg-secondary rounded"
                          >
                            {perm.replace(/_/g, " ")}
                          </span>
                        ))}
                        {permissions.length > 6 && (
                          <span className="text-xs text-muted-foreground">
                            +{permissions.length - 6} mais
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Retention */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Retenção de Dados
                </h3>
                <div className="space-y-4">
                  {Object.entries(dataRetentionPolicies).map(([key, policy]) => (
                    <div key={key} className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm capitalize">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {policy.description}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {Math.round(policy.retentionDays / 365)} anos
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Security Alerts */}
            <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertas de Segurança
              </h3>
              <p className="text-sm text-muted-foreground">
                Nenhum alerta de segurança no momento. O sistema está operando
                normalmente com isolamento total entre tenants via Row Level
                Security (RLS).
              </p>
            </div>
          </TabsContent>

          {/* LGPD */}
          <TabsContent value="lgpd" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Categorias de Dados
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Dados de Identificação</p>
                      <p className="text-xs text-muted-foreground">
                        Nome, ID, data de nascimento
                      </p>
                    </div>
                    <Badge variant="outline">Anonimizável</Badge>
                  </div>
                  <div className="flex items-start justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Dados de Contato</p>
                      <p className="text-xs text-muted-foreground">Telefone, email</p>
                    </div>
                    <Badge variant="outline">Anonimizável</Badge>
                  </div>
                  <div className="flex items-start justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Dados de Saúde</p>
                      <p className="text-xs text-muted-foreground">
                        Exames, descrições clínicas
                      </p>
                    </div>
                    <Badge variant="destructive">Sensível</Badge>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Ações LGPD
                </h3>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Exportar dados do paciente
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Eye className="h-4 w-4" />
                    Anonimizar dados antigos
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Solicitar exclusão de dados
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Todas as ações são registradas no log de auditoria para
                  conformidade regulatória.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
