import { FileText, Volume2, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProcessingStep = "idle" | "extracting" | "generating" | "complete" | "error";

interface ProcessingStatusProps {
  step: ProcessingStep;
  error?: string;
}

export function ProcessingStatus({ step, error }: ProcessingStatusProps) {
  if (step === "idle") return null;

  const steps = [
    {
      id: "extracting",
      label: "Reading PDF",
      sublabel: "Extracting text with AI",
      icon: FileText,
    },
    {
      id: "generating",
      label: "Generating Voice",
      sublabel: "Converting text to speech",
      icon: Volume2,
    },
  ];

  const getCurrentStepIndex = () => {
    if (step === "extracting") return 0;
    if (step === "generating") return 1;
    if (step === "complete") return 2;
    return -1;
  };

  const currentIndex = getCurrentStepIndex();

  if (step === "error") {
    return (
      <div className="w-full p-6 rounded-xl bg-destructive/10 border border-destructive/20 animate-fade-in">
        <p className="text-destructive font-medium">{error || "An error occurred"}</p>
      </div>
    );
  }

  return (
    <div className="w-full p-6 rounded-xl bg-card shadow-soft border border-border animate-fade-in">
      <div className="flex items-center gap-6">
        {steps.map((s, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex || step === "complete";
          const Icon = s.icon;

          return (
            <div key={s.id} className="flex-1 flex items-center gap-3">
              <div
                className={cn(
                  "flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
                  isComplete && "gradient-primary shadow-glow",
                  isActive && "bg-primary/10 border-2 border-primary",
                  !isComplete && !isActive && "bg-secondary"
                )}
              >
                {isComplete ? (
                  <Check className="w-6 h-6 text-primary-foreground" />
                ) : isActive ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <Icon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    "font-medium transition-colors",
                    isComplete && "text-primary",
                    isActive && "text-foreground",
                    !isComplete && !isActive && "text-muted-foreground"
                  )}
                >
                  {s.label}
                </p>
                <p className="text-sm text-muted-foreground">{s.sublabel}</p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4 rounded-full transition-colors duration-500",
                    index < currentIndex ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
