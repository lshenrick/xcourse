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
  supportEmail?: string;
}

export function LessonFooter({
  lessonId, moduleEmoji, moduleTitle, lessonTitle,
  contentBlocks, translations: t, language,
  onLessonComplete, prevLesson, nextLesson, onSelectLesson, supportEmail,
}: LessonFooterProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6">
      {/* Lesson title + module */}
      <div>
        <p className="text-xs text-muted-foreground mb-1.5 tracking-wide">
          {moduleEmoji} {moduleTitle}
        </p>
        <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground leading-tight">
          {lessonTitle}
        </h1>
      </div>

      {/* Actions row — rating + complete button */}
      <div className="flex items-center justify-between">
        <StarRating lessonId={lessonId} label={t.yourRating} language={language} />
        <LessonCompleteButton lessonId={lessonId} translations={t} onToggle={onLessonComplete} language={language} />
      </div>

      {/* Content blocks (text, files) */}
      <ContentBlocks blocks={contentBlocks} />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" disabled={!prevLesson} onClick={() => prevLesson && onSelectLesson(prevLesson.id)} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{t.previousLesson}</span>
        </Button>
        <Button variant="ghost" size="sm" disabled={!nextLesson} onClick={() => nextLesson && onSelectLesson(nextLesson.id)} className="gap-1.5 text-muted-foreground hover:text-foreground">
          <span className="hidden sm:inline">{t.nextLesson}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments */}
      <CommentSection lessonId={lessonId} translations={t} language={language} />

      {/* Support footer */}
      <div className="pt-4 border-t border-border text-center pb-16 lg:pb-0">
        <p className="text-xs text-muted-foreground">{t.supportText} <span className="font-medium text-primary">{supportEmail || t.supportLabel}</span></p>
      </div>
    </div>
  );
}
