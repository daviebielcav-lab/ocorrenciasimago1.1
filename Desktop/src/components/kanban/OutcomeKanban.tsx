import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Clock, Zap, MessageCircle, GraduationCap, FileCog, Wrench, Send, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Occurrence, OutcomeType, outcomeConfig } from "@/types/occurrence";

interface OutcomeKanbanProps {
  occurrences: Partial<Occurrence>[];
}

const outcomeOrder: OutcomeType[] = [
  "imediato_correcao",
  "orientacao",
  "treinamento",
  "alteracao_processo",
  "manutencao_corretiva",
  "notificacao_externa",
  "improcedente",
];

const iconMap = {
  "zap": Zap,
  "message-circle": MessageCircle,
  "graduation-cap": GraduationCap,
  "file-cog": FileCog,
  "wrench": Wrench,
  "send": Send,
  "x-circle": XCircle,
};

const outcomeColors: Record<OutcomeType, { bg: string; text: string; border: string }> = {
  imediato_correcao: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  orientacao: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  treinamento: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  alteracao_processo: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  manutencao_corretiva: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  notificacao_externa: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  improcedente: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
};

export function OutcomeKanban({ occurrences }: OutcomeKanbanProps) {
  const navigate = useNavigate();

  const getOccurrencesByOutcome = (outcome: OutcomeType) => {
    return occurrences.filter(
      (occ) => occ.desfecho?.tipos?.includes(outcome)
    );
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {outcomeOrder.map((outcome) => {
        const config = outcomeConfig[outcome];
        const colors = outcomeColors[outcome];
        const Icon = iconMap[config.icon as keyof typeof iconMap];
        const items = getOccurrencesByOutcome(outcome);

        return (
          <div
            key={outcome}
            className={cn(
              "flex-shrink-0 w-[280px] rounded-xl border bg-card",
              colors.border
            )}
          >
            {/* Column Header */}
            <div className={cn("p-4 border-b rounded-t-xl", colors.bg, colors.border)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-5 w-5", colors.text)} />
                  <h3 className={cn("font-semibold text-sm", colors.text)}>
                    {config.label}
                  </h3>
                </div>
                <span
                  className={cn(
                    "text-sm font-bold px-2 py-0.5 rounded-full",
                    colors.bg,
                    colors.text
                  )}
                >
                  {items.length}
                </span>
              </div>
            </div>

            {/* Column Content */}
            <div className="p-3 min-h-[350px]">
              {items.map((occ) => (
                <div
                  key={occ.id}
                  onClick={() => navigate(`/ocorrencias/${occ.id}`)}
                  className="bg-background border border-border rounded-lg p-3 mb-2 hover:shadow-md cursor-pointer transition-shadow group"
                >
                  <p className="font-mono text-xs text-primary font-medium truncate">
                    {occ.protocolo}
                  </p>
                  <p className="text-sm font-medium text-foreground mt-1 truncate">
                    {occ.paciente?.nomeCompleto}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={occ.tipo as any} className="text-xs">
                      {occ.tipo}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(occ.criadoEm!), "dd/MM", { locale: ptBR })}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/ocorrencias/${occ.id}`);
                      }}
                      className="p-1 rounded hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Nenhuma ocorrência
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
