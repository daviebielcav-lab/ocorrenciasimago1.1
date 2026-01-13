import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { OccurrenceStatus, statusConfig, statusTransitions } from "@/types/occurrence";

interface StatusFlowProps {
  currentStatus: OccurrenceStatus;
  onStatusChange?: (newStatus: OccurrenceStatus) => void;
  isAdmin?: boolean;
}

const statusOrder: OccurrenceStatus[] = [
  "registrada",
  "em_triagem",
  "em_analise",
  "acao_em_andamento",
  "concluida",
];

export function StatusFlow({ currentStatus, onStatusChange, isAdmin = false }: StatusFlowProps) {
  const currentIndex = statusOrder.indexOf(currentStatus);
  const isImprocedente = currentStatus === "improcedente";
  const availableTransitions = statusTransitions[currentStatus] || [];

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
        Fluxo de Status
      </h3>

      {isImprocedente ? (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-600">
            <Circle className="h-4 w-4 fill-current" />
            <span className="font-medium">Improcedente</span>
          </div>
        </div>
      ) : (
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
          <div
            className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
            style={{ width: `${(currentIndex / (statusOrder.length - 1)) * 100}%` }}
          />

          {/* Status Steps */}
          <div className="relative flex justify-between">
            {statusOrder.map((status, index) => {
              const config = statusConfig[status];
              const isCompleted = index < currentIndex;
              const isCurrent = index === currentIndex;
              const canTransition = isAdmin && availableTransitions.includes(status);

              return (
                <button
                  key={status}
                  onClick={() => canTransition && onStatusChange?.(status)}
                  disabled={!canTransition}
                  className={cn(
                    "flex flex-col items-center gap-2 group",
                    canTransition && "cursor-pointer"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                      isCompleted && "bg-primary border-primary text-primary-foreground",
                      isCurrent && "bg-primary/10 border-primary text-primary",
                      !isCompleted && !isCurrent && "bg-background border-border text-muted-foreground",
                      canTransition && "hover:border-primary hover:bg-primary/5"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        isCurrent ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {config.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Status Info */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Status Atual: {statusConfig[currentStatus].label}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {statusConfig[currentStatus].description}
            </p>
          </div>
          {isAdmin && availableTransitions.length > 0 && (
            <div className="flex gap-2">
              {availableTransitions.map((nextStatus) => (
                <button
                  key={nextStatus}
                  onClick={() => onStatusChange?.(nextStatus)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                    nextStatus === "improcedente"
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  → {statusConfig[nextStatus].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
