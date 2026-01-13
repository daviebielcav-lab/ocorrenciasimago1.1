import { useState, useEffect } from "react";
import { Check, Zap, MessageCircle, GraduationCap, FileCog, Wrench, Send, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OutcomeType, outcomeConfig, OccurrenceOutcome } from "@/types/occurrence";

interface OutcomeSelectorProps {
  value?: Partial<OccurrenceOutcome>;
  onChange: (outcome: Partial<OccurrenceOutcome>) => void;
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

export function OutcomeSelector({ value, onChange }: OutcomeSelectorProps) {
  const [selectedOutcomes, setSelectedOutcomes] = useState<OutcomeType[]>(value?.tipos || []);
  const [justificativa, setJustificativa] = useState(value?.justificativa || "");
  const [desfechoPrincipal, setDesfechoPrincipal] = useState<OutcomeType | undefined>(
    value?.desfechoPrincipal
  );

  useEffect(() => {
    onChange({
      ...value,
      tipos: selectedOutcomes,
      justificativa,
      desfechoPrincipal,
    });
  }, [selectedOutcomes, justificativa, desfechoPrincipal]);

  const toggleOutcome = (outcome: OutcomeType) => {
    if (outcome === "improcedente") {
      // Improcedente is exclusive
      if (selectedOutcomes.includes("improcedente")) {
        setSelectedOutcomes([]);
      } else {
        setSelectedOutcomes(["improcedente"]);
        setDesfechoPrincipal("improcedente");
      }
    } else {
      // Remove improcedente if selecting other outcomes
      const withoutImprocedente = selectedOutcomes.filter((o) => o !== "improcedente");
      if (selectedOutcomes.includes(outcome)) {
        const newOutcomes = withoutImprocedente.filter((o) => o !== outcome);
        setSelectedOutcomes(newOutcomes);
        if (desfechoPrincipal === outcome) {
          setDesfechoPrincipal(newOutcomes[0]);
        }
      } else {
        setSelectedOutcomes([...withoutImprocedente, outcome]);
      }
    }
  };

  const isImprocedente = selectedOutcomes.includes("improcedente");

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Desfechos da Ocorrência
        </h3>
        <p className="text-sm text-muted-foreground">
          Selecione um ou mais desfechos aplicáveis a esta ocorrência
        </p>
      </div>

      {/* Outcome Grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {outcomeOrder.map((outcome) => {
          const config = outcomeConfig[outcome];
          const Icon = iconMap[config.icon as keyof typeof iconMap];
          const isSelected = selectedOutcomes.includes(outcome);
          const isDisabled = isImprocedente && outcome !== "improcedente";

          return (
            <button
              key={outcome}
              onClick={() => toggleOutcome(outcome)}
              disabled={isDisabled}
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all",
                isSelected
                  ? outcome === "improcedente"
                    ? "border-gray-400 bg-gray-100"
                    : "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                  isSelected
                    ? outcome === "improcedente"
                      ? "bg-gray-500 border-gray-500 text-white"
                      : "bg-primary border-primary text-primary-foreground"
                    : "border-border"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon className={cn(
                    "h-4 w-4",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="font-medium text-foreground text-sm">
                    {config.label}
                  </span>
                  {config.requiresCapa && (
                    <span className="text-xs px-1.5 py-0.5 bg-warning/20 text-warning rounded">
                      CAPA
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {config.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Justificativa */}
      <div className="space-y-2">
        <Label className="text-foreground">
          Justificativa do desfecho <span className="text-destructive">*</span>
        </Label>
        <Textarea
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          placeholder="Descreva a justificativa para os desfechos selecionados..."
          className="min-h-[100px] bg-background resize-none"
        />
      </div>

      {/* Desfecho Principal */}
      {selectedOutcomes.length > 1 && !isImprocedente && (
        <div className="space-y-2">
          <Label className="text-foreground">
            Desfecho principal <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Select
            value={desfechoPrincipal}
            onValueChange={(val) => setDesfechoPrincipal(val as OutcomeType)}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Selecione o desfecho principal" />
            </SelectTrigger>
            <SelectContent>
              {selectedOutcomes.map((outcome) => (
                <SelectItem key={outcome} value={outcome}>
                  {outcomeConfig[outcome].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
