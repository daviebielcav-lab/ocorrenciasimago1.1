import { useState, useMemo } from "react";
import { Loader2, Send, User, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Lista de médicos
import { MEDICOS } from "@/constants/doctors";

// Generate a secure random token in the browser
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

interface SendToDoctorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  occurrenceId: string;
  protocolo: string;
  pacienteNome: string | null;
  pacienteTipoExame: string | null;
  pacienteUnidade: string | null;
  pacienteDataHoraEvento: string | null;
  onSuccess: (publicToken: string, medicoNome: string) => void;
}

export function SendToDoctorModal({
  open,
  onOpenChange,
  occurrenceId,
  protocolo,
  pacienteNome,
  pacienteTipoExame,
  pacienteUnidade,
  pacienteDataHoraEvento,
  onSuccess,
}: SendToDoctorModalProps) {
  const { toast } = useToast();
  const [medicoId, setMedicoId] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [medicoPopoverOpen, setMedicoPopoverOpen] = useState(false);

  const medicoSelecionado = MEDICOS.find((m) => m.id === medicoId);

  const handleSend = async () => {
    if (!medicoId || !mensagem.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um médico e escreva uma mensagem.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      // Import supabase here to avoid circular dependencies
      const { supabase } = await import("@/integrations/supabase/client");

      // Generate public token in the browser
      const publicToken = generateSecureToken();
      const publicLink = `${window.location.origin}/public/revisao-laudo/${publicToken}`;

      // Update occurrence with token and doctor info
      const { error: updateError } = await supabase
        .from("occurrences")
        .update({
          public_token: publicToken,
          medico_destino: medicoSelecionado?.nome,
          mensagem_admin_medico: mensagem,
          encaminhada_em: new Date().toISOString(),
          status: "em_analise",
        })
        .eq("id", occurrenceId);

      if (updateError) throw updateError;

      // Fetch attachments with signed URLs to send in webhook
      const { data: attachmentsData } = await supabase
        .from("occurrence_attachments")
        .select("*")
        .eq("occurrence_id", occurrenceId);

      let attachmentsForWebhook: any[] = [];
      if (attachmentsData && attachmentsData.length > 0) {
        attachmentsForWebhook = await Promise.all(
          attachmentsData.map(async (att: any) => {
            const { data: urlData } = await supabase.storage
              .from("occurrence-attachments")
              .createSignedUrl(att.file_url, 60 * 60 * 24 * 7); // 7 days
            return {
              file_name: att.file_name,
              mime_type: att.file_type,
              file_url: urlData?.signedUrl || null,
              is_image: att.is_image ?? att.file_type?.startsWith("image/"),
            };
          })
        );
      }

      // Send webhook to notify doctor
      const webhookUrl = "https://n8n.imagoradiologia.cloud/webhook/medico";

      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            evento: "encaminhamento_medico",
            occurrence_id: occurrenceId,
            protocolo,
            mensagem_admin: mensagem,
            medico: medicoSelecionado?.nome,
            medico_id: medicoId,
            public_link: publicLink,
            paciente_nome: pacienteNome,
            paciente_exame: pacienteTipoExame,
            paciente_unidade: pacienteUnidade,
            paciente_data_hora_evento: pacienteDataHoraEvento,
            encaminhada_em: new Date().toISOString(),
            anexos: attachmentsForWebhook,
          }),
        });
        console.log("[webhook] Encaminhamento ao médico enviado");
      } catch (webhookError) {
        console.error("[webhook] Erro ao enviar webhook:", webhookError);
        // Continue even if webhook fails
      }

      // Insert status history
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase.from("occurrence_status_history").insert({
          occurrence_id: occurrenceId,
          status_de: "em_triagem",
          status_para: "em_analise",
          alterado_por: userData.user.id,
          motivo: `Encaminhada ao médico: ${medicoSelecionado?.nome}`,
        });
      }

      toast({
        title: "Encaminhado com sucesso",
        description: `Ocorrência enviada para ${medicoSelecionado?.nome}`,
      });

      onSuccess(publicToken, medicoSelecionado?.nome || "");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao encaminhar:", error);
      toast({
        title: "Erro ao encaminhar",
        description: error.message || "Não foi possível encaminhar ao médico.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Encaminhar para Médico
          </DialogTitle>
          <DialogDescription>
            Selecione o médico e escreva a mensagem para encaminhar esta revisão
            de laudo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Médico *</Label>
            <Popover open={medicoPopoverOpen} onOpenChange={setMedicoPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={medicoPopoverOpen}
                  className="w-full justify-between"
                >
                  {medicoSelecionado ? medicoSelecionado.nome : "Pesquisar médico..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-popover" align="start">
                <Command>
                  <CommandInput placeholder="Pesquisar médico..." />
                  <CommandList>
                    <CommandEmpty>Nenhum médico encontrado.</CommandEmpty>
                    <CommandGroup>
                      {MEDICOS.map((medico) => (
                        <CommandItem
                          key={medico.id}
                          value={medico.nome}
                          onSelect={() => {
                            setMedicoId(medico.id);
                            setMedicoPopoverOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              medicoId === medico.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {medico.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem para o médico *</Label>
            <Textarea
              id="mensagem"
              placeholder="Descreva o que precisa ser revisado e qualquer informação relevante..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={4}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium text-muted-foreground mb-1">
              Dados da ocorrência:
            </p>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <strong>Protocolo:</strong> {protocolo}
              </li>
              <li>
                <strong>Paciente:</strong> {pacienteNome || "Não informado"}
              </li>
              <li>
                <strong>Exame:</strong> {pacienteTipoExame || "Não informado"}
              </li>
              <li>
                <strong>Unidade:</strong> {pacienteUnidade || "Não informada"}
              </li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? (
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
      </DialogContent>
    </Dialog>
  );
}
