import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/StarRating";
import { LessonCompleteButton } from "@/components/LessonCompleteButton";
import { CommentSection } from "@/components/CommentSection";
import { ContentBlocks } from "./ContentBlocks";
import type { UITranslations, LanguageCode } from "@/data/languages";

interface ContentBlock {
  id: string;
  block_type: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  position: number;
}

interface LessonFooterProps {
  lessonId: string;
  moduleEmoji: string;
  moduleTitle: string;
  lessonTitle: string;
  contentBlocks: ContentBlock[];
  translations: UITranslations;
  language: LanguageCode;
  onLessonComplete?: (lessonId: string, completed: boolean) => void;
  prevLesson: { id: string } | null;
  nextLesson: { id: string } | null;
  onSelectLesson: (id: string) => void;
}

export function LessonFooter({
  lessonId, moduleEmoji, moduleTitle, lessonTitle,
  contentBlocks, translations: t, language,
  onLessonComplete, prevLesson, nextLesson, onSelectLesson,
}: LessonFooterProps) {
  return (
    <div className="p-4 md:p-6">
      <p className="text-xs text-muted-foreground mb-1">
        {moduleEmoji} {moduleTitle}
      </p>
      <h1 className="text-xl md:text-2xl font-bold text-foreground">
        {lessonTitle}
      </h1>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <StarRating lessonId={lessonId} label={t.yourRating} language={language} />
        <LessonCompleteButton lessonId={lessonId} translations={t} onToggle={onLessonComplete} language={language} />
      </div>

      <div className="flex items-center justify-between mt-4 gap-3">
        <Button variant="outline" size="sm" disabled={!prevLesson} onClick={() => prevLesson && onSelectLesson(prevLesson.id)}>
          <ChevronLeft className="h-4 w-4" />
          {t.previousLesson}
        </Button>
        <Button variant="outline" size="sm" disabled={!nextLesson} onClick={() => nextLesson && onSelectLesson(nextLesson.id)}>
          {t.nextLesson}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <ContentBlocks blocks={contentBlocks} />

      <CommentSection lessonId={lessonId} translations={t} language={language} />

      <div className="mt-6 pt-4 border-t border-border text-center pb-16 lg:pb-0">
        <p className="text-xs text-muted-foreground">{t.supportText}</p>
        <p className="text-xs font-medium text-primary">{t.supportLabel}</p>
      </div>
    </div>
  );
}
