import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
  Filter,
  Calendar,
  RefreshCw,
  Loader2,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useOccurrenceStats } from "@/hooks/useOccurrences";
import { useAuth } from "@/contexts/AuthContext";
import { downloadDashboardPDF } from "@/lib/pdf/dashboard-pdf";
import { useToast } from "@/hooks/use-toast";
import { sendToWebhook } from "@/hooks/useTenantSettings";

// Labels for exam types
const examTypeLabels: Record<string, string> = {
  ressonancia_magnetica: "Ressonância Magnética",
  tomografia: "Tomografia",
  raio_x: "Raio-X",
  densitometria: "Densitometria",
  mamografia: "Mamografia",
  ultrassonografia: "Ultrassonografia",
  pet_ct: "PET-CT",
  angiografia: "Angiografia",
  fluoroscopia: "Fluoroscopia",
  medicina_nuclear: "Medicina Nuclear",
  outro: "Outro",
  nao_informado: "Não informado",
};
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  color?: string;
}

function KPICard({ title, value, subtitle, icon: Icon, trend, color = "primary" }: KPICardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && (
            <div
              className={`flex items-center gap-1 mt-2 text-xs ${
                trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp
                className={`h-3 w-3 ${!trend.isPositive && "rotate-180"}`}
              />
              <span>{trend.value}% vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}/10`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function Relatorios() {
  const [dateRange, setDateRange] = useState("30d");
  const [tipo, setTipo] = useState("all");
  const { data: stats, isLoading, refetch } = useOccurrenceStats();
  const { tenant } = useAuth();
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    if (!stats) return;
    downloadDashboardPDF(stats, dateRange, tenant?.name);
    toast({
      title: "PDF gerado",
      description: "O relatório do dashboard foi baixado com sucesso.",
    });

    // Enviar para n8n
    await sendToWebhook(
      "https://n8n.imagoradiologia.cloud/webhook/3988912c-231c-482b-8c8a-f6cbf1234f2b",
      {
        evento: "download_relatorio_pdf",
        tenant_nome: tenant?.name || "Não identificado",
        periodo: dateRange,
        estatisticas: {
          total: stats.total,
          pendentes: stats.pendentes,
          em_analise: stats.emAnalise,
          concluidas: stats.concluidas,
          por_tipo: stats.byType,
          por_triagem: stats.byTriage,
        },
      }
    );
  };

  // Transform stats for charts
  const byTriageData = stats ? [
    { name: "Circunstância de risco", value: stats.byTriage.circunstancia_risco, color: "#3B82F6" },
    { name: "Near Miss", value: stats.byTriage.near_miss, color: "#EAB308" },
    { name: "Incidente sem dano", value: stats.byTriage.incidente_sem_dano, color: "#F97316" },
    { name: "Evento adverso", value: stats.byTriage.evento_adverso, color: "#EF4444" },
    { name: "Evento sentinela", value: stats.byTriage.evento_sentinela, color: "#991B1B" },
  ] : [];

  const byTypeData = stats ? [
    { name: "Assistencial", assistencial: stats.byType.assistencial },
    { name: "Administrativa", administrativa: stats.byType.administrativa },
    { name: "Técnica", tecnica: stats.byType.tecnica },
  ] : [];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Análise quantitativa e indicadores de desempenho
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[160px] bg-background">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="w-[160px] bg-background">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="assistencial">Assistencial</SelectItem>
                <SelectItem value="administrativa">Administrativa</SelectItem>
                <SelectItem value="tecnica">Técnica</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total de Ocorrências"
            value={stats?.total || 0}
            subtitle="No período selecionado"
            icon={Activity}
          />
          <KPICard
            title="Pendentes"
            value={stats?.pendentes || 0}
            subtitle={`${stats?.emAnalise || 0} em análise`}
            icon={AlertTriangle}
            color="warning"
          />
          <KPICard
            title="Concluídas"
            value={stats?.concluidas || 0}
            subtitle="Finalizadas com sucesso"
            icon={CheckCircle2}
            color="success"
          />
          <KPICard
            title="Taxa de Resolução"
            value={stats?.total ? `${Math.round((stats.concluidas / stats.total) * 100)}%` : "0%"}
            subtitle={`${stats?.concluidas || 0} de ${stats?.total || 0}`}
            icon={TrendingUp}
            color="primary"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* By Triage */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Por Classificação de Triagem
            </h3>
            {byTriageData.some(d => d.value > 0) ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={byTriageData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {byTriageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma ocorrência triada ainda
              </div>
            )}
          </div>

          {/* By Type */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Por Tipo de Ocorrência
            </h3>
            {stats?.total ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byTypeData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="assistencial" fill="#0D9488" name="Assistencial" />
                    <Bar dataKey="administrativa" fill="#6366F1" name="Administrativa" />
                    <Bar dataKey="tecnica" fill="#F59E0B" name="Técnica" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhuma ocorrência registrada ainda
              </div>
            )}
          </div>
        </div>

        {/* Revisão de Exame Analysis */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Análise de Revisões de Exame
            </h2>
            {stats?.revisaoExame && (
              <span className="text-sm text-muted-foreground">
                ({stats.revisaoExame.total} revisões)
              </span>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Exam Type */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Revisões por Tipo de Exame
              </h3>
              {stats?.revisaoExame && Object.keys(stats.revisaoExame.byExamType).length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={Object.entries(stats.revisaoExame.byExamType).map(([name, value]) => ({
                        name: examTypeLabels[name] || name,
                        value,
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" fill="#8B5CF6" name="Revisões" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhuma revisão de exame registrada ainda
                </div>
              )}
            </div>

            {/* By Doctor */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Revisões por Médico Responsável
              </h3>
              {stats?.revisaoExame && Object.keys(stats.revisaoExame.byDoctor).length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={Object.entries(stats.revisaoExame.byDoctor)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .slice(0, 10)
                        .map(([name, value]) => ({
                          name: name.length > 20 ? name.substring(0, 20) + "..." : name,
                          value,
                        }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={150}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="value" fill="#EC4899" name="Revisões" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum médico registrado em revisões ainda
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">Assistenciais</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats?.byType.assistencial || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">ocorrências</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-muted-foreground">Administrativas</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats?.byType.administrativa || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">ocorrências</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw className="h-5 w-5 text-amber-600" />
              <p className="text-sm text-muted-foreground">Técnicas</p>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats?.byType.tecnica || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">ocorrências</p>
          </div>
        </div>

        {/* Revisão de Exame Summary */}
        {stats?.revisaoExame && stats.revisaoExame.total > 0 && (
          <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
            <div className="flex items-center gap-3 mb-3">
              <Activity className="h-5 w-5 text-purple-600" />
              <p className="text-sm text-purple-800 font-medium">Revisões de Exame</p>
            </div>
            <p className="text-3xl font-bold text-purple-900">
              {stats.revisaoExame.total}
            </p>
            <p className="text-xs text-purple-700 mt-1">
              {Object.keys(stats.revisaoExame.byDoctor).length} médicos • {Object.keys(stats.revisaoExame.byExamType).length} tipos de exame
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
