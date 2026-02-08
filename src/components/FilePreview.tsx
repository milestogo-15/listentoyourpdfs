import { FileText } from "lucide-react";

interface FilePreviewProps {
  file: File;
}

export function FilePreview({ file }: FilePreviewProps) {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  if (isImage) {
    return (
      <div className="w-full rounded-xl overflow-hidden bg-card shadow-soft border border-border animate-fade-in">
        <div className="px-6 py-3 border-b border-border bg-secondary/30">
          <p className="text-sm font-medium text-foreground">Uploaded Image</p>
        </div>
        <div className="p-4 flex justify-center">
          <img
            src={URL.createObjectURL(file)}
            alt="Uploaded preview"
            className="max-h-64 rounded-lg object-contain"
          />
        </div>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="w-full rounded-xl overflow-hidden bg-card shadow-soft border border-border animate-fade-in">
        <div className="px-6 py-3 border-b border-border bg-secondary/30">
          <p className="text-sm font-medium text-foreground">Uploaded PDF</p>
        </div>
        <div className="p-4 flex justify-center">
          <div className="w-full h-64 rounded-lg overflow-hidden">
            <iframe
              src={URL.createObjectURL(file)}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 rounded-xl bg-card shadow-soft border border-border animate-fade-in flex items-center justify-center gap-3">
      <FileText className="w-8 h-8 text-muted-foreground" />
      <span className="text-muted-foreground">Preview not available</span>
    </div>
  );
}
