import { Paperclip } from "lucide-react";
import { AttachmentGallery } from "@/components/attachments/AttachmentGallery";
import { useAttachmentsWithSignedUrls } from "@/hooks/useAttachments";

interface AttachmentsSectionProps {
  occurrenceId: string;
  subtipo: string;
}

export function AttachmentsSection({ occurrenceId, subtipo }: AttachmentsSectionProps) {
  // Only show for revisao_exame
  if (subtipo !== "revisao_exame") {
    return null;
  }

  const { data: attachments, isLoading } = useAttachmentsWithSignedUrls(occurrenceId);

  return (
    <div className="rounded-xl border border-border bg-card p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <Paperclip className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Anexos</h3>
      </div>
      <AttachmentGallery
        attachments={attachments || []}
        loading={isLoading}
        emptyMessage="Nenhum anexo nesta ocorrência"
      />
    </div>
  );
}
