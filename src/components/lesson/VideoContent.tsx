import { PlayCircle } from "lucide-react";
import { parseVideoUrl } from "@/utils/videoUrl";
import type { UITranslations } from "@/data/languages";

interface ContentBlock {
  id: string;
  block_type: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  position: number;
}

interface VideoContentProps {
  contentBlocks: ContentBlock[];
  translations: UITranslations;
}

export function VideoContent({ contentBlocks, translations: t }: VideoContentProps) {
  // Priority 1: "video" block (new - upload or link)
  const videoBlock = contentBlocks.find((b) => b.block_type === "video" && (b.file_url || b.content));

  if (videoBlock) {
    // Uploaded video file (R2 or Supabase Storage)
    if (videoBlock.file_url) {
      return (
        <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <video
            src={videoBlock.file_url}
            controls
            controlsList="nodownload"
            className="w-full h-full object-contain"
            preload="metadata"
            playsInline
          />
        </div>
      );
    }

    // External link (Google Drive, Dropbox, direct URL)
    if (videoBlock.content) {
      const parsed = parseVideoUrl(videoBlock.content);

      if (parsed.type === "gdrive") {
        return (
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <iframe
              src={parsed.src}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              style={{ border: 0 }}
            />
          </div>
        );
      }

      if (parsed.type === "direct" || parsed.type === "dropbox") {
        return (
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <video
              src={parsed.src}
              controls
              controlsList="nodownload"
              className="w-full h-full object-contain"
              preload="metadata"
              playsInline
            />
          </div>
        );
      }

      // Embed fallback (generic iframe)
      if (parsed.src) {
        return (
          <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
            <iframe
              src={parsed.src}
              className="w-full h-full"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              style={{ border: 0 }}
            />
          </div>
        );
      }
    }
  }

  // Priority 2: "embed" block (legacy - raw HTML iframe)
  const embedBlock = contentBlocks.find((b) => b.block_type === "embed" && b.content);

  if (embedBlock) {
    return (
      <div
        className="relative w-full bg-black"
        dangerouslySetInnerHTML={{ __html: embedBlock.content! }}
      />
    );
  }

  // Placeholder
  return (
    <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
        <PlayCircle className="h-16 w-16 mb-3" />
        <p className="text-sm">{t.videoPlaceholder}</p>
      </div>
    </div>
  );
}
