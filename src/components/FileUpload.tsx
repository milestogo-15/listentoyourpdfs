import { useCallback, useState } from "react";
import { Upload, FileText, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  selectedFile: File | null;
  onClear: () => void;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const ACCEPTED_EXTENSIONS = ".pdf,.png,.jpg,.jpeg,.webp,.gif";

export function FileUpload({ onFileSelect, isProcessing, selectedFile, onClear }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const isValidFile = (file: File) => {
    return ACCEPTED_TYPES.includes(file.type);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragOver(true);
    } else if (e.type === "dragleave") {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files?.[0] && isValidFile(files[0])) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files?.[0]) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  const isImage = selectedFile?.type.startsWith("image/");
  const isPdf = selectedFile?.type === "application/pdf";

  if (selectedFile) {
    return (
      <div className="relative w-full p-6 rounded-xl bg-card shadow-soft border border-border animate-fade-in">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center",
            isPdf ? "gradient-primary" : "bg-accent"
          )}>
            {isPdf ? (
              <FileText className="w-7 h-7 text-primary-foreground" />
            ) : (
              <Image className="w-7 h-7 text-accent-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-medium text-foreground truncate">
              {selectedFile.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {isImage ? "Image" : "PDF"}
            </p>
          </div>
          {!isProcessing && (
            <button
              onClick={onClear}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
              aria-label="Remove file"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative w-full p-12 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer group",
        isDragOver
          ? "border-primary bg-primary/5 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-secondary/50"
      )}
    >
      <input
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />
      <div className="flex flex-col items-center justify-center text-center">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
            isDragOver
              ? "gradient-primary shadow-glow"
              : "bg-secondary group-hover:bg-primary/10"
          )}
        >
          <Upload
            className={cn(
              "w-8 h-8 transition-colors",
              isDragOver ? "text-primary-foreground" : "text-primary"
            )}
          />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Drop your file here
        </h3>
        <p className="text-muted-foreground mb-2">
          or click to browse from your computer
        </p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" /> PDF
          </span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <Image className="w-4 h-4" /> PNG, JPG, WebP
          </span>
        </div>
      </div>
    </div>
  );
}
