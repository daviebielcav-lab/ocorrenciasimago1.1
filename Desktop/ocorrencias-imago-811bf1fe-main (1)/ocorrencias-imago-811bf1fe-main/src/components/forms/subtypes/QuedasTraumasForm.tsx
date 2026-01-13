import { UseFormReturn } from "react-hook-form";
import { PersonStanding } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { OccurrenceFormData } from "@/types/occurrence";

interface QuedasTraumasFormProps {
  form: UseFormReturn<OccurrenceFormData>;
}

export function QuedasTraumasForm({ form }: QuedasTraumasFormProps) {
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
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <PersonStanding className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-900">Quedas ou Traumas</h4>
            <p className="text-sm text-amber-700 mt-1">
              Registre detalhes sobre quedas, escorregões ou traumas ocorridos nas dependências.
            </p>
          </div>
        </div>
      </div>

      {/* Local e Circunstância */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Local e Circunstância</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FormLabel>Local exato</FormLabel>
            <Input
              placeholder="Ex: Recepção, Corredor, Banheiro, Sala de exame..."
              value={dados.localExato || ""}
              onChange={(e) => updateDados("localExato", e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Atividade no momento</FormLabel>
            <Input
              placeholder="Ex: Andando, Levantando, Transferência..."
              value={dados.atividadeMomento || ""}
              onChange={(e) => updateDados("atividadeMomento", e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>Havia acompanhante?</FormLabel>
          <Input
            placeholder="Sim/Não - Se sim, quem?"
            value={dados.acompanhante || ""}
            onChange={(e) => updateDados("acompanhante", e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      {/* Fatores Ambientais */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Fatores Ambientais</h3>
        
        <div className="space-y-2">
          <FormLabel>Fatores que podem ter contribuído</FormLabel>
          <Textarea
            placeholder="Ex: Piso molhado, Obstáculo, Iluminação inadequada, Maca desbloqueada..."
            value={dados.fatoresAmbientais || ""}
            onChange={(e) => updateDados("fatoresAmbientais", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Avaliação de Lesões */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Avaliação de Lesões</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <FormLabel>Intensidade da dor (0-10)</FormLabel>
            <Input
              placeholder="0 a 10"
              value={dados.lesaoDor || ""}
              onChange={(e) => updateDados("lesaoDor", e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Local da dor</FormLabel>
            <Input
              placeholder="Ex: Joelho direito, Quadril esquerdo..."
              value={dados.lesaoLocal || ""}
              onChange={(e) => updateDados("lesaoLocal", e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>Lesões observadas</FormLabel>
          <Textarea
            placeholder="Ex: Corte, Hematoma, Sangramento, Deformidade, Edema..."
            value={dados.lesaoDescricao || ""}
            onChange={(e) => updateDados("lesaoDescricao", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>
      </div>

      {/* Trauma Craniano */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Trauma Craniano</h3>
        
        <div className="space-y-2">
          <FormLabel>O paciente bateu a cabeça?</FormLabel>
          <Input
            placeholder="Sim, Não ou Não sei informar"
            value={dados.bateuCabeca || ""}
            onChange={(e) => updateDados("bateuCabeca", e.target.value)}
            className="bg-background"
          />
        </div>
      </div>

      {/* Encaminhamento */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Encaminhamento e Comunicação</h3>
        
        <div className="space-y-2">
          <FormLabel>Ações imediatas e encaminhamento</FormLabel>
          <Textarea
            placeholder="Descreva as ações tomadas e encaminhamentos realizados..."
            value={dados.acoesEncaminhamento || ""}
            onChange={(e) => updateDados("acoesEncaminhamento", e.target.value)}
            className="min-h-[80px] bg-background resize-none"
          />
        </div>

        <div className="space-y-2">
          <FormLabel>Quem foi comunicado</FormLabel>
          <Input
            placeholder="Nome e cargo"
            value={dados.quemComunicado || ""}
            onChange={(e) => updateDados("quemComunicado", e.target.value)}
            className="bg-background"
          />
        </div>
      </div>
    </div>
  );
}
