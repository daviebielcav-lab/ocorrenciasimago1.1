import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  Filter,
  Eye,
  Calendar,
  Download,
  SlidersHorizontal,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TriageBadge } from "@/components/triage/TriageBadge";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  OccurrenceStatus,
  OccurrenceType,
  statusConfig,
  triageConfig,
  outcomeConfig,
  TriageClassification,
  OutcomeType,
} from "@/types/occurrence";
import { useOccurrences } from "@/hooks/useOccurrences";

const typeLabels: Record<OccurrenceType, string> = {
  assistencial: "Assistencial",
  administrativa: "Administrativa",
  tecnica: "Técnica",
  revisao_exame: "Revisão de Exame",
};

interface Filters {
  search: string;
  dateFrom: string;
  dateTo: string;
  tipo: string;
  subtipo: string;
  triagem: string;
  status: string;
  desfecho: string;
  usuario: string;
}

export default function Analise() {
  const navigate = useNavigate();
  const { data: occurrences = [], isLoading } = useOccurrences();

  const [filters, setFilters] = useState<Filters>({
    search: "",
    dateFrom: "",
    dateTo: "",
    tipo: "all",
    subtipo: "all",
    triagem: "all",
    status: "all",
    desfecho: "all",
    usuario: "all",
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      dateFrom: "",
      dateTo: "",
      tipo: "all",
      subtipo: "all",
      triagem: "all",
      status: "all",
      desfecho: "all",
      usuario: "all",
    });
  };

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && value !== "all" && value !== ""
  ).length;

  const filteredOccurrences = occurrences.filter((occ) => {
    const matchesSearch =
      !filters.search ||
      occ.protocolo?.toLowerCase().includes(filters.search.toLowerCase()) ||
      occ.paciente_nome_completo?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesDateFrom =
      !filters.dateFrom || new Date(occ.criado_em) >= new Date(filters.dateFrom);
    const matchesDateTo =
      !filters.dateTo || new Date(occ.criado_em) <= new Date(filters.dateTo);

    const matchesTipo = filters.tipo === "all" || occ.tipo === filters.tipo;
    const matchesSubtipo = filters.subtipo === "all" || occ.subtipo === filters.subtipo;
    const matchesTriagem = filters.triagem === "all" || occ.triagem === filters.triagem;
    const matchesStatus = filters.status === "all" || occ.status === filters.status;
    const matchesDesfecho =
      filters.desfecho === "all" ||
      occ.desfecho_tipos?.includes(filters.desfecho as OutcomeType);
    const matchesUsuario =
      filters.usuario === "all" || occ.criador_nome === filters.usuario;

    return (
      matchesSearch &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesTipo &&
      matchesSubtipo &&
      matchesTriagem &&
      matchesStatus &&
      matchesDesfecho &&
      matchesUsuario
    );
  });

  const uniqueUsers = [...new Set(occurrences.map((o) => o.criador_nome).filter(Boolean))];

  return (
    <MainLayout>
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Análise</h1>
              <p className="text-sm text-muted-foreground">
                Filtre e analise ocorrências detalhadamente
              </p>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>

        {/* Search and Basic Filters */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por protocolo ou paciente..."
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Período
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data inicial</label>
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => updateFilter("dateFrom", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data final</label>
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => updateFilter("dateTo", e.target.value)}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant={showAdvancedFilters ? "secondary" : "outline"}
                className="gap-2"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 pt-4 border-t border-border">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <Select value={filters.tipo} onValueChange={(v) => updateFilter("tipo", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="assistencial">Assistencial</SelectItem>
                    <SelectItem value="administrativa">Administrativa</SelectItem>
                    <SelectItem value="tecnica">Técnica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Triagem</label>
                <Select value={filters.triagem} onValueChange={(v) => updateFilter("triagem", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {Object.entries(triageConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Desfecho</label>
                <Select value={filters.desfecho} onValueChange={(v) => updateFilter("desfecho", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {Object.entries(outcomeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Usuário</label>
                <Select value={filters.usuario} onValueChange={(v) => updateFilter("usuario", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user} value={user!}>
                        {user}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredOccurrences.length}</span>{" "}
              ocorrências encontradas
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Protocolo</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Paciente</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Triagem</TableHead>
                <TableHead className="font-semibold">Desfecho</TableHead>
                <TableHead className="font-semibold">Registrado por</TableHead>
                <TableHead className="font-semibold">Data</TableHead>
                <TableHead className="text-right font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Carregando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredOccurrences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <p className="text-muted-foreground">
                      Nenhuma ocorrência encontrada com os filtros aplicados
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOccurrences.map((occ) => (
                  <TableRow
                    key={occ.id}
                    className="cursor-pointer hover:bg-muted/30"
                    onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                  >
                    <TableCell className="font-mono font-medium text-primary">
                      {occ.protocolo}
                    </TableCell>
                    <TableCell>
                      <Badge variant={occ.tipo as any}>
                        {typeLabels[occ.tipo as OccurrenceType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{occ.paciente_nome_completo || "-"}</p>
                        <p className="text-xs text-muted-foreground">
                          {occ.paciente_unidade_local || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                          statusConfig[occ.status as OccurrenceStatus].bgColor
                        } ${statusConfig[occ.status as OccurrenceStatus].color}`}
                      >
                        {statusConfig[occ.status as OccurrenceStatus].label}
                      </span>
                    </TableCell>
                    <TableCell>
                      {occ.triagem ? (
                        <TriageBadge triage={occ.triagem as TriageClassification} size="sm" />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {occ.desfecho_tipos?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {occ.desfecho_tipos.slice(0, 2).map((d) => (
                            <span
                              key={d}
                              className="text-xs px-1.5 py-0.5 bg-secondary rounded"
                            >
                              {outcomeConfig[d as OutcomeType]?.label?.split("/")[0] || d}
                            </span>
                          ))}
                          {occ.desfecho_tipos.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{occ.desfecho_tipos.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{occ.criador_nome || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(occ.criado_em), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/ocorrencias/${occ.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}
