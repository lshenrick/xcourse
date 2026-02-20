import { useState, useEffect } from "react";
import { PlayCircle, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { LessonCompleteButton } from "@/components/LessonCompleteButton";
import { CommentSection } from "@/components/CommentSection";
import { supabase } from "@/integrations/supabase/client";
import type { Module } from "@/data/courseData";
import type { UITranslations, LanguageCode } from "@/data/languages";

interface ContentBlock {
  id: string;
  block_type: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  position: number;
}

interface VideoPlayerProps {
  lessonId: string;
  onSelectLesson: (id: string) => void;
  modules: Module[];
  translations: UITranslations;
  onLessonComplete?: (lessonId: string, completed: boolean) => void;
  language: LanguageCode;
}

export function VideoPlayer({ lessonId, onSelectLesson, modules, translations: t, onLessonComplete, language }: VideoPlayerProps) {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  const allLessons = modules.flatMap((mod) =>
    mod.lessons.map((l) => ({ ...l, module: mod }))
  );
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const current = allLessons[currentIndex];
  const prev = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const next = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Fetch content blocks from DB for this lesson
  useEffect(() => {
    setContentBlocks([]);
    supabase
      .from("lesson_content_blocks")
      .select("*")
      .eq("lesson_id", lessonId)
      .order("position")
      .then(({ data }) => {
        if (data) setContentBlocks(data as ContentBlock[]);
      });
  }, [lessonId]);

  if (!current) return null;

  const isEbook = current.type === "ebook";
  const embedBlock = contentBlocks.find((b) => b.block_type === "embed" && b.content);
  const hasEmbed = !!embedBlock;
  const fileBlock = contentBlocks.find((b) => b.block_type === "file" && b.file_url);

  return (
    <div className="w-full">
      {isEbook ? (
        <div className="relative w-full bg-muted flex flex-col items-center justify-center gap-4 py-16 md:py-24 border-b border-border">
          <FileText className="h-20 w-20 text-primary" />
          <h2 className="text-lg md:text-xl font-semibold text-foreground text-center px-4">
            {t.ebookTitle}
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-md px-4">
            {t.ebookDescription}
          </p>
          {fileBlock?.file_url ? (
            <a href={fileBlock.file_url} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="mt-2 gap-2">
                <Download className="h-5 w-5" />
                {t.downloadEbook}
              </Button>
            </a>
          ) : (
            <Button size="lg" className="mt-2 gap-2" disabled>
              <Download className="h-5 w-5" />
              {t.downloadEbook}
            </Button>
          )}
        </div>
      ) : hasEmbed ? (
        <div
          className="relative w-full bg-black"
          dangerouslySetInnerHTML={{ __html: embedBlock!.content! }}
        />
      ) : (
        <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60">
            <PlayCircle className="h-16 w-16 mb-3" />
            <p className="text-sm">{t.videoPlaceholder}</p>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6">
        <p className="text-xs text-muted-foreground mb-1">
          {current.module.emoji} {current.module.title}
        </p>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          {current.title}
        </h1>

        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <StarRating lessonId={current.id} label={t.yourRating} language={language} />
          <LessonCompleteButton lessonId={current.id} translations={t} onToggle={onLessonComplete} language={language} />
        </div>

        <div className="flex items-center justify-between mt-4 gap-3">
          <Button variant="outline" size="sm" disabled={!prev} onClick={() => prev && onSelectLesson(prev.id)}>
            <ChevronLeft className="h-4 w-4" />
            {t.previousLesson}
          </Button>
          <Button variant="outline" size="sm" disabled={!next} onClick={() => next && onSelectLesson(next.id)}>
            {t.nextLesson}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Additional content blocks (text, files) */}
        {contentBlocks
          .filter((b) => b.block_type !== "embed")
          .map((block) => (
            <div key={block.id} className="mt-4">
              {block.block_type === "text" && block.content && (
                <div
                  className="prose prose-sm max-w-none text-foreground"
                  dangerouslySetInnerHTML={{ __html: block.content }}
                />
              )}
              {block.block_type === "file" && block.file_url && (
                <a
                  href={block.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {block.file_name || "Download"}
                </a>
              )}
            </div>
          ))}

        <CommentSection lessonId={current.id} translations={t} language={language} />

        <div className="mt-6 pt-4 border-t border-border text-center pb-16 lg:pb-0">
          <p className="text-xs text-muted-foreground">{t.supportText}</p>
          <p className="text-xs font-medium text-primary">{t.supportLabel}</p>
        </div>
      </div>
    </div>
  );
}
