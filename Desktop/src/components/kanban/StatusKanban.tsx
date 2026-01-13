import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { GripVertical, Eye, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TriageBadge } from "@/components/triage/TriageBadge";
import {
  Occurrence,
  OccurrenceStatus,
  statusConfig,
  statusTransitions,
  TriageClassification,
} from "@/types/occurrence";

interface StatusKanbanProps {
  occurrences: Partial<Occurrence>[];
  onStatusChange?: (occurrenceId: string, newStatus: OccurrenceStatus) => void;
  isAdmin?: boolean;
}

const statusOrder: OccurrenceStatus[] = [
  "registrada",
  "em_triagem",
  "em_analise",
  "acao_em_andamento",
  "concluida",
  "improcedente",
];

export function StatusKanban({
  occurrences,
  onStatusChange,
  isAdmin = false,
}: StatusKanbanProps) {
  const navigate = useNavigate();

  const getOccurrencesByStatus = (status: OccurrenceStatus) => {
    return occurrences.filter((occ) => occ.status === status);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !isAdmin) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as OccurrenceStatus;
    const occurrence = occurrences.find((o) => o.id === draggableId);

    if (occurrence && occurrence.status) {
      const validTransitions = statusTransitions[occurrence.status];
      if (validTransitions.includes(newStatus)) {
        onStatusChange?.(draggableId, newStatus);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusOrder.map((status) => {
          const config = statusConfig[status];
          const items = getOccurrencesByStatus(status);

          return (
            <div
              key={status}
              className="flex-shrink-0 w-[300px] rounded-xl border border-border bg-card"
            >
              {/* Column Header */}
              <div
                className={cn(
                  "p-4 border-b border-border rounded-t-xl",
                  config.bgColor
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className={cn("font-semibold", config.color)}>
                    {config.label}
                  </h3>
                  <span
                    className={cn(
                      "text-sm font-bold px-2 py-0.5 rounded-full",
                      config.bgColor,
                      config.color
                    )}
                  >
                    {items.length}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.description}
                </p>
              </div>

              {/* Column Content */}
              <Droppable droppableId={status} isDropDisabled={!isAdmin}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "p-3 min-h-[400px] transition-colors",
                      snapshot.isDraggingOver && "bg-primary/5"
                    )}
                  >
                    {items.map((occ, index) => (
                      <Draggable
                        key={occ.id}
                        draggableId={occ.id!}
                        index={index}
                        isDragDisabled={!isAdmin}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={cn(
                              "bg-background border border-border rounded-lg p-3 mb-2 transition-all",
                              snapshot.isDragging && "shadow-xl ring-2 ring-primary rotate-2 scale-105",
                              !snapshot.isDragging && "hover:shadow-md",
                              isAdmin && "cursor-grab active:cursor-grabbing",
                              "group"
                            )}
                            onClick={() => !snapshot.isDragging && navigate(`/ocorrencias/${occ.id}`)}
                          >
                            <div className="flex items-start gap-2">
                              {isAdmin && (
                                <div className="mt-1 text-muted-foreground">
                                  <GripVertical className="h-4 w-4" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
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
                                  {occ.triagem && (
                                    <TriageBadge
                                      triage={occ.triagem as TriageClassification}
                                      size="sm"
                                    />
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(occ.criadoEm!), "dd/MM HH:mm", {
                                    locale: ptBR,
                                  })}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/ocorrencias/${occ.id}`);
                                }}
                                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                              >
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {items.length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        Nenhuma ocorrência
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
