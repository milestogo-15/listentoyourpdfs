import { useEffect, useState, useRef } from "react";
import { FileText, Download } from "lucide-react";

interface SyncedReadingViewProps {
  file: File;
  text: string;
  audioRef: React.RefObject<HTMLAudioElement> | null;
  isPlaying: boolean;
}

export function SyncedReadingView({ file, text, audioRef, isPlaying }: SyncedReadingViewProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  
  const words = text.split(/(\s+)/); // Keep whitespace for accurate reconstruction
  const wordOnlyList = words.filter(w => w.trim().length > 0);
  const totalDuration = audioRef?.current?.duration || 0;
  const wordsPerSecond = totalDuration > 0 ? wordOnlyList.length / totalDuration : 3;

  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";

  useEffect(() => {
    if (!isPlaying || !audioRef?.current) return;

    const updateHighlight = () => {
      const currentTime = audioRef.current?.currentTime || 0;
      const estimatedWordIndex = Math.floor(currentTime * wordsPerSecond);
      const clampedIndex = Math.min(estimatedWordIndex, wordOnlyList.length - 1);
      
      if (clampedIndex !== currentWordIndex) {
        setCurrentWordIndex(clampedIndex);
      }
    };

    const interval = setInterval(updateHighlight, 50);
    return () => clearInterval(interval);
  }, [isPlaying, wordsPerSecond, wordOnlyList.length, currentWordIndex, audioRef]);

  // Auto-scroll to keep highlighted word visible
  useEffect(() => {
    if (highlightRef.current && textContainerRef.current) {
      const container = textContainerRef.current;
      const highlight = highlightRef.current;
      const containerRect = container.getBoundingClientRect();
      const highlightRect = highlight.getBoundingClientRect();
      
      if (highlightRect.top < containerRect.top || highlightRect.bottom > containerRect.bottom) {
        highlight.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentWordIndex]);

  // Reset when audio restarts
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;

    const handleSeeked = () => {
      if (audio.currentTime < 0.5) {
        setCurrentWordIndex(-1);
      }
    };

    audio.addEventListener("seeked", handleSeeked);
    return () => audio.removeEventListener("seeked", handleSeeked);
  }, [audioRef]);

  // Track actual word index across whitespace-preserved array
  let wordCounter = -1;

  return (
    <div className="w-full rounded-xl bg-card shadow-soft border border-border overflow-hidden animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[400px]">
        {/* Left: File Preview */}
        <div className="border-b lg:border-b-0 lg:border-r border-border bg-secondary/20">
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {isImage ? "Uploaded Image" : "Uploaded PDF"}
            </p>
          </div>
          <div className="p-4 flex items-center justify-center h-[350px] overflow-auto">
            {isImage ? (
              <img
                src={URL.createObjectURL(file)}
                alt="Uploaded preview"
                className="max-h-full max-w-full rounded-lg object-contain"
              />
            ) : isPdf ? (
              <iframe
                src={URL.createObjectURL(file)}
                className="w-full h-full border-0 rounded-lg"
                title="PDF Preview"
              />
            ) : (
              <div className="text-muted-foreground">Preview not available</div>
            )}
          </div>
        </div>

        {/* Right: Synced Text */}
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b border-border bg-secondary/30 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Extracted Text</p>
            <div className="flex items-center gap-3">
              {isPlaying && (
                <span className="flex items-center gap-2 text-sm text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Reading...
                </span>
              )}
              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}
                download="extracted-text.txt"
                className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                aria-label="Download text"
                title="Download text"
              >
                <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
          </div>
          <div 
            ref={textContainerRef}
            className="p-4 h-[350px] overflow-y-auto"
          >
            <p className="text-foreground leading-relaxed text-base">
              {words.map((word, index) => {
                const isWhitespace = word.trim().length === 0;
                if (!isWhitespace) {
                  wordCounter++;
                }
                const isHighlighted = !isWhitespace && wordCounter === currentWordIndex;
                const isPast = !isWhitespace && wordCounter < currentWordIndex;
                
                if (isWhitespace) {
                  return <span key={index}>{word}</span>;
                }
                
                return (
                  <span
                    key={index}
                    ref={isHighlighted ? highlightRef : null}
                    className={
                      isHighlighted
                        ? "bg-yellow-300 dark:bg-yellow-500/70 text-foreground px-0.5 rounded transition-colors duration-100"
                        : isPast
                        ? "text-muted-foreground transition-colors duration-300"
                        : ""
                    }
                  >
                    {word}
                  </span>
                );
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
