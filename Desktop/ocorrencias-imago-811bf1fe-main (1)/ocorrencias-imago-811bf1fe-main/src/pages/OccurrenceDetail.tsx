import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, AlertTriangle, FileText, User, Heart, Briefcase, Wrench } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { StatusFlow } from "@/components/flow/StatusFlow";
import { OutcomeSelector } from "@/components/flow/OutcomeSelector";
import { ExternalNotificationForm } from "@/components/flow/ExternalNotificationForm";
import { CAPAForm } from "@/components/flow/CAPAForm";
import { TriageSelector } from "@/components/triage/TriageSelector";
import { TriageBadge } from "@/components/triage/TriageBadge";
import { ExportDialog } from "@/components/export/ExportDialog";
import { FormattedDetails } from "@/components/occurrence/FormattedDetails";
import { SendToDoctorModal } from "@/components/occurrence/SendToDoctorModal";
import { DoctorMessageSection } from "@/components/occurrence/DoctorMessageSection";
import { AttachmentsSection } from "@/components/occurrence/AttachmentsSection";
import { useToast } from "@/hooks/use-toast";
import { generateAndStorePdf } from "@/lib/pdf/generate-and-store-pdf";
import { Occurrence } from "@/types/occurrence";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useOccurrence, useUpdateOccurrence, useUpdateOccurrenceStatus } from "@/hooks/useOccurrences";
import {
  OccurrenceStatus,
  OccurrenceOutcome,
  ExternalNotification,
  CAPA,
  statusConfig,
  triageConfig,
  outcomeConfig,
  requiresCapa,
  requiresExternalNotification,
  OutcomeType,
  TriageClassification,
} from "@/types/occurrence";

const typeConfig = {
  assistencial: { icon: Heart, color: "text-occurrence-assistencial", bgColor: "bg-occurrence-assistencial/10" },
  administrativa: { icon: Briefcase, color: "text-occurrence-administrativa", bgColor: "bg-occurrence-administrativa/10" },
  tecnica: { icon: Wrench, color: "text-occurrence-tecnica", bgColor: "bg-occurrence-tecnica/10" },
};

export default function OccurrenceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const { data: occurrence, isLoading, refetch } = useOccurrence(id);
  const updateOccurrence = useUpdateOccurrence();
  const updateStatus = useUpdateOccurrenceStatus();

  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSendToDoctorOpen, setIsSendToDoctorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [outcome, setOutcome] = useState<Partial<OccurrenceOutcome>>({});
  const [externalNotification, setExternalNotification] = useState<ExternalNotification>({
    orgaoNotificado: "",
    data: "",
    responsavel: "",
  });
  const [capas, setCapas] = useState<CAPA[]>([]);

  // Check if this is a "Revisão de Laudo" occurrence
  const isRevisaoLaudo = occurrence?.subtipo === "revisao_exame";
  const needsDoctorForwarding = isRevisaoLaudo && occurrence?.triagem && !occurrence?.encaminhada_em;

  // Open doctor modal after triage for Revisão de Laudo
  useEffect(() => {
    if (needsDoctorForwarding && isAdmin) {
      setIsSendToDoctorOpen(true);
    }
  }, [needsDoctorForwarding, isAdmin]);

  // Transform DB occurrence to Occurrence type for ExportDialog
  const transformToOccurrence = (): Partial<Occurrence> | undefined => {
    if (!occurrence) return undefined;
    return {
      id: occurrence.id,
      protocolo: occurrence.protocolo,
      tenantId: occurrence.tenant_id,
      criadoPor: occurrence.criado_por,
      criadoEm: occurrence.criado_em,
      atualizadoEm: occurrence.atualizado_em,
      status: occurrence.status as any,
      triagem: occurrence.triagem as any,
      triagemPor: occurrence.triagem_por || undefined,
      triagemEm: occurrence.triagem_em || undefined,
      tipo: occurrence.tipo as any,
      subtipo: occurrence.subtipo as any,
      descricaoDetalhada: occurrence.descricao_detalhada,
      acaoImediata: occurrence.acao_imediata || "",
      impactoPercebido: occurrence.impacto_percebido || "",
      pessoasEnvolvidas: occurrence.pessoas_envolvidas || undefined,
      contemDadoSensivel: occurrence.contem_dado_sensivel || false,
      paciente: {
        nomeCompleto: occurrence.paciente_nome_completo || "",
        telefone: occurrence.paciente_telefone || "",
        idPaciente: occurrence.paciente_id || "",
        dataNascimento: occurrence.paciente_data_nascimento || "",
        tipoExame: occurrence.paciente_tipo_exame || "",
        unidadeLocal: occurrence.paciente_unidade_local || "",
        dataHoraEvento: occurrence.paciente_data_hora_evento || "",
      },
      desfecho: occurrence.desfecho_tipos?.length
        ? {
            tipos: occurrence.desfecho_tipos as any,
            justificativa: occurrence.desfecho_justificativa || "",
            desfechoPrincipal: occurrence.desfecho_principal as any,
            definidoPor: occurrence.desfecho_definido_por || "",
            definidoEm: occurrence.desfecho_definido_em || "",
          }
        : undefined,
      historicoStatus: [],
    };
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (!occurrence) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Ocorrência não encontrada</p>
          <Button onClick={() => navigate("/ocorrencias")}>Voltar para Lista</Button>
        </div>
      </MainLayout>
    );
  }

  const TypeIcon = typeConfig[occurrence.tipo as keyof typeof typeConfig]?.icon || FileText;

  const handleStatusChange = (newStatus: OccurrenceStatus) => {
    updateStatus.mutate({
      occurrenceId: occurrence.id,
      currentStatus: occurrence.status as OccurrenceStatus,
      newStatus,
    });
  };

  const handleTriageSelect = (triage: TriageClassification) => {
    updateOccurrence.mutate({
      id: occurrence.id,
      triagem: triage,
    }, {
      onSuccess: () => {
        toast({
          title: "Triagem realizada",
          description: `Classificação definida como "${triageConfig[triage].label}"`,
        });
        setIsTriageOpen(false);
        
        // For Revisão de Laudo, open the doctor modal after triage
        if (isRevisaoLaudo) {
          refetch().then(() => {
            setIsSendToDoctorOpen(true);
          });
        }
      },
    });
  };

  const handleDoctorForwardSuccess = () => {
    refetch();
  };

  const handleSave = async () => {
    const selectedOutcomes = outcome.tipos || [];
    
    if (requiresExternalNotification(selectedOutcomes)) {
      if (!externalNotification.orgaoNotificado || !externalNotification.data || !externalNotification.responsavel) {
        toast({
          title: "Dados incompletos",
          description: "Preencha todos os campos obrigatórios da notificação externa.",
          variant: "destructive",
        });
        return;
      }
    }

    if (requiresCapa(selectedOutcomes) && capas.length === 0) {
      toast({
        title: "CAPA obrigatória",
        description: "Adicione pelo menos uma ação corretiva/preventiva.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      await updateOccurrence.mutateAsync({
        id: occurrence.id,
        desfecho_tipos: selectedOutcomes,
        desfecho_justificativa: outcome.justificativa,
        notificacao_orgao: externalNotification.orgaoNotificado,
        notificacao_data: externalNotification.data,
        notificacao_responsavel: externalNotification.responsavel,
      });

      // Fetch updated occurrence data and generate PDF
      const { data: updatedOcc } = await supabase
        .from("occurrences")
        .select("*")
        .eq("id", occurrence.id)
        .single();

      if (updatedOcc) {
        const pdfUrl = await generateAndStorePdf(updatedOcc as any);
        if (pdfUrl) {
          toast({
            title: "Alterações salvas",
            description: "PDF gerado e salvo com sucesso.",
          });
        } else {
          toast({
            title: "Alterações salvas",
            description: "As informações foram atualizadas, mas houve erro ao gerar o PDF.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const showExternalNotification = requiresExternalNotification(outcome.tipos || []);
  const showCapa = requiresCapa(outcome.tipos || []);
  const capaOutcomes = (outcome.tipos || [])
    .filter((o) => outcomeConfig[o].requiresCapa)
    .map((o) => outcomeConfig[o].label);

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl animate-fade-in">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/ocorrencias")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Lista
        </Button>

        {/* Header */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`rounded-xl p-3 ${typeConfig[occurrence.tipo as keyof typeof typeConfig]?.bgColor || "bg-muted"}`}>
                <TypeIcon className={`h-6 w-6 ${typeConfig[occurrence.tipo as keyof typeof typeConfig]?.color || "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Protocolo</p>
                <h1 className="text-xl font-bold font-mono text-foreground">
                  {occurrence.protocolo}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[occurrence.status as OccurrenceStatus].bgColor} ${statusConfig[occurrence.status as OccurrenceStatus].color}`}
                  >
                    {statusConfig[occurrence.status as OccurrenceStatus].label}
                  </span>
                  {occurrence.triagem && <TriageBadge triage={occurrence.triagem as TriageClassification} size="sm" />}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-muted-foreground text-right">
                <p>
                  Registrado em{" "}
                  {format(new Date(occurrence.criado_em), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
                <p>por {occurrence.criador_nome || "Usuário"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExportOpen(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Status Flow */}
        <div className="mb-6">
          <StatusFlow
            currentStatus={occurrence.status as OccurrenceStatus}
            onStatusChange={handleStatusChange}
            isAdmin={isAdmin}
          />
        </div>

        {/* Triage Section (Admin only) */}
        {isAdmin && !occurrence.triagem && (
          <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Triagem Pendente</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Esta ocorrência ainda não foi triada. Realize a classificação de gravidade.
                </p>
              </div>
              <Button onClick={() => setIsTriageOpen(true)}>Realizar Triagem</Button>
            </div>
          </div>
        )}

        {/* Patient Data Summary */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Dados do Paciente</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            <div>
              <p className="text-muted-foreground">Nome</p>
              <p className="font-medium">{occurrence.paciente_nome_completo || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">ID</p>
              <p className="font-medium">{occurrence.paciente_id || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Exame</p>
              <p className="font-medium">{occurrence.paciente_tipo_exame || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Unidade</p>
              <p className="font-medium">{occurrence.paciente_unidade_local || "-"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data/Hora do Evento</p>
              <p className="font-medium">
                {occurrence.paciente_data_hora_evento
                  ? format(new Date(occurrence.paciente_data_hora_evento), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Telefone</p>
              <p className="font-medium">{occurrence.paciente_telefone || "-"}</p>
            </div>
          </div>
        </div>

        {/* Occurrence Details */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Detalhes da Ocorrência</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-2">Descrição Detalhada</p>
              <FormattedDetails content={occurrence.descricao_detalhada} />
            </div>
            {occurrence.acao_imediata && (
              <div>
                <p className="text-muted-foreground mb-1">Ação Imediata Tomada</p>
                <p className="text-foreground">{occurrence.acao_imediata}</p>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground mb-1">Impacto Percebido</p>
                <p className="text-foreground">{occurrence.impacto_percebido || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Pessoas Envolvidas</p>
                <p className="text-foreground">{occurrence.pessoas_envolvidas || "-"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Message Section (for Revisão de Laudo) */}
        {isRevisaoLaudo && occurrence.encaminhada_em && (
          <DoctorMessageSection
            mensagemMedico={occurrence.mensagem_medico}
            medicoDestino={occurrence.medico_destino}
            encaminhadaEm={occurrence.encaminhada_em}
            finalizadaEm={occurrence.finalizada_em}
          />
        )}

        {/* Attachments Section (only for Revisão de Exame) */}
        <AttachmentsSection
          occurrenceId={occurrence.id}
          subtipo={occurrence.subtipo}
        />

        {/* Outcome Selector (Admin only) */}
        {isAdmin && (
          <>
            <div className="mb-6">
              <OutcomeSelector value={outcome} onChange={setOutcome} />
            </div>

            {/* External Notification Form */}
            {showExternalNotification && (
              <div className="mb-6">
                <ExternalNotificationForm
                  value={externalNotification}
                  onChange={setExternalNotification}
                />
              </div>
            )}

            {/* CAPA Form */}
            {showCapa && (
              <div className="mb-6">
                <CAPAForm
                  value={capas}
                  onChange={setCapas}
                  triggerOutcomes={capaOutcomes}
                />
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => navigate("/ocorrencias")}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>

        {/* Triage Modal */}
        <TriageSelector
          open={isTriageOpen}
          onOpenChange={setIsTriageOpen}
          currentTriage={occurrence.triagem as TriageClassification}
          onTriageSelect={handleTriageSelect}
        />

        {/* Export Dialog */}
        <ExportDialog
          open={isExportOpen}
          onOpenChange={setIsExportOpen}
          mode="single"
          occurrence={transformToOccurrence() as any}
        />

        {/* Send to Doctor Modal (for Revisão de Laudo) */}
        {isRevisaoLaudo && (
          <SendToDoctorModal
            open={isSendToDoctorOpen}
            onOpenChange={setIsSendToDoctorOpen}
            occurrenceId={occurrence.id}
            protocolo={occurrence.protocolo}
            pacienteNome={occurrence.paciente_nome_completo}
            pacienteTipoExame={occurrence.paciente_tipo_exame}
            pacienteUnidade={occurrence.paciente_unidade_local}
            pacienteDataHoraEvento={occurrence.paciente_data_hora_evento}
            onSuccess={handleDoctorForwardSuccess}
          />
        )}
      </div>
    </MainLayout>
  );
}
