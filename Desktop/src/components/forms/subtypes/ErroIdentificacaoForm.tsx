import { UseFormReturn } from "react-hook-form";
import { UserX } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { OccurrenceFormData } from "@/types/occurrence";

interface ErroIdentificacaoFormProps {
  form: UseFormReturn<OccurrenceFormData>;
}

export function ErroIdentificacaoForm({ form }: ErroIdentificacaoFormProps) {
  const dados = (form.watch("dadosEspecificos") as any) || {};

  const updateDados = (field: string, value: any) => {
    form.setValue("dadosEspecificos", {
      ...dados,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Resumo do subtipo */}
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
        <div className="flex items-start gap-3">
          <UserX className="h-5 w-5 text-rose-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-rose-900">Erro de Identificação do Paciente</h4>
            <p className="text-sm text-rose-700 mt-1">
              Registre detalhes sobre divergências na identificação do paciente em qualquer etapa do atendimento.
            </p>
          </div>
        </div>
      </div>

      {/* Detecção do Erro */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Detecção do Erro</h3>
        
        <div className="space-y-2">
          <FormLabel>Em qual etapa o erro foi percebido?</FormLabel>
          <Input
            placeholder="Ex: Cadastro, Triagem, Sala de Exame, Laudo, Entrega..."
            value={dados.etapaPercebida || ""}
            onChange={(e) => updateDados("etapaPercebida", e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Como o erro foi detectado?</FormLabel>
          <Input
            placeholder="Ex: Conferência verbal, Alerta do sistema, Comparação com pedido médico..."
            value={dados.comoDetectado || ""}
            onChange={(e) => updateDados("comoDetectado", e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      {/* Divergência Identificada */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Divergência Identificada</h3>
        
        <div className="space-y-2">
          <FormLabel>O que estava divergente?</FormLabel>
          <Input
            placeholder="Ex: Nome, Data de nascimento, Documento, Prontuário..."
            value={dados.divergencia || ""}
            onChange={(e) => updateDados("divergencia", e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <FormLabel>O exame chegou a iniciar?</FormLabel>
          <Input
            placeholder="Ex: Não iniciou, Iniciou e foi interrompido, Foi realizado"
            value={dados.exameStatus || ""}
            onChange={(e) => updateDados("exameStatus", e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      {/* Impacto e Correção */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Impacto e Correção</h3>
        
        <div className="space-y-2">
          <FormLabel>Impacto imediato</FormLabel>
          <Input
            placeholder="Ex: Atraso, Repetição, Risco evitado, Nenhum..."
            value={dados.impactoImediato || ""}
            onChange={(e) => updateDados("impactoImediato", e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Medidas de correção tomadas</FormLabel>
          <Textarea
            placeholder="Descreva as medidas tomadas para corrigir o erro..."
            value={dados.medidasCorrecao || ""}
            onChange={(e) => updateDados("medidasCorrecao", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Fatores Contribuintes */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Fatores Contribuintes</h3>
        
        <div className="space-y-2">
          <FormLabel>Possíveis fatores que contribuíram</FormLabel>
          <Textarea
            placeholder="Ex: Pacientes homônimos, Erro de digitação, Falha na conferência, Falha no sistema..."
            value={dados.fatoresContribuintes || ""}
            onChange={(e) => updateDados("fatoresContribuintes", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>
    </div>
  );
}
