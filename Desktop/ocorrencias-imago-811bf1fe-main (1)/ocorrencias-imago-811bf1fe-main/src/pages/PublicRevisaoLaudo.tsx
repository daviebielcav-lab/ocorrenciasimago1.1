import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  Stethoscope,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import imagoLogo from "@/assets/imago-logo-transparent.png";
import { FormattedDetails } from "@/components/occurrence/FormattedDetails";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import type { Attachment } from "@/hooks/useAttachments";

interface PublicOccurrence {
  id: string;
  protocolo: string;
  paciente_nome_completo: string | null;
  paciente_tipo_exame: string | null;
  paciente_unidade_local: string | null;
  paciente_data_hora_evento: string | null;
  descricao_detalhada: string;
  mensagem_admin_medico: string | null;
  mensagem_medico: string | null;
  status: string;
  medico_destino: string | null;
  encaminhada_em: string | null;
  finalizada_em: string | null;
}

export default function PublicRevisaoLaudo() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [occurrence, setOccurrence] = useState<PublicOccurrence | null>(null);
  const [attachments, setAttachments] = useState<(Attachment & { signed_url: string | null })[]>([]);
  const [mensagemMedico, setMensagemMedico] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    const fetchOccurrence = async () => {
      if (!token) {
        setIsInvalid(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("occurrences")
          .select(
            "id, protocolo, paciente_nome_completo, paciente_tipo_exame, paciente_unidade_local, paciente_data_hora_evento, descricao_detalhada, mensagem_admin_medico, mensagem_medico, status, medico_destino, encaminhada_em, finalizada_em"
          )
          .eq("public_token", token)
          .eq("subtipo", "revisao_exame")
          .maybeSingle();

        if (error) {
          console.error("Error fetching occurrence:", error);
          setIsInvalid(true);
        } else if (!data) {
          setIsInvalid(true);
        } else {
          setOccurrence(data as PublicOccurrence);
          setMensagemMedico(data.mensagem_medico || "");

          // Fetch attachments with signed URLs
          const { data: attachmentsData } = await supabase
            .from("occurrence_attachments")
            .select("*")
            .eq("occurrence_id", data.id)
            .order("uploaded_em", { ascending: true });

          if (attachmentsData && attachmentsData.length > 0) {
            // Generate signed URLs for each attachment
            const attachmentsWithUrls = await Promise.all(
              attachmentsData.map(async (att: any) => {
                const { data: urlData } = await supabase.storage
                  .from("occurrence-attachments")
                  .createSignedUrl(att.file_url, 60 * 60 * 24 * 7); // 7 days

                return {
                  ...att,
                  is_image: att.is_image ?? att.file_type?.startsWith("image/"),
                  signed_url: urlData?.signedUrl || null,
                };
              })
            );
            setAttachments(attachmentsWithUrls);
          }
        }
      } catch (err) {
        console.error("Error:", err);
        setIsInvalid(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOccurrence();
  }, [token]);

  const handleSend = async () => {
    if (!occurrence || !mensagemMedico.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Por favor, escreva sua análise antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // 1. Update Supabase
      const updateData = {
        mensagem_medico: mensagemMedico,
        status: "concluida",
        finalizada_em: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("occurrences")
        .update(updateData)
        .eq("public_token", token);

      if (error) throw error;

      // 2. Insert status history
      await supabase.from("occurrence_status_history").insert({
        occurrence_id: occurrence.id,
        status_de: occurrence.status as any,
        status_para: "concluida",
        alterado_por: occurrence.id,
        motivo: "Médico enviou análise (Link Público)",
      });

      // 3. Call Webhook
      try {
        await fetch("https://n8n.imagoradiologia.cloud/webhook/confirmacao", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            occurrence_id: occurrence.id,
            protocolo: occurrence.protocolo,
            mensagem_medico: mensagemMedico,
            status: "concluida",
            finalizada_em: new Date().toISOString(),
            medico_destino: occurrence.medico_destino,
            paciente: occurrence.paciente_nome_completo,
          }),
        });
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
        // Don't fail the whole process if webhook fails, but maybe log it
      }

      // 4. Update Local State
      setOccurrence((prev) =>
        prev
          ? {
            ...prev,
            mensagem_medico: mensagemMedico,
            status: "concluida",
            finalizada_em: new Date().toISOString(),
          }
          : null
      );

      toast({
        title: "Enviado com sucesso",
        description: "Sua análise foi enviada e a revisão foi finalizada.",
      });
    } catch (error: any) {
      console.error("Error sending:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar sua análise.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isInvalid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Link inválido ou expirado
          </h1>
          <p className="text-muted-foreground">
            Este link de revisão não é válido ou já expirou. Por favor, entre em
            contato com o administrador caso precise de um novo link.
          </p>
        </div>
      </div>
    );
  }

  const isConcluida = occurrence?.status === "concluida";
  const hasExistingMessage = !!occurrence?.mensagem_medico;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={imagoLogo} alt="IMAGO" className="h-10 w-auto" />
            <div className="hidden sm:block">
              <h1 className="font-semibold text-foreground">
                IMAGO Diagnóstico por Imagem
              </h1>
              <p className="text-sm text-muted-foreground">
                Sistema de Revisão de Laudo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Acesso Médico</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Status Banner */}
        {isConcluida && (
          <div className="rounded-lg bg-green-100 border border-green-200 p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Revisão Finalizada</p>
              <p className="text-sm text-green-700">
                Esta revisão foi concluída em{" "}
                {occurrence?.finalizada_em
                  ? format(
                    new Date(occurrence.finalizada_em),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR }
                  )
                  : ""}
              </p>
            </div>
          </div>
        )}

        {/* Occurrence Info */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Protocolo: {occurrence?.protocolo}
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">Paciente</p>
              <p className="font-medium">
                {occurrence?.paciente_nome_completo || "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Exame</p>
              <p className="font-medium">
                {occurrence?.paciente_tipo_exame || "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Unidade</p>
              <p className="font-medium">
                {occurrence?.paciente_unidade_local || "Não informada"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Data/Hora do Evento</p>
              <p className="font-medium">
                {occurrence?.paciente_data_hora_evento
                  ? format(
                    new Date(occurrence.paciente_data_hora_evento),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR }
                  )
                  : "Não informado"}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Descrição da Ocorrência
            </h3>
          </div>
          <FormattedDetails content={occurrence?.descricao_detalhada || ""} />
        </div>

        {/* Attachments Section */}
        {attachments.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Paperclip className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Anexos</h3>
            </div>
            <AttachmentGallery
              attachments={attachments}
              emptyMessage="Nenhum anexo"
            />
          </div>
        )}

        {/* Admin Message */}
        {occurrence?.mensagem_admin_medico && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">
                Mensagem do Administrador
              </h3>
            </div>
            <p className="text-foreground whitespace-pre-wrap">
              {occurrence.mensagem_admin_medico}
            </p>
          </div>
        )}

        {/* Doctor's Response */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">
              Sua Análise / Resposta
            </h3>
          </div>

          {isConcluida ? (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-foreground whitespace-pre-wrap">
                {occurrence?.mensagem_medico}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mensagem-medico">
                  Escreva sua análise detalhada *
                </Label>
                <Textarea
                  id="mensagem-medico"
                  placeholder="Descreva sua análise da revisão, observações sobre o laudo, recomendações..."
                  value={mensagemMedico}
                  onChange={(e) => setMensagemMedico(e.target.value)}
                  rows={8}
                  className="resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSend}
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar
                    </>
                  )}
                </Button>
              </div>

              {!hasExistingMessage && (
                <p className="text-sm text-muted-foreground">
                  💡 Após salvar sua primeira análise, o botão "Finalizar
                  Revisão" ficará disponível.
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} IMAGO Diagnóstico por Imagem</p>
          <p className="text-xs mt-1">
            Este é um link de acesso restrito. Não compartilhe com terceiros.
          </p>
        </div>
      </footer>
    </div>
  );
}
