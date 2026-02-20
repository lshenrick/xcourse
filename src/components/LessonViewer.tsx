import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Module } from "@/data/courseData";
import type { UITranslations, LanguageCode } from "@/data/languages";
import { VideoContent } from "./lesson/VideoContent";
import { EbookContent } from "./lesson/EbookContent";
import { AudioContent } from "./lesson/AudioContent";
import { LessonFooter } from "./lesson/LessonFooter";

interface ContentBlock {
  id: string;
  block_type: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  position: number;
}

interface LessonViewerProps {
  lessonId: string;
  onSelectLesson: (id: string) => void;
  modules: Module[];
  translations: UITranslations;
  onLessonComplete?: (lessonId: string, completed: boolean) => void;
  language: LanguageCode;
  supportEmail?: string;
}

export function LessonViewer({
  lessonId, onSelectLesson, modules,
  translations, onLessonComplete, language, supportEmail,
}: LessonViewerProps) {
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);

  const allLessons = modules.flatMap((mod) =>
    mod.lessons.map((l) => ({ ...l, module: mod }))
  );
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const current = allLessons[currentIndex];
  const prev = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const next = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

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

  const renderContent = () => {
    switch (current.type) {
      case "audio":
        return <AudioContent contentBlocks={contentBlocks} translations={translations} />;
      case "ebook":
        return <EbookContent contentBlocks={contentBlocks} translations={translations} />;
      case "video":
      default:
        return <VideoContent contentBlocks={contentBlocks} translations={translations} />;
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
      <LessonFooter
        lessonId={current.id}
        moduleEmoji={current.module.emoji}
        moduleTitle={current.module.title}
        lessonTitle={current.title}
        contentBlocks={contentBlocks}
        translations={translations}
        language={language}
        onLessonComplete={onLessonComplete}
        prevLesson={prev}
        nextLesson={next}
        onSelectLesson={onSelectLesson}
        supportEmail={supportEmail}
      />
    </div>
  );
}
