import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Heart, Briefcase, Wrench, Save, Loader2 } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ProtocolHeader } from "@/components/forms/ProtocolHeader";
import { PatientDataBlock } from "@/components/forms/PatientDataBlock";
import { OccurrenceDetailsBlock } from "@/components/forms/OccurrenceDetailsBlock";
import { useToast } from "@/hooks/use-toast";
import { OccurrenceType, OccurrenceSubtype } from "@/types/occurrence";
import { useCreateOccurrence } from "@/hooks/useOccurrences";

const typeConfig: Record<OccurrenceType, {
  title: string;
  description: string;
  icon: typeof Heart;
  color: string;
  bgColor: string;
}> = {
  assistencial: {
    title: "Ocorrência Assistencial",
    description: "Eventos relacionados ao cuidado do paciente",
    icon: Heart,
    color: "text-occurrence-assistencial",
    bgColor: "bg-occurrence-assistencial/10",
  },
  administrativa: {
    title: "Ocorrência Administrativa",
    description: "Problemas operacionais e de gestão",
    icon: Briefcase,
    color: "text-occurrence-administrativa",
    bgColor: "bg-occurrence-administrativa/10",
  },
  tecnica: {
    title: "Ocorrência Técnica",
    description: "Falhas em equipamentos ou infraestrutura",
    icon: Wrench,
    color: "text-occurrence-tecnica",
    bgColor: "bg-occurrence-tecnica/10",
  },
  revisao_exame: {
    title: "Revisão de Exame",
    description: "Necessidade de revisão de laudo ou imagem",
    icon: Heart,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
};

// Validation Schema
const formSchema = z.object({
  paciente: z.object({
    nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    telefone: z.string().min(10, "Telefone inválido"),
    idPaciente: z.string().min(1, "ID do paciente é obrigatório"),
    dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
    tipoExame: z.string().min(1, "Tipo de exame é obrigatório"),
    unidadeLocal: z.string().min(1, "Unidade é obrigatória"),
    dataHoraEvento: z.string().min(1, "Data e hora do evento é obrigatória"),
  }),
  tipo: z.enum(["assistencial", "administrativa", "tecnica", "revisao_exame"]),
  subtipo: z.string().min(1, "Subtipo é obrigatório"),
  descricaoDetalhada: z.string().min(20, "Descrição deve ter pelo menos 20 caracteres"),
  acaoImediata: z.string().min(10, "Descreva a ação tomada"),
  impactoPercebido: z.string().min(1, "Selecione o impacto"),
  pessoasEnvolvidas: z.string().optional(),
  contemDadoSensivel: z.boolean(),
  anexos: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function NovaOcorrencia() {
  const [searchParams] = useSearchParams();
  const tipo = searchParams.get("tipo");
  const subtipo = searchParams.get("subtipo");
  const navigate = useNavigate();
  const { toast } = useToast();
  const createOccurrence = useCreateOccurrence();

  const config = tipo ? typeConfig[tipo as keyof typeof typeConfig] : null;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paciente: {
        nomeCompleto: "",
        telefone: "",
        idPaciente: "",
        dataNascimento: "",
        tipoExame: "",
        unidadeLocal: "",
        dataHoraEvento: "",
      },
      tipo: (tipo as OccurrenceType) || "assistencial",
      subtipo: subtipo || "",
      descricaoDetalhada: "",
      acaoImediata: "",
      impactoPercebido: "",
      pessoasEnvolvidas: "",
      contemDadoSensivel: false,
      anexos: [],
    },
  });

  if (!config) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tipo de ocorrência inválido.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
            Voltar ao início
          </Button>
        </div>
      </MainLayout>
    );
  }

  const onSubmit = async (data: FormData) => {
    try {
      await createOccurrence.mutateAsync({
        tipo: data.tipo as OccurrenceType,
        subtipo: data.subtipo as OccurrenceSubtype,
        paciente_nome_completo: data.paciente.nomeCompleto,
        paciente_telefone: data.paciente.telefone,
        paciente_id: data.paciente.idPaciente,
        paciente_data_nascimento: data.paciente.dataNascimento,
        paciente_tipo_exame: data.paciente.tipoExame,
        paciente_unidade_local: data.paciente.unidadeLocal,
        paciente_data_hora_evento: data.paciente.dataHoraEvento,
        descricao_detalhada: data.descricaoDetalhada,
        acao_imediata: data.acaoImediata,
        impacto_percebido: data.impactoPercebido,
        pessoas_envolvidas: data.pessoasEnvolvidas,
        contem_dado_sensivel: data.contemDadoSensivel,
      });

      navigate("/ocorrencias");
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-3xl animate-fade-in">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Painel
        </Button>

        {/* Protocol Header */}
        <ProtocolHeader tipo={tipo as OccurrenceType} isNew />

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Data Block */}
            <PatientDataBlock form={form as any} />

            {/* Occurrence Details */}
            <OccurrenceDetailsBlock form={form as any} />

            {/* Actions */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
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
                disabled={createOccurrence.isPending}
                className="flex-1 sm:flex-none sm:min-w-[200px]"
              >
                {createOccurrence.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
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
