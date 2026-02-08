import { ChevronDown, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface VoiceOption {
  id: string;
  name: string;
  gender: "male" | "female";
  language: string;
}

const voices: VoiceOption[] = [
  { id: "meera", name: "Meera", gender: "female", language: "Indian English" },
  { id: "pavithra", name: "Pavithra", gender: "female", language: "Indian English" },
  { id: "maitreyi", name: "Maitreyi", gender: "female", language: "Indian English" },
  { id: "arvind", name: "Arvind", gender: "male", language: "Indian English" },
  { id: "amol", name: "Amol", gender: "male", language: "Indian English" },
  { id: "amartya", name: "Amartya", gender: "male", language: "Indian English" },
];

interface VoiceSelectorProps {
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  disabled?: boolean;
}

export function VoiceSelector({ selectedVoice, onVoiceChange, disabled }: VoiceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card transition-all w-full",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 cursor-pointer"
        )}
      >
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-medium text-foreground">{selectedVoice.name}</p>
          <p className="text-sm text-muted-foreground">{selectedVoice.language}</p>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 py-2 rounded-xl bg-card border border-border shadow-lg z-10 animate-fade-in">
          {voices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => {
                onVoiceChange(voice);
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 transition-colors",
                voice.id === selectedVoice.id
                  ? "bg-primary/10"
                  : "hover:bg-secondary"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                  voice.gender === "female"
                    ? "bg-accent/20 text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                )}
              >
                {voice.name[0]}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{voice.name}</p>
                <p className="text-sm text-muted-foreground">
                  {voice.gender === "female" ? "Female" : "Male"} • {voice.language}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { voices };
