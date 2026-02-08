import { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  onAudioRef?: (ref: React.RefObject<HTMLAudioElement>) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
}

export function AudioPlayer({ audioUrl, onAudioRef, onPlayingChange }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (onAudioRef) {
      onAudioRef(audioRef);
    }
  }, [onAudioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  const updatePlayingState = (playing: boolean) => {
    setIsPlaying(playing);
    if (onPlayingChange) {
      onPlayingChange(playing);
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    updatePlayingState(!isPlaying);
  };

  const handleRestart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play();
    updatePlayingState(true);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full p-6 rounded-xl bg-card shadow-soft border border-border animate-fade-in">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
          <Volume2 className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Audio Ready</h3>
          <p className="text-sm text-muted-foreground">
            {formatTime(duration)} total
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative mb-4">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
        />
      </div>

      {/* Time display */}
      <div className="flex justify-between text-sm text-muted-foreground mb-4">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleRestart}
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          aria-label="Restart"
        >
          <RotateCcw className="w-5 h-5 text-foreground" />
        </button>
        <button
          onClick={togglePlayPause}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all",
            "gradient-primary shadow-glow hover:scale-105"
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-primary-foreground" />
          ) : (
            <Play className="w-6 h-6 text-primary-foreground ml-1" />
          )}
        </button>
        <a
          href={audioUrl}
          download="voicereader-audio.wav"
          className="p-3 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
          aria-label="Download"
        >
          <Download className="w-5 h-5 text-foreground" />
        </a>
      </div>
    </div>
  );
}
