import { useState, useEffect, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { CourseSidebar } from "@/components/CourseSidebar";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getLanguageBySlug, uiTranslations } from "@/data/languages";
import type { Module } from "@/data/courseData";
import { ChevronUp, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { langSlug } = useParams<{ langSlug: string }>();
  const lang = getLanguageBySlug(langSlug || "");
  const { user, loading, signOut } = useAuth();

  const t = lang ? uiTranslations[lang.code] : null;

  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  // Fetch modules + lessons from database
  useEffect(() => {
    if (!lang) return;
    setModulesLoading(true);

    const fetchModules = async () => {
      const { data: dbModules } = await supabase
        .from("course_modules")
        .select("*")
        .eq("language", lang.code)
        .order("position");

      if (!dbModules || dbModules.length === 0) {
        setModules([]);
        setModulesLoading(false);
        return;
      }

      const moduleIds = dbModules.map((m) => m.id);
      const { data: dbLessons } = await supabase
        .from("course_lessons")
        .select("*")
        .in("module_id", moduleIds)
        .order("position");

      const mapped: Module[] = dbModules.map((m) => ({
        id: m.id,
        title: m.title,
        emoji: m.emoji,
        lessons: (dbLessons || [])
          .filter((l) => l.module_id === m.id)
          .map((l) => ({
            id: l.id,
            title: l.title,
            duration: l.duration || undefined,
            type: l.type as "video" | "ebook" | undefined,
          })),
      }));

      setModules(mapped);
      // Set first lesson as active if none set
      if (!activeLessonId || !mapped.some((m) => m.lessons.some((l) => l.id === activeLessonId))) {
        const firstLesson = mapped[0]?.lessons[0];
        if (firstLesson) setActiveLessonId(firstLesson.id);
      }
      setModulesLoading(false);
    };

    fetchModules();
  }, [lang?.code]);

  // Fetch completed lessons scoped by language
  useEffect(() => {
    if (!user || !lang) return;
    supabase
      .from("lesson_completions")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("language", lang.code)
      .then(({ data }) => {
        if (data) setCompletedLessons(new Set(data.map((d) => d.lesson_id)));
      });
  }, [user, lang?.code]);

  const handleLessonComplete = useCallback((lessonId: string, completed: boolean) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (completed) next.add(lessonId);
      else next.delete(lessonId);
      return next;
    });
  }, []);

  if (!lang || !t) return <Navigate to="/" replace />;
  if (loading || modulesLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">...</p></div>;
  if (!user) return <Navigate to={`/${lang.slug}`} replace />;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shrink-0 md:px-6 md:py-5">
        <h1 className="text-base font-bold text-foreground tracking-tight truncate min-w-0 lg:text-2xl">
          {lang.courseName}
        </h1>
        <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-muted-foreground shrink-0">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t.logout}</span>
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 overflow-y-auto pb-14 lg:pb-0">
          <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card border-t border-border text-foreground text-sm font-semibold shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
            >
              <ChevronUp className="h-4 w-4" />
              {t.viewCourseContent}
            </button>
          </div>

          {activeLessonId && (
            <VideoPlayer
              lessonId={activeLessonId}
              onSelectLesson={setActiveLessonId}
              modules={modules}
              translations={t}
              onLessonComplete={handleLessonComplete}
              language={lang.code}
            />
          )}
        </main>

        <aside className={`fixed inset-y-0 right-0 z-40 w-80 transform transition-transform lg:relative lg:translate-x-0 lg:z-auto lg:w-[340px] lg:shrink-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between p-3 border-b border-border bg-card lg:hidden">
            <span className="font-semibold text-sm text-foreground">{t.menu}</span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <CourseSidebar
            activeLessonId={activeLessonId}
            onSelectLesson={(id) => { setActiveLessonId(id); setSidebarOpen(false); }}
            completedLessons={completedLessons}
            modules={modules}
            translations={t}
          />
        </aside>
      </div>
    </div>
  );
};

export default Index;
