import { PlayCircle } from "lucide-react";
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
  const embedBlock = contentBlocks.find((b) => b.block_type === "embed" && b.content);

  if (embedBlock) {
    return (
      <div
        className="relative w-full bg-black"
        dangerouslySetInnerHTML={{ __html: embedBlock.content! }}
      />
    );
  }

  return (
    <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
        <PlayCircle className="h-16 w-16 mb-3" />
        <p className="text-sm">{t.videoPlaceholder}</p>
      </div>
    </div>
  );
}
