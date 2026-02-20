import { ChevronDown, PlayCircle, CheckCircle2, Headphones, FileText } from "lucide-react";
import type { Module } from "@/data/courseData";
import type { UITranslations } from "@/data/languages";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface CourseSidebarProps {
  activeLessonId: string;
  onSelectLesson: (lessonId: string) => void;
  completedLessons?: Set<string>;
  modules: Module[];
  translations: UITranslations;
}

export function CourseSidebar({
  activeLessonId,
  onSelectLesson,
  completedLessons = new Set(),
  modules,
  translations: t,
}: CourseSidebarProps) {
  const activeModuleId = modules.find((m) =>
    m.lessons.some((l) => l.id === activeLessonId)
  )?.id;

  const [openModules, setOpenModules] = useState<Set<string>>(
    new Set(activeModuleId ? [activeModuleId] : [modules[0]?.id])
  );

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-card border-l border-border">
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-foreground text-sm uppercase tracking-wide">
          {t.courseContent}
        </h2>
      </div>
      <div className="flex flex-col pb-20">
        {modules.map((module, moduleIndex) => {
          const isOpen = openModules.has(module.id);
          const completedCount = module.lessons.filter((l) =>
            completedLessons.has(l.id)
          ).length;

          return (
            <Collapsible
              key={module.id}
              open={isOpen}
              onOpenChange={() => toggleModule(module.id)}
            >
              <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 p-3 px-4 text-left hover:bg-accent/50 transition-colors border-b border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">
                    {t.moduleLabel} {moduleIndex + 1} • {completedCount}/{module.lessons.length} {t.lessonsLabel}
                  </p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {module.emoji} {module.title}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ul className="border-b border-border">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isActive = lesson.id === activeLessonId;
                    const isCompleted = completedLessons.has(lesson.id);

                    return (
                      <li key={lesson.id}>
                        <button
                          onClick={() => onSelectLesson(lesson.id)}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 pl-6 text-left text-sm transition-colors",
                            isActive
                              ? "bg-accent text-accent-foreground font-medium"
                              : "hover:bg-accent/30 text-muted-foreground"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                          ) : lesson.type === "audio" ? (
                            <Headphones
                              className={cn(
                                "h-4 w-4 mt-0.5 shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                          ) : lesson.type === "ebook" ? (
                            <FileText
                              className={cn(
                                "h-4 w-4 mt-0.5 shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                          ) : (
                            <PlayCircle
                              className={cn(
                                "h-4 w-4 mt-0.5 shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground"
                              )}
                            />
                          )}
                          <span className="leading-snug">
                            {lessonIndex + 1}. {lesson.title}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
