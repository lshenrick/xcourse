import { useState, useRef, useEffect, useCallback } from "react";
import { Headphones, Play, Pause, Download, Volume2, VolumeX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UITranslations } from "@/data/languages";

interface ContentBlock {
  id: string;
  block_type: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  position: number;
}

interface AudioContentProps {
  contentBlocks: ContentBlock[];
  translations: UITranslations;
}

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioContent({ contentBlocks, translations: t }: AudioContentProps) {
  const audioBlock = contentBlocks.find(
    (b) => b.block_type === "audio" && (b.file_url || b.content)
  );

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    if (!audioBlock?.file_url) return;
    setDownloading(true);
    fetch(audioBlock.file_url)
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = audioBlock.file_name || "audio.mp3";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .finally(() => setDownloading(false));
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, [audioBlock?.file_url]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full bg-gradient-to-b from-secondary via-card to-background flex flex-col items-center justify-center gap-6 py-16 md:py-24 border-b border-border overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Breathing circle icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-breathe" />
        <div className="relative w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-lg shadow-primary/10">
          <Headphones className="h-12 w-12 text-primary" />
        </div>
      </div>

      {/* Title */}
      <h2 className="text-xl md:text-2xl font-serif font-semibold text-foreground text-center px-4 tracking-tight">
        {t.audioTitle}
      </h2>

      <p className="text-sm text-muted-foreground text-center px-4">
        {t.audioDescription}
      </p>

      {/* Custom audio player */}
      {audioBlock?.file_url && (
        <>
          <audio ref={audioRef} src={audioBlock.file_url} muted={muted} preload="metadata" />

          <div className="w-full max-w-lg px-6">
            <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-5 shadow-lg">
              {/* Controls row */}
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 shadow-md"
                >
                  {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </button>

                {/* Progress + time */}
                <div className="flex-1 min-w-0">
                  {/* Progress bar */}
                  <div
                    ref={progressRef}
                    onClick={seek}
                    className="h-2 bg-muted rounded-full cursor-pointer group relative"
                  >
                    <div
                      className="h-full bg-primary rounded-full transition-all relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary rounded-full border-2 border-primary-foreground shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-muted-foreground tabular-nums">{formatTime(currentTime)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{duration > 0 ? formatTime(duration) : "--:--"}</span>
                  </div>
                </div>

                {/* Mute */}
                <button
                  onClick={() => setMuted(!muted)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              </div>

              {/* File name + download */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <span className="text-xs text-muted-foreground truncate mr-3">
                  {audioBlock.file_name || "audio"}
                </span>
                <Button variant="outline" size="sm" className="gap-2 text-xs h-8 shrink-0" onClick={handleDownload} disabled={downloading}>
                  {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Download
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Embedded HTML content (for external players) */}
      {audioBlock?.content && !audioBlock?.file_url && (
        <div
          className="w-full max-w-lg px-6"
          dangerouslySetInnerHTML={{ __html: audioBlock.content }}
        />
      )}
    </div>
  );
}
