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

// Bulbul V3 voices from Sarvam AI
const voices: VoiceOption[] = [
  { id: "meera", name: "Meera", gender: "female", style: "Warm • Expressive" },
  { id: "priya", name: "Priya", gender: "female", style: "Friendly • Conversational" },
  { id: "roopa", name: "Roopa", gender: "female", style: "Clear • Professional" },
  { id: "neha", name: "Neha", gender: "female", style: "Warm • Natural" },
  { id: "pooja", name: "Pooja", gender: "female", style: "Soft • Soothing" },
  { id: "simran", name: "Simran", gender: "female", style: "Young • Energetic" },
  { id: "kavya", name: "Kavya", gender: "female", style: "Elegant • Clear" },
  { id: "ishita", name: "Ishita", gender: "female", style: "Bright • Cheerful" },
  { id: "shreya", name: "Shreya", gender: "female", style: "Melodic • Calm" },
  { id: "ritu", name: "Ritu", gender: "female", style: "Confident • Clear" },
  { id: "amelia", name: "Amelia", gender: "female", style: "Modern • Articulate" },
  { id: "sophia", name: "Sophia", gender: "female", style: "Smooth • Professional" },
  { id: "arvind", name: "Arvind", gender: "male", style: "Warm • Mature" },
  { id: "aditya", name: "Aditya", gender: "male", style: "Deep • Authoritative" },
  { id: "rahul", name: "Rahul", gender: "male", style: "Friendly • Casual" },
  { id: "rohan", name: "Rohan", gender: "male", style: "Clear • Confident" },
  { id: "amit", name: "Amit", gender: "male", style: "Professional • Steady" },
  { id: "dev", name: "Dev", gender: "male", style: "Young • Dynamic" },
  { id: "varun", name: "Varun", gender: "male", style: "Natural • Conversational" },
  { id: "manan", name: "Manan", gender: "male", style: "Warm • Relatable" },
  { id: "sumit", name: "Sumit", gender: "male", style: "Clear • Articulate" },
  { id: "kabir", name: "Kabir", gender: "male", style: "Calm • Thoughtful" },
  { id: "shubh", name: "Shubh", gender: "male", style: "Confident • Warm" },
  { id: "ratan", name: "Ratan", gender: "male", style: "Mature • Authoritative" },
  { id: "advait", name: "Advait", gender: "male", style: "Modern • Clear" },
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

  const femaleVoices = voices.filter(v => v.gender === "female");
  const maleVoices = voices.filter(v => v.gender === "male");

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
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-card border border-border shadow-lg z-20 animate-fade-in max-h-80 overflow-y-auto">
            {/* Female voices */}
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Female Voices
              </p>
            </div>
            {femaleVoices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => {
                  onVoiceChange(voice);
                  setIsVoiceOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 transition-colors",
                  voice.id === selectedVoice.id
                    ? "bg-primary/10"
                    : "hover:bg-secondary"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center text-xs font-medium">
                  {voice.name[0]}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">{voice.name}</p>
                  <p className="text-xs text-muted-foreground">{voice.style}</p>
                </div>
              </button>
            ))}

            {/* Male voices */}
            <div className="px-4 py-2 bg-secondary/50 border-b border-border border-t">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Male Voices
              </p>
            </div>
            {maleVoices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => {
                  onVoiceChange(voice);
                  setIsVoiceOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-3 transition-colors",
                  voice.id === selectedVoice.id
                    ? "bg-primary/10"
                    : "hover:bg-secondary"
                )}
              >
                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-medium">
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
        Powered by Sarvam Bulbul V3 • 25+ voices • 11 Indian languages
      </p>
    </div>
  );
}

export { voices, languages };
