import { useState } from "react";
import { AlertTriangle, Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TriageClassification, triageConfig } from "@/types/occurrence";

interface TriageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTriage?: TriageClassification;
  onTriageSelect: (triage: TriageClassification) => void;
}

const triageOrder: TriageClassification[] = [
  "circunstancia_risco",
  "near_miss",
  "incidente_sem_dano",
  "evento_adverso",
  "evento_sentinela",
];

export function TriageSelector({
  open,
  onOpenChange,
  currentTriage,
  onTriageSelect,
}: TriageSelectorProps) {
  const [selected, setSelected] = useState<TriageClassification | undefined>(
    currentTriage
  );

  const handleConfirm = () => {
    if (selected) {
      onTriageSelect(selected);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Classificação de Triagem
          </DialogTitle>
          <DialogDescription>
            Selecione a classificação adequada baseada na gravidade do evento.
            Esta ação define prioridade, SLA e destaque no sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {triageOrder.map((triage) => {
            const config = triageConfig[triage];
            const isSelected = selected === triage;

            return (
              <button
                key={triage}
                onClick={() => setSelected(triage)}
                className={cn(
                  "w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-secondary/50"
                )}
              >
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full shrink-0 mt-0.5",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}
                >
                  {isSelected ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      {config.priority}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {config.label}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border",
                        config.color
                      )}
                    >
                      Nível {config.priority}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {config.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-lg bg-info/10 p-3 flex items-start gap-2">
          <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            A triagem é única por ocorrência e só pode ser realizada pelo
            administrador. Esta classificação afeta o SLA e a priorização no
            sistema.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!selected}>
            Confirmar Triagem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
