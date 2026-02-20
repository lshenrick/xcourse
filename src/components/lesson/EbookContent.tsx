import { BookOpen, Download, FileText } from "lucide-react";
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

interface EbookContentProps {
  contentBlocks: ContentBlock[];
  translations: UITranslations;
}

export function EbookContent({ contentBlocks, translations: t }: EbookContentProps) {
  const fileBlock = contentBlocks.find((b) => b.block_type === "file" && b.file_url);

  return (
    <div className="relative w-full bg-gradient-to-b from-secondary via-card to-background border-b border-border overflow-hidden">
      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center justify-center gap-6 py-16 md:py-24 px-6">
        {/* Icon */}
        <div className="w-28 h-28 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-lg shadow-accent/5">
          <BookOpen className="h-14 w-14 text-accent" />
        </div>

        {/* Title */}
        <h2 className="text-xl md:text-2xl font-serif text-accent text-center">
          {t.ebookTitle}
        </h2>

        <p className="text-sm text-muted-foreground text-center max-w-md leading-relaxed">
          {t.ebookDescription}
        </p>

        {/* Download card */}
        {fileBlock?.file_url && (
          <div className="w-full max-w-md mt-2">
            <div className="bg-card/80 backdrop-blur border border-border rounded-2xl p-5 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {fileBlock.file_name || "E-book"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PDF
                  </p>
                </div>
                <a href={fileBlock.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                  <Button size="sm" className="gap-2 px-4 h-9">
                    <Download className="h-4 w-4" />
                    {t.downloadEbook}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}

        {!fileBlock?.file_url && (
          <Button size="lg" className="mt-2 gap-3 px-8" disabled>
            <Download className="h-5 w-5" />
            {t.downloadEbook}
          </Button>
        )}
      </div>

      {/* Decorative divider */}
      <div className="flex items-center justify-center gap-4 px-8 pb-6">
        <div className="h-px flex-1 bg-border" />
        <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
