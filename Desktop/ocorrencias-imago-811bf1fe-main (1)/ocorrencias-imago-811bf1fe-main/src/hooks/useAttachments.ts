import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Attachment {
  id: string;
  occurrence_id: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  file_url: string;
  is_image: boolean;
  uploaded_em: string;
}

// Fetch attachments for an occurrence
export function useAttachments(occurrenceId: string | undefined) {
  return useQuery({
    queryKey: ["attachments", occurrenceId],
    queryFn: async () => {
      if (!occurrenceId) return [];

      const { data, error } = await supabase
        .from("occurrence_attachments")
        .select("*")
        .eq("occurrence_id", occurrenceId)
        .order("uploaded_em", { ascending: true });

      if (error) throw error;

      return (data || []).map((att: any) => ({
        ...att,
        is_image: att.is_image ?? isImageMimeType(att.file_type),
      })) as Attachment[];
    },
    enabled: !!occurrenceId,
  });
}

// Fetch attachments with signed URLs for public access
export function useAttachmentsWithSignedUrls(occurrenceId: string | undefined) {
  return useQuery({
    queryKey: ["attachments-signed", occurrenceId],
    queryFn: async () => {
      if (!occurrenceId) return [];

      const { data, error } = await supabase
        .from("occurrence_attachments")
        .select("*")
        .eq("occurrence_id", occurrenceId)
        .order("uploaded_em", { ascending: true });

      if (error) throw error;

      // Generate signed URLs for each attachment
      const attachmentsWithUrls = await Promise.all(
        (data || []).map(async (att: any) => {
          const { data: urlData } = await supabase.storage
            .from("occurrence-attachments")
            .createSignedUrl(att.file_url, 60 * 60 * 24 * 7); // 7 days

          return {
            ...att,
            is_image: att.is_image ?? isImageMimeType(att.file_type),
            signed_url: urlData?.signedUrl || null,
          };
        })
      );

      return attachmentsWithUrls as (Attachment & { signed_url: string | null })[];
    },
    enabled: !!occurrenceId,
  });
}

// Upload attachments for an occurrence
export function useUploadAttachments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      occurrenceId,
      files,
      userId,
    }: {
      occurrenceId: string;
      files: File[];
      userId: string;
    }) => {
      const uploadedAttachments: Attachment[] = [];

      for (const file of files) {
        const isImage = isImageMimeType(file.type);
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${occurrenceId}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("occurrence-attachments")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Erro ao fazer upload de ${file.name}: ${uploadError.message}`);
        }

        // Insert into database
        const { data, error: insertError } = await supabase
          .from("occurrence_attachments")
          .insert({
            occurrence_id: occurrenceId,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: filePath,
            is_image: isImage,
            uploaded_by: userId,
          })
          .select()
          .single();

        if (insertError) {
          console.error("Insert error:", insertError);
          throw new Error(`Erro ao registrar ${file.name}: ${insertError.message}`);
        }

        uploadedAttachments.push({
          ...data,
          is_image: isImage,
        } as Attachment);
      }

      return uploadedAttachments;
    },
    onSuccess: (_, { occurrenceId }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", occurrenceId] });
      toast({
        title: "Anexos enviados",
        description: "Os arquivos foram enviados com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar anexos",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Delete an attachment
export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ attachmentId, filePath, occurrenceId }: { 
      attachmentId: string; 
      filePath: string;
      occurrenceId: string;
    }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("occurrence-attachments")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("occurrence_attachments")
        .delete()
        .eq("id", attachmentId);

      if (dbError) throw dbError;

      return { attachmentId, occurrenceId };
    },
    onSuccess: ({ occurrenceId }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", occurrenceId] });
      toast({
        title: "Anexo removido",
        description: "O arquivo foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover anexo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Get signed URLs for a list of attachments
export async function getSignedUrlsForAttachments(attachments: Attachment[]): Promise<(Attachment & { signed_url: string })[]> {
  const results = await Promise.all(
    attachments.map(async (att) => {
      const { data } = await supabase.storage
        .from("occurrence-attachments")
        .createSignedUrl(att.file_url, 60 * 60 * 24 * 7); // 7 days

      return {
        ...att,
        signed_url: data?.signedUrl || "",
      };
    })
  );

  return results;
}

// Helper function to check if a mime type is an image
function isImageMimeType(mimeType: string | null): boolean {
  if (!mimeType) return false;
  return mimeType.startsWith("image/");
}

// Helper to format file size
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
