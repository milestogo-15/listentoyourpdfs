import { FileText, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TextPreviewProps {
  text: string;
}

export function TextPreview({ text }: TextPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!text) return null;

  return (
    <div className="w-full rounded-xl bg-card shadow-soft border border-border overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Extracted Text</h3>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            copied
              ? "bg-success text-success-foreground"
              : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          )}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <div className="p-6 max-h-64 overflow-y-auto">
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
      </div>
    </div>
  );
}
