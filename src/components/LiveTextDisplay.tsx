import { useEffect, useState, useRef } from "react";
import { MessageSquare } from "lucide-react";

interface LiveTextDisplayProps {
  text: string;
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
}

export function LiveTextDisplay({ text, audioRef, isPlaying }: LiveTextDisplayProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const words = text.split(/\s+/);
  const totalDuration = audioRef.current?.duration || 0;
  const wordsPerSecond = totalDuration > 0 ? words.length / totalDuration : 3;

  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;

    const updateText = () => {
      const currentTime = audioRef.current?.currentTime || 0;
      const estimatedWordIndex = Math.floor(currentTime * wordsPerSecond);
      const clampedIndex = Math.min(estimatedWordIndex, words.length);
      
      if (clampedIndex !== currentWordIndex) {
        setCurrentWordIndex(clampedIndex);
        setDisplayedText(words.slice(0, clampedIndex + 1).join(" "));
      }
    };

    const interval = setInterval(updateText, 100);
    return () => clearInterval(interval);
  }, [isPlaying, wordsPerSecond, words, currentWordIndex, audioRef]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedText]);

  // Reset when audio restarts
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleSeeked = () => {
      const currentTime = audio.currentTime;
      if (currentTime < 0.5) {
        setCurrentWordIndex(0);
        setDisplayedText("");
      }
    };

    audio.addEventListener("seeked", handleSeeked);
    return () => audio.removeEventListener("seeked", handleSeeked);
  }, [audioRef]);

  if (!text) return null;

  return (
    <div className="w-full rounded-xl bg-card shadow-soft border border-border overflow-hidden animate-fade-in">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-secondary/30">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Live Text</h3>
        {isPlaying && (
          <span className="ml-auto flex items-center gap-2 text-sm text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Speaking...
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="p-6 h-40 overflow-y-auto"
      >
        <p className="text-foreground leading-relaxed text-lg">
          {displayedText || (
            <span className="text-muted-foreground italic">
              Press play to see the text as it's spoken...
            </span>
          )}
          {isPlaying && displayedText && (
            <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse" />
          )}
        </p>
      </div>
    </div>
  );
}
