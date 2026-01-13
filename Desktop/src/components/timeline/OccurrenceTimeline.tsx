import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  MessageSquare,
  Paperclip,
  History,
  User,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusChange, statusConfig, OccurrenceStatus } from "@/types/occurrence";

interface TimelineEvent {
  id: string;
  type: "status_change" | "comment" | "attachment" | "triage" | "outcome";
  title: string;
  description?: string;
  user: string;
  date: string;
  metadata?: any;
}

interface OccurrenceTimelineProps {
  events: TimelineEvent[];
}

const eventConfig = {
  status_change: {
    icon: ArrowRight,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  comment: {
    icon: MessageSquare,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  attachment: {
    icon: Paperclip,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  triage: {
    icon: History,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  outcome: {
    icon: ChevronRight,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
};

export function OccurrenceTimeline({ events }: OccurrenceTimelineProps) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const config = eventConfig[event.type];
          const Icon = config.icon;

          return (
            <div key={event.id} className="relative flex gap-4 pl-1">
              {/* Icon */}
              <div
                className={cn(
                  "relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background",
                  config.bgColor
                )}
              >
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{event.title}</p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                    <p>
                      {format(new Date(event.date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                    <p>{format(new Date(event.date), "HH:mm")}</p>
                  </div>
                </div>

                {/* User */}
                <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{event.user}</span>
                </div>

                {/* Status change visualization */}
                {event.type === "status_change" && event.metadata && (
                  <div className="flex items-center gap-2 mt-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs rounded-full",
                        statusConfig[event.metadata.de as OccurrenceStatus]?.bgColor,
                        statusConfig[event.metadata.de as OccurrenceStatus]?.color
                      )}
                    >
                      {statusConfig[event.metadata.de as OccurrenceStatus]?.label}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs rounded-full",
                        statusConfig[event.metadata.para as OccurrenceStatus]?.bgColor,
                        statusConfig[event.metadata.para as OccurrenceStatus]?.color
                      )}
                    >
                      {statusConfig[event.metadata.para as OccurrenceStatus]?.label}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mock events for demonstration
export const mockTimelineEvents: TimelineEvent[] = [
  {
    id: "1",
    type: "status_change",
    title: "Ocorrência registrada",
    description: "Nova ocorrência criada no sistema",
    user: "Dr. Carlos Silva",
    date: "2024-01-15T15:00:00",
    metadata: { de: "registrada", para: "registrada" },
  },
  {
    id: "2",
    type: "status_change",
    title: "Status alterado",
    user: "Sistema",
    date: "2024-01-15T15:00:00",
    metadata: { de: "registrada", para: "em_triagem" },
  },
  {
    id: "3",
    type: "triage",
    title: "Triagem realizada",
    description: "Classificada como Near Miss",
    user: "Dr. Carlos Silva",
    date: "2024-01-15T15:30:00",
  },
  {
    id: "4",
    type: "status_change",
    title: "Status alterado",
    user: "Dr. Carlos Silva",
    date: "2024-01-15T15:30:00",
    metadata: { de: "em_triagem", para: "em_analise" },
  },
  {
    id: "5",
    type: "comment",
    title: "Comentário adicionado",
    description: "Verificação realizada com a equipe de recepção. Confirmado erro de digitação no CPF.",
    user: "Enf. Ana Costa",
    date: "2024-01-15T16:00:00",
  },
  {
    id: "6",
    type: "attachment",
    title: "Anexo adicionado",
    description: "print_sistema.png",
    user: "Enf. Ana Costa",
    date: "2024-01-15T16:05:00",
  },
  {
    id: "7",
    type: "outcome",
    title: "Desfecho definido",
    description: "Orientação e Treinamento selecionados como desfecho",
    user: "Dr. Carlos Silva",
    date: "2024-01-15T17:00:00",
  },
];
