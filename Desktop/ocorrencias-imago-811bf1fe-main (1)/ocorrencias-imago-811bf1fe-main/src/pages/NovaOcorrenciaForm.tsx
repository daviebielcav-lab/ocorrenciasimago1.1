import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2 } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { BaseInfoBlock } from "@/components/forms/BaseInfoBlock";
import {
  ErroIdentificacaoForm,
  ExtravasamentoForm,
  RevisaoExameForm,
  QuedasTraumasForm
} from "@/components/forms/subtypes";
import { useCreateOccurrence } from "@/hooks/useOccurrences";
import { useUploadAttachments } from "@/hooks/useAttachments";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { PendingFile } from "@/components/attachments/AttachmentUpload";
import {
  OccurrenceType,
  OccurrenceSubtype,
  OccurrenceFormData,
  subtypeLabels,
  subtypeDescriptions
} from "@/types/occurrence";

// Validation Schema
const formSchema = z.object({
  dataHoraEvento: z.string().min(1, "Data e hora do evento é obrigatória"),
  unidadeLocal: z.string().min(1, "Unidade é obrigatória"),
  paciente: z.object({
    nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    cpf: z.string()
      .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve ter 11 dígitos no formato 000.000.000-00")
      .optional()
      .or(z.literal("")),
    telefone: z.string()
      .regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Telefone deve ter DDD + 9 dígitos no formato (00) 00000-0000")
      .optional()
      .or(z.literal("")),
    idPaciente: z.string().optional(),
    dataNascimento: z.string().optional(),
    tipoExame: z.string().optional(),
  }),
  tipo: z.string(),
  subtipo: z.string(),
  dadosEspecificos: z.any().optional(),
});

export default function NovaOcorrenciaForm() {
  const { tipo, subtipo } = useParams<{ tipo: string; subtipo: string }>();
  const navigate = useNavigate();
  const createOccurrence = useCreateOccurrence();
  const uploadAttachments = useUploadAttachments();
  const { profile } = useAuth();
  const { toast } = useToast();

  // State for pending files (only for revisao_exame)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRevisaoExame = subtipo === "revisao_exame";

  const form = useForm<OccurrenceFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dataHoraEvento: "",
      unidadeLocal: "Integração",
      paciente: {
        nomeCompleto: "",
        cpf: "",
        telefone: "",
        idPaciente: "",
        dataNascimento: "",
        tipoExame: "",
      },
      tipo: tipo as OccurrenceType,
      subtipo: subtipo as OccurrenceSubtype,
      dadosEspecificos: {},
    },
  });

  const onSubmit = async (data: OccurrenceFormData) => {
    setIsSubmitting(true);
    try {
      // Create the occurrence first
      const occurrence = await createOccurrence.mutateAsync({
        tipo: data.tipo,
        subtipo: data.subtipo,
        paciente_nome_completo: data.paciente.nomeCompleto,
        paciente_telefone: data.paciente.telefone,
        paciente_id: data.paciente.idPaciente,
        paciente_data_nascimento: data.paciente.dataNascimento,
        paciente_tipo_exame: data.paciente.tipoExame,
        paciente_unidade_local: data.unidadeLocal,
        paciente_data_hora_evento: data.dataHoraEvento,
        descricao_detalhada: JSON.stringify(data.dadosEspecificos || {}),
        dados_especificos: data.dadosEspecificos,
        medico_destino: (data.dadosEspecificos as any)?.medicoResponsavel,
      });

      // If there are pending files and this is revisao_exame, upload them
      if (isRevisaoExame && pendingFiles.length > 0 && profile) {
        try {
          await uploadAttachments.mutateAsync({
            occurrenceId: occurrence.id,
            files: pendingFiles.map((pf) => pf.file),
            userId: profile.id,
          });
        } catch (uploadError) {
          console.error("Error uploading attachments:", uploadError);
          toast({
            title: "Aviso",
            description: "Ocorrência criada, mas alguns anexos não puderam ser enviados.",
            variant: "destructive",
          });
        }
      }

      navigate("/ocorrencias");
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render subtype-specific form
  const renderSubtypeForm = () => {
    switch (subtipo) {
      case "erro_identificacao":
        return <ErroIdentificacaoForm form={form} />;
      case "extravasamento":
        return <ExtravasamentoForm form={form} />;
      case "revisao_exame":
        return (
          <RevisaoExameForm
            form={form}
            pendingFiles={pendingFiles}
            onFilesChange={setPendingFiles}
          />
        );
      case "quedas_traumas":
        return <QuedasTraumasForm form={form} />;
      default:
        return null;
    }
  };

  const isPending = createOccurrence.isPending || uploadAttachments.isPending || isSubmitting;

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl animate-fade-in">
        <Button
          type="button"
          variant="ghost"
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/ocorrencias/nova")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar à seleção
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {subtypeLabels[subtipo as OccurrenceSubtype] || "Nova Ocorrência"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {subtypeDescriptions[subtipo as OccurrenceSubtype]}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Base Info Block */}
            <BaseInfoBlock form={form} />

            {/* Subtype-Specific Form */}
            {renderSubtypeForm()}

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 pb-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 sm:flex-none sm:min-w-[200px]"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {uploadAttachments.isPending ? "Enviando anexos..." : "Registrando..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Registrar Ocorrência
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </MainLayout>
  );
}
