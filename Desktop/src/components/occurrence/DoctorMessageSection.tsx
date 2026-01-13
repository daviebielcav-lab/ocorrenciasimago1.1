import { Clock, MessageSquare, Check } from "lucide-react";

interface DoctorMessageSectionProps {
  mensagemMedico: string | null;
  medicoDestino: string | null;
  encaminhadaEm: string | null;
  finalizadaEm: string | null;
}

export function DoctorMessageSection({
  mensagemMedico,
  medicoDestino,
  encaminhadaEm,
  finalizadaEm,
}: DoctorMessageSectionProps) {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Mensagem do Médico</h3>
      </div>

      {medicoDestino && (
        <div className="text-sm text-muted-foreground mb-3">
          <span className="font-medium">Encaminhado para:</span> {medicoDestino}
          {encaminhadaEm && (
            <span className="ml-2">em {formatDate(encaminhadaEm)}</span>
          )}
        </div>
      )}

      {mensagemMedico ? (
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-foreground whitespace-pre-wrap">{mensagemMedico}</p>
          </div>
          {finalizadaEm && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>Revisão finalizada em {formatDate(finalizadaEm)}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Aguardando resposta do médico</span>
        </div>
      )}
    </div>
  );
}
