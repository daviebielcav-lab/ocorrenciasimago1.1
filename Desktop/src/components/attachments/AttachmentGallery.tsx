import { useState } from "react";
import { Image, FileText, Download, ExternalLink, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatFileSize, type Attachment } from "@/hooks/useAttachments";

interface AttachmentGalleryProps {
  attachments: (Attachment & { signed_url?: string | null })[];
  loading?: boolean;
  emptyMessage?: string;
}

export function AttachmentGallery({
  attachments,
  loading = false,
  emptyMessage = "Nenhum anexo",
}: AttachmentGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <FileText className="h-5 w-5 mr-2" />
        {emptyMessage}
      </div>
    );
  }

  const images = attachments.filter((a) => a.is_image);
  const files = attachments.filter((a) => !a.is_image);

  return (
    <div className="space-y-4">
      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Imagens ({images.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => img.signed_url && setSelectedImage(img.signed_url)}
                className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {img.signed_url ? (
                  <img
                    src={img.signed_url}
                    alt={img.file_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Documentos ({files.length})
          </p>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <div className="h-10 w-10 flex-shrink-0 rounded-md bg-muted flex items-center justify-center">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file_size)}
                  </p>
                </div>

                {file.signed_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8 flex-shrink-0"
                  >
                    <a
                      href={file.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={file.file_name}
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Visualizar imagem</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Imagem ampliada"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
