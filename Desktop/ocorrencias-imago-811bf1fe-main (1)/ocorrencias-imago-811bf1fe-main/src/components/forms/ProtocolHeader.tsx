import { FileCheck, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { OccurrenceType } from "@/types/occurrence";

interface ProtocolHeaderProps {
  protocolo?: string;
  tipo: OccurrenceType;
  isNew?: boolean;
}

const typeLabels: Record<OccurrenceType, string> = {
  assistencial: "Ocorrência Assistencial",
  administrativa: "Ocorrência Administrativa",
  tecnica: "Ocorrência Técnica",
  revisao_exame: "Revisão de Exame",
};

const typeColors: Record<OccurrenceType, string> = {
  assistencial: "bg-occurrence-assistencial/10 text-occurrence-assistencial border-occurrence-assistencial/20",
  administrativa: "bg-occurrence-administrativa/10 text-occurrence-administrativa border-occurrence-administrativa/20",
  tecnica: "bg-occurrence-tecnica/10 text-occurrence-tecnica border-occurrence-tecnica/20",
  revisao_exame: "bg-primary/10 text-primary border-primary/20",
};

export function ProtocolHeader({ protocolo, tipo, isNew = true }: ProtocolHeaderProps) {
  const now = new Date();
  const formattedDate = format(now, "dd 'de' MMMM 'de' yyyy, HH:mm", {
    locale: ptBR,
  });

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <FileCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${typeColors[tipo]}`}
              >
                {typeLabels[tipo]}
              </span>
              {isNew && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Nova
                </span>
              )}
            </div>
            <div className="mt-1">
              {protocolo ? (
                <p className="text-lg font-mono font-bold text-foreground">
                  {protocolo}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Protocolo será gerado ao salvar
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
}
