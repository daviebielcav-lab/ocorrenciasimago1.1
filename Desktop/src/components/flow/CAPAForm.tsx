import { useState } from "react";
import { Plus, Trash2, ClipboardCheck, Search, User, Calendar, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CAPA } from "@/types/occurrence";

interface CAPAFormProps {
  value: CAPA[];
  onChange: (capas: CAPA[]) => void;
  triggerOutcomes: string[];
}

const capaStatusConfig = {
  pendente: { label: "Pendente", color: "bg-gray-100 text-gray-700" },
  em_andamento: { label: "Em Andamento", color: "bg-blue-100 text-blue-700" },
  concluida: { label: "Concluída", color: "bg-green-100 text-green-700" },
  verificada: { label: "Verificada", color: "bg-purple-100 text-purple-700" },
};

export function CAPAForm({ value, onChange, triggerOutcomes }: CAPAFormProps) {
  const addCapa = () => {
    const newCapa: CAPA = {
      id: `capa-${Date.now()}`,
      causaRaiz: "",
      acao: "",
      responsavel: "",
      prazo: "",
      status: "pendente",
    };
    onChange([...value, newCapa]);
  };

  const updateCapa = (id: string, field: keyof CAPA, val: string) => {
    onChange(
      value.map((capa) =>
        capa.id === id ? { ...capa, [field]: val } : capa
      )
    );
  };

  const removeCapa = (id: string) => {
    onChange(value.filter((capa) => capa.id !== id));
  };

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              CAPA - Ação Corretiva e Preventiva
            </h3>
            <p className="text-sm text-muted-foreground">
              Requerido para: {triggerOutcomes.join(", ")}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCapa}
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar CAPA
        </Button>
      </div>

      {value.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhuma CAPA cadastrada. Adicione pelo menos uma ação corretiva/preventiva.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCapa}
            className="mt-3"
          >
            <Plus className="h-4 w-4 mr-1" />
            Criar primeira CAPA
          </Button>
        </div>
      )}

      {/* CAPA List */}
      <div className="space-y-4">
        {value.map((capa, index) => (
          <div
            key={capa.id}
            className="rounded-lg border border-border bg-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {index + 1}
                </span>
                <span className="font-medium text-foreground">CAPA #{index + 1}</span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    capaStatusConfig[capa.status].color
                  )}
                >
                  {capaStatusConfig[capa.status].label}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCapa(capa.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Causa Raiz */}
              <div className="md:col-span-2 space-y-2">
                <Label className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  Causa Raiz <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={capa.causaRaiz}
                  onChange={(e) => updateCapa(capa.id, "causaRaiz", e.target.value)}
                  placeholder="Descreva a causa raiz identificada..."
                  className="min-h-[80px] bg-background resize-none"
                />
              </div>

              {/* Ação */}
              <div className="md:col-span-2 space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Ação <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={capa.acao}
                  onChange={(e) => updateCapa(capa.id, "acao", e.target.value)}
                  placeholder="Descreva a ação corretiva/preventiva a ser tomada..."
                  className="min-h-[80px] bg-background resize-none"
                />
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Responsável <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={capa.responsavel}
                  onChange={(e) => updateCapa(capa.id, "responsavel", e.target.value)}
                  placeholder="Nome do responsável"
                  className="bg-background"
                />
              </div>

              {/* Prazo */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Prazo <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  value={capa.prazo}
                  onChange={(e) => updateCapa(capa.id, "prazo", e.target.value)}
                  className="bg-background"
                />
              </div>

              {/* Evidência */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Evidência <span className="text-muted-foreground">(opcional)</span>
                </Label>
                <Input
                  value={capa.evidencia || ""}
                  onChange={(e) => updateCapa(capa.id, "evidencia", e.target.value)}
                  placeholder="Link ou descrição da evidência"
                  className="bg-background"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Status
                </Label>
                <Select
                  value={capa.status}
                  onValueChange={(val) => updateCapa(capa.id, "status", val)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(capaStatusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Verificação de Eficácia */}
              <div className="md:col-span-2 space-y-2">
                <Label className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  Verificação de Eficácia{" "}
                  <span className="text-muted-foreground">(preencher após conclusão)</span>
                </Label>
                <Textarea
                  value={capa.verificacaoEficacia || ""}
                  onChange={(e) =>
                    updateCapa(capa.id, "verificacaoEficacia", e.target.value)
                  }
                  placeholder="Descreva como a eficácia da ação foi verificada..."
                  className="min-h-[60px] bg-background resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
