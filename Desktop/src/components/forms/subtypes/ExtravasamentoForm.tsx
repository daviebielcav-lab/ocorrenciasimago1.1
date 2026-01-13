import { UseFormReturn } from "react-hook-form";
import { Droplets } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { OccurrenceFormData } from "@/types/occurrence";

interface ExtravasamentoFormProps {
  form: UseFormReturn<OccurrenceFormData>;
}

export function ExtravasamentoForm({ form }: ExtravasamentoFormProps) {
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
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <div className="flex items-start gap-3">
          <Droplets className="h-5 w-5 text-sky-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-sky-900">Extravasamento</h4>
            <p className="text-sm text-sky-700 mt-1">
              Registre detalhes sobre vazamento de contraste ou outras substâncias durante procedimentos.
            </p>
          </div>
        </div>
      </div>

      {/* Informações do Procedimento */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Informações do Procedimento</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FormLabel>Substância extravasada</FormLabel>
            <Input
              placeholder="Ex: Contraste iodado, Gadolínio, Soro fisiológico..."
              value={dados.substancia || ""}
              onChange={(e) => updateDados("substancia", e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Modalidade</FormLabel>
            <Input
              placeholder="Ex: TC, RM..."
              value={dados.modalidade || ""}
              onChange={(e) => updateDados("modalidade", e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Local do extravasamento</FormLabel>
            <Input
              placeholder="Ex: Antebraço direito, Dorso da mão esquerda..."
              value={dados.localExtravasamento || ""}
              onChange={(e) => updateDados("localExtravasamento", e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Volume estimado (ml)</FormLabel>
            <Input
              placeholder="Volume em ml ou 'Não sei'"
              value={dados.volumeEstimado || ""}
              onChange={(e) => updateDados("volumeEstimado", e.target.value)}
              className="bg-background"
            />
          </div>
        </div>
      </div>

      {/* Sintomas Observados */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Sintomas Observados</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FormLabel>Intensidade da dor (0-10)</FormLabel>
            <Input
              placeholder="0 a 10"
              value={dados.sintomaDor || ""}
              onChange={(e) => updateDados("sintomaDor", e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Nível de edema</FormLabel>
            <Input
              placeholder="Ex: Nenhum, Leve, Médio, Intenso"
              value={dados.sintomaEdema || ""}
              onChange={(e) => updateDados("sintomaEdema", e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>Outros sintomas observados</FormLabel>
          <Textarea
            placeholder="Ex: Alteração de cor, Bolhas, Dormência, Formigamento..."
            value={dados.sintomasDescricao || ""}
            onChange={(e) => updateDados("sintomasDescricao", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Ações Imediatas */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Ações Imediatas</h3>
        
        <div className="space-y-2">
          <FormLabel>Ações tomadas</FormLabel>
          <Textarea
            placeholder="Ex: Interrompeu infusão, Elevou o membro, Compressa fria/quente, Avaliação médica..."
            value={dados.acoesImediatas || ""}
            onChange={(e) => updateDados("acoesImediatas", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Avaliação e Desfecho */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Avaliação e Desfecho</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FormLabel>Avaliado por</FormLabel>
            <Input
              placeholder="Nome do profissional"
              value={dados.avaliadoPor || ""}
              onChange={(e) => updateDados("avaliadoPor", e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Cargo</FormLabel>
            <Input
              placeholder="Cargo/função"
              value={dados.avaliadoCargo || ""}
              onChange={(e) => updateDados("avaliadoCargo", e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>Desfecho do exame</FormLabel>
          <Input
            placeholder="Ex: Concluído, Remarcado, Cancelado"
            value={dados.desfechoExame || ""}
            onChange={(e) => updateDados("desfechoExame", e.target.value)}
            className="bg-background"
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Orientações dadas ao paciente</FormLabel>
          <Textarea
            placeholder="Descreva as orientações dadas..."
            value={dados.orientacoesDescricao || ""}
            onChange={(e) => updateDados("orientacoesDescricao", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>
    </div>
  );
}
