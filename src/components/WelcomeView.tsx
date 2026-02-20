import { PlayCircle, FileText, Headphones, CheckCircle2 } from "lucide-react";
import type { Module } from "@/data/courseData";
import type { UITranslations } from "@/data/languages";

interface WelcomeViewProps {
  userName: string;
  areaTitle: string;
  modules: Module[];
  completedLessons: Set<string>;
  onSelectLesson: (id: string) => void;
  translations: UITranslations;
}

const lessonIcon = (type?: string, completed?: boolean) => {
  if (completed) return <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />;
  switch (type) {
    case "ebook": return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />;
    case "audio": return <Headphones className="h-4 w-4 text-muted-foreground shrink-0" />;
    default: return <PlayCircle className="h-4 w-4 text-muted-foreground shrink-0" />;
  }
};

export function WelcomeView({ userName, areaTitle, modules, completedLessons, onSelectLesson, translations: t }: WelcomeViewProps) {
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalCompleted = modules.reduce((sum, m) => sum + m.lessons.filter((l) => completedLessons.has(l.id)).length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-8">
      {/* Welcome section */}
      <div className="text-center space-y-4">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight">
          {t.welcomeGreeting}, {userName}!
        </h2>
        <p className="text-base text-accent">{areaTitle}</p>

        {/* Overall progress */}
        <div className="max-w-xs mx-auto space-y-2 pt-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{totalCompleted} / {totalLessons} {t.welcomeProgress}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Module cards */}
      <div className="space-y-4">
        {modules.map((module) => {
          const moduleCompleted = module.lessons.filter((l) => completedLessons.has(l.id)).length;
          const moduleTotal = module.lessons.length;
          const modulePercent = moduleTotal > 0 ? Math.round((moduleCompleted / moduleTotal) * 100) : 0;

          return (
            <div key={module.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Module header */}
              <div className="px-5 py-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{module.emoji}</span>
                    <h3 className="text-sm font-semibold text-foreground">{module.title}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {moduleCompleted}/{moduleTotal}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all duration-500"
                    style={{ width: `${modulePercent}%` }}
                  />
                </div>
              </div>

              {/* Lesson list */}
              <div className="divide-y divide-border/30">
                {module.lessons.map((lesson, idx) => {
                  const isCompleted = completedLessons.has(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onSelectLesson(lesson.id)}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-muted/50 transition-colors group"
                    >
                      {lessonIcon(lesson.type, isCompleted)}
                      <span className={`text-sm flex-1 ${isCompleted ? "text-muted-foreground" : "text-foreground"}`}>
                        {idx + 1}. {lesson.title}
                      </span>
                      {lesson.duration && (
                        <span className="text-xs text-muted-foreground">{lesson.duration}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
