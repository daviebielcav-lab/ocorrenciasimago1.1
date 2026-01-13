import { useState, useEffect } from "react";
import { Send, Calendar, User, Paperclip, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalNotification } from "@/types/occurrence";

interface ExternalNotificationFormProps {
  value?: ExternalNotification;
  onChange: (notification: ExternalNotification) => void;
}

export function ExternalNotificationForm({
  value,
  onChange,
}: ExternalNotificationFormProps) {
  const [formData, setFormData] = useState<ExternalNotification>(
    value || {
      orgaoNotificado: "",
      data: "",
      responsavel: "",
      anexoComprovante: "",
    }
  );

  useEffect(() => {
    onChange(formData);
  }, [formData]);

  const updateField = (field: keyof ExternalNotification, val: string) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const isComplete =
    formData.orgaoNotificado &&
    formData.data &&
    formData.responsavel;

  return (
    <div className="rounded-xl border-2 border-warning/30 bg-warning/5 p-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
          <Send className="h-5 w-5 text-warning" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Notificação Externa
          </h3>
          <p className="text-sm text-muted-foreground">
            Preencha os dados obrigatórios para registrar a notificação a órgãos externos
          </p>
        </div>
      </div>

      {!isComplete && (
        <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 px-3 py-2 rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          <span>Todos os campos são obrigatórios para encerrar a ocorrência</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Órgão Notificado */}
        <div className="md:col-span-2 space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Send className="h-4 w-4 text-muted-foreground" />
            Órgão notificado <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.orgaoNotificado}
            onChange={(e) => updateField("orgaoNotificado", e.target.value)}
            placeholder="Ex: ANVISA, Vigilância Sanitária, etc."
            className="bg-background"
          />
        </div>

        {/* Data da Notificação */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            Data da notificação <span className="text-destructive">*</span>
          </Label>
          <Input
            type="date"
            value={formData.data}
            onChange={(e) => updateField("data", e.target.value)}
            className="bg-background"
          />
        </div>

        {/* Responsável */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <User className="h-4 w-4 text-muted-foreground" />
            Responsável pela notificação <span className="text-destructive">*</span>
          </Label>
          <Input
            value={formData.responsavel}
            onChange={(e) => updateField("responsavel", e.target.value)}
            placeholder="Nome do responsável"
            className="bg-background"
          />
        </div>

        {/* Anexo/Comprovante */}
        <div className="md:col-span-2 space-y-2">
          <Label className="flex items-center gap-2 text-foreground">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            Anexo/Comprovante <span className="text-destructive">*</span>
          </Label>
          <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
            <Paperclip className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Arraste o comprovante ou clique para selecionar
            </p>
            <Input
              type="file"
              className="hidden"
              id="notification-file"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label
              htmlFor="notification-file"
              className="inline-block mt-2 px-4 py-2 text-sm font-medium text-warning bg-warning/10 rounded-lg cursor-pointer hover:bg-warning/20 transition-colors"
            >
              Selecionar arquivo
            </label>
          </div>
        </div>
      </div>

      {/* Document Generation Notice */}
      <div className="rounded-lg bg-info/10 p-4 flex items-start gap-3">
        <Send className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">
            Documento será gerado automaticamente
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Ao salvar, o sistema gerará um documento registrável com todos os dados
            da notificação para fins de auditoria e rastreabilidade.
          </p>
        </div>
      </div>
    </div>
  );
}
