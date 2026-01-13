import { useState, useRef, useCallback } from "react";
import { Upload, X, Image, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFileSize } from "@/hooks/useAttachments";

interface PendingFile {
  file: File;
  preview?: string;
  isImage: boolean;
}

interface AttachmentUploadProps {
  files: PendingFile[];
  onChange: (files: PendingFile[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function AttachmentUpload({
  files,
  onChange,
  maxFiles = 10,
  disabled = false,
}: AttachmentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles = newFiles.filter((file) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
          console.warn(`Tipo de arquivo não suportado: ${file.type}`);
          return false;
        }
        if (file.size > MAX_FILE_SIZE) {
          console.warn(`Arquivo muito grande: ${file.name}`);
          return false;
        }
        return true;
      });

      const remainingSlots = maxFiles - files.length;
      const filesToAdd = validFiles.slice(0, remainingSlots);

      const pendingFiles: PendingFile[] = filesToAdd.map((file) => {
        const isImage = file.type.startsWith("image/");
        return {
          file,
          preview: isImage ? URL.createObjectURL(file) : undefined,
          isImage,
        };
      });

      onChange([...files, ...pendingFiles]);
    },
    [files, maxFiles, onChange]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    const file = files[index];
    if (file.preview) {
      URL.revokeObjectURL(file.preview);
    }
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          relative rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer
          ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onDragOver={disabled ? undefined : handleDragOver}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDrop={disabled ? undefined : handleDrop}
        onClick={disabled ? undefined : () => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              JPG, PNG, WEBP ou PDF • Máx. 10MB por arquivo
            </p>
          </div>
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            {files.length} arquivo{files.length !== 1 ? "s" : ""} selecionado{files.length !== 1 ? "s" : ""}
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                {/* Preview or Icon */}
                <div className="h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                  {file.isImage && file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.file.size)}
                  </p>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export the PendingFile type for use in other components
export type { PendingFile };
