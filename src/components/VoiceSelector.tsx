import { ChevronDown, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface VoiceOption {
  id: string;
  name: string;
  gender: "male" | "female";
  style: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

const languages: LanguageOption[] = [
  { code: "en-IN", name: "English", nativeName: "English (Indian)" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "od-IN", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
];

// Simplified voice options
const voices: VoiceOption[] = [
  { id: "anushka", name: "Anushka", gender: "female", style: "Female • Warm & Expressive" },
  { id: "arvind", name: "Arvind", gender: "male", style: "Male • Clear & Professional" },
];

interface VoiceSelectorProps {
  selectedVoice: VoiceOption;
  onVoiceChange: (voice: VoiceOption) => void;
  selectedLanguage: LanguageOption;
  onLanguageChange: (language: LanguageOption) => void;
  disabled?: boolean;
}

export function VoiceSelector({ 
  selectedVoice, 
  onVoiceChange, 
  selectedLanguage,
  onLanguageChange,
  disabled 
}: VoiceSelectorProps) {
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const voiceRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (voiceRef.current && !voiceRef.current.contains(event.target as Node)) {
        setIsVoiceOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  return (
    <div className="space-y-4">
      {/* Language Selector */}
      <div ref={languageRef} className="relative">
        <label className="block text-sm font-medium text-foreground mb-2">
          Output Language
        </label>
        <button
          onClick={() => !disabled && setIsLanguageOpen(!isLanguageOpen)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card transition-all w-full",
            disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 cursor-pointer"
          )}
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg">
            {selectedLanguage.code === "en-IN" ? "🇬🇧" : "🇮🇳"}
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground">{selectedLanguage.name}</p>
            <p className="text-sm text-muted-foreground">{selectedLanguage.nativeName}</p>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isLanguageOpen && "rotate-180"
            )}
          />
        </button>

        {isLanguageOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 py-2 rounded-xl bg-card border border-border shadow-lg z-20 animate-fade-in max-h-64 overflow-y-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang);
                  setIsLanguageOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 transition-colors",
                  lang.code === selectedLanguage.code
                    ? "bg-primary/10"
                    : "hover:bg-secondary"
                )}
              >
                <span className="text-lg">{lang.code === "en-IN" ? "🇬🇧" : "🇮🇳"}</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{lang.name}</p>
                  <p className="text-sm text-muted-foreground">{lang.nativeName}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Voice Selector */}
      <div ref={voiceRef} className="relative">
        <label className="block text-sm font-medium text-foreground mb-2">
          Choose Voice
        </label>
        <button
          onClick={() => !disabled && setIsVoiceOpen(!isVoiceOpen)}
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
            <p className="text-sm text-muted-foreground">{selectedVoice.style}</p>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isVoiceOpen && "rotate-180"
            )}
          />
        </button>

        {isVoiceOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-card border border-border shadow-lg z-20 animate-fade-in">
            {voices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => {
                  onVoiceChange(voice);
                  setIsVoiceOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl",
                  voice.id === selectedVoice.id
                    ? "bg-primary/10"
                    : "hover:bg-secondary"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                  voice.gender === "female" ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-secondary-foreground"
                )}>
                  {voice.name[0]}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{voice.name}</p>
                  <p className="text-xs text-muted-foreground">{voice.style}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Model info */}
      <p className="text-xs text-muted-foreground text-center">
        Powered by Sarvam Bulbul • 11 Indian languages
      </p>
    </div>
  );
}

export { voices, languages };
