import { UseFormReturn, FieldValues } from "react-hook-form";
import { FileText, Zap, AlertTriangle, Users, Paperclip, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormSelect } from "@/components/forms/FormSelect";

interface OccurrenceDetailsBlockProps {
  form: UseFormReturn<FieldValues>;
}

const impactOptions = [
  "Nenhum impacto",
  "Impacto mínimo",
  "Impacto moderado",
  "Impacto significativo",
  "Impacto grave",
];

export function OccurrenceDetailsBlock({
  form,
}: OccurrenceDetailsBlockProps) {

  return (
    <div className="space-y-6">

      {/* Detailed Description */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Detalhes da Ocorrência
            </h3>
            <p className="text-sm text-muted-foreground">
              Descreva o que aconteceu com o máximo de detalhes
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Descrição Detalhada */}
          <FormField
            control={form.control}
            name="descricaoDetalhada"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Descrição detalhada
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o que aconteceu, quando, onde e como. Inclua todos os detalhes relevantes..."
                    className="min-h-[120px] bg-background resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Seja o mais específico possível para facilitar a análise
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ação Imediata */}
          <FormField
            control={form.control}
            name="acaoImediata"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  Ação imediata tomada
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva as ações tomadas imediatamente após a ocorrência..."
                    className="min-h-[80px] bg-background resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Impacto Percebido */}
          <FormSelect
            name="impactoPercebido"
            label="Impacto percebido"
            placeholder="Selecione o nível de impacto"
            options={impactOptions}
            icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
          />

          {/* Pessoas Envolvidas */}
          <FormField
            control={form.control}
            name="pessoasEnvolvidas"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Pessoas envolvidas
                  <span className="text-xs text-muted-foreground">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nomes ou funções das pessoas envolvidas"
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Attachments & LGPD */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Paperclip className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Anexos e Privacidade
            </h3>
            <p className="text-sm text-muted-foreground">
              Adicione documentos relevantes e marque dados sensíveis
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Anexos - Placeholder for file upload */}
          <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
            <Paperclip className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Imagens, PDFs ou documentos (máx. 10MB cada)
            </p>
            <Input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              accept="image/*,.pdf,.doc,.docx"
            />
            <label
              htmlFor="file-upload"
              className="inline-block mt-3 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors"
            >
              Selecionar arquivos
            </label>
          </div>

          {/* LGPD Check */}
          <FormField
            control={form.control}
            name="contemDadoSensivel"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-warning/30 bg-warning/5 p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2 text-foreground">
                    <Shield className="h-4 w-4 text-warning" />
                    Esta ocorrência contém dados sensíveis (LGPD)
                  </FormLabel>
                  <FormDescription>
                    Marque se houver informações de saúde, dados genéticos,
                    biométricos ou outras informações protegidas pela LGPD
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
