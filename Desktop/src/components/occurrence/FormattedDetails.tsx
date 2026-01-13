import { cn } from "@/lib/utils";

interface FormattedDetailsProps {
  content: string;
  className?: string;
}

const fieldLabels: Record<string, string> = {
  etapaPercebida: "Etapa Percebida",
  comoDetectado: "Como foi Detectado",
  divergencia: "Tipo de Divergência",
  exameStatus: "Status do Exame",
  impactoImediato: "Impacto Imediato",
  medidasCorrecao: "Medidas de Correção",
  fatoresContribuintes: "Fatores Contribuintes",
  localExtravasamento: "Local do Extravasamento",
  volumeExtravasado: "Volume Extravasado",
  sintomasObservados: "Sintomas Observados",
  condutas: "Condutas Tomadas",
  tipoQueda: "Tipo de Queda",
  localQueda: "Local da Queda",
  consequencias: "Consequências",
  motivoRevisao: "Motivo da Revisão",
  tipoAlteracao: "Tipo de Alteração",
  acaoCorretiva: "Ação Corretiva",
};

export function FormattedDetails({ content, className }: FormattedDetailsProps) {
  // Tenta parsear como JSON
  try {
    const parsed = JSON.parse(content);
    
    if (typeof parsed === "object" && parsed !== null) {
      const entries = Object.entries(parsed).filter(([_, value]) => value);
      
      if (entries.length === 0) {
        return <p className={cn("text-foreground", className)}>{content}</p>;
      }
      
      return (
        <div className={cn("space-y-3", className)}>
          {entries.map(([key, value]) => (
            <div key={key} className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {fieldLabels[key] || key.replace(/([A-Z])/g, " $1").trim()}
              </p>
              <p className="text-sm text-foreground">
                {String(value)}
              </p>
            </div>
          ))}
        </div>
      );
    }
  } catch {
    // Não é JSON, retorna texto normal
  }
  
  return <p className={cn("text-foreground whitespace-pre-wrap", className)}>{content}</p>;
}
