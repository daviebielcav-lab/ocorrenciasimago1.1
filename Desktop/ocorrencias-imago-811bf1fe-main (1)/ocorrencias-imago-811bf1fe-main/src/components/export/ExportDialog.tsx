import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Loader2,
  FileCheck,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Occurrence } from "@/types/occurrence";
import { downloadOccurrencePDF } from "@/lib/pdf/occurrence-pdf";
import { downloadReportPDF } from "@/lib/pdf/report-pdf";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "single" | "report";
  occurrence?: Occurrence;
  occurrences?: Partial<Occurrence>[];
  tenantName?: string;
}

export function ExportDialog({
  open,
  onOpenChange,
  mode,
  occurrence,
  occurrences = [],
  tenantName = "Clínica São Lucas",
}: ExportDialogProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [anonymize, setAnonymize] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  // Single export options
  const [includeHistory, setIncludeHistory] = useState(true);
  const [includeOutcome, setIncludeOutcome] = useState(true);
  const [includeCapa, setIncludeCapa] = useState(true);
  const [includeAttachments, setIncludeAttachments] = useState(true);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      await new Promise((r) => setTimeout(r, 500)); // Simulate processing

      if (mode === "single" && occurrence) {
        downloadOccurrencePDF(occurrence, anonymize);
        toast({
          title: "PDF exportado",
          description: `Arquivo ${occurrence.protocolo}.pdf baixado com sucesso.`,
        });
      } else if (mode === "report") {
        downloadReportPDF(
          occurrences,
          reportPeriod,
          tenantName,
          dateFrom ? new Date(dateFrom) : undefined,
          dateTo ? new Date(dateTo) : undefined
        );
        toast({
          title: "Relatório exportado",
          description: "Arquivo PDF baixado com sucesso.",
        });
      }

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {mode === "single" ? "Exportar Ocorrência" : "Exportar Relatório"}
          </DialogTitle>
          <DialogDescription>
            {mode === "single"
              ? "Configure as opções de exportação do PDF"
              : "Selecione o período e configure o relatório"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Period Selection */}
          {mode === "report" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Período do Relatório</Label>
                <Select value={reportPeriod} onValueChange={(v) => setReportPeriod(v as any)}>
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário (Hoje)</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="custom">Período Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportPeriod === "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data Inicial</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Final</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Single Export Options */}
          {mode === "single" && (
            <div className="space-y-3">
              <Label className="text-muted-foreground">Incluir no PDF:</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="history"
                    checked={includeHistory}
                    onCheckedChange={(c) => setIncludeHistory(!!c)}
                  />
                  <label htmlFor="history" className="text-sm">
                    Histórico de alterações
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="outcome"
                    checked={includeOutcome}
                    onCheckedChange={(c) => setIncludeOutcome(!!c)}
                  />
                  <label htmlFor="outcome" className="text-sm">
                    Desfecho e justificativa
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="capa"
                    checked={includeCapa}
                    onCheckedChange={(c) => setIncludeCapa(!!c)}
                  />
                  <label htmlFor="capa" className="text-sm">
                    Ações corretivas (CAPA)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attachments"
                    checked={includeAttachments}
                    onCheckedChange={(c) => setIncludeAttachments(!!c)}
                  />
                  <label htmlFor="attachments" className="text-sm">
                    Lista de anexos
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* LGPD / Anonymization */}
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="anonymize"
                checked={anonymize}
                onCheckedChange={(c) => setAnonymize(!!c)}
              />
              <div>
                <label
                  htmlFor="anonymize"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <Shield className="h-4 w-4 text-warning" />
                  Anonimizar dados pessoais (LGPD)
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Nome, telefone e data de nascimento serão ocultados
                </p>
              </div>
            </div>
          </div>

          {/* Preview indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {anonymize ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span>Dados pessoais serão anonimizados</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span>Dados completos serão exportados</span>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
