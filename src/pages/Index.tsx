import { useState, useEffect, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { CourseSidebar } from "@/components/CourseSidebar";
import { LessonViewer } from "@/components/LessonViewer";
import { WelcomeView } from "@/components/WelcomeView";
import { getLanguageBySlug, uiTranslations } from "@/data/languages";
import type { LanguageCode } from "@/data/languages";
import type { Module } from "@/data/courseData";
import { ChevronUp, X, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface AreaContext {
  slug: string;
  title: string;
  langCode: LanguageCode;
  supportEmail: string;
  customLabels: Record<string, string> | null;
  theme: string;
}

const Index = () => {
  const { langSlug } = useParams<{ langSlug: string }>();
  const { user, loading, signOut } = useAuth();

  const [area, setArea] = useState<AreaContext | null>(null);
  const [areaLoading, setAreaLoading] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [activeLessonId, setActiveLessonId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [userName, setUserName] = useState("");

  // Resolve area context - always check database for settings (theme, etc.)
  useEffect(() => {
    const slug = langSlug || "";
    const lang = getLanguageBySlug(slug);

    supabase
      .from("member_areas")
      .select("slug, title, lang_code, support_email, custom_labels, theme")
      .eq("slug", slug)
      .eq("active", true)
      .single()
      .then(({ data }) => {
        if (data) {
          setArea({
            slug: data.slug,
            title: data.title,
            langCode: (data.lang_code || lang?.code || "pt") as LanguageCode,
            supportEmail: data.support_email || "contact@everwynventures.com",
            customLabels: (data as any).custom_labels || null,
            theme: (data as any).theme || "dark",
          });
        } else if (lang) {
          setArea({
            slug: lang.slug,
            title: `${lang.mestraTitle} ${lang.mestraName}`,
            langCode: lang.code,
            supportEmail: "contact@everwynventures.com",
            customLabels: null,
            theme: "dark",
          });
        }
        setAreaLoading(false);
      });
  }, [langSlug]);

  // Merge default translations with custom labels from admin
  const baseT = area ? uiTranslations[area.langCode] : null;
  const t = baseT && area?.customLabels
    ? { ...baseT, ...area.customLabels }
    : baseT;

  // Fetch user display name
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUserName(data.display_name || data.email.split("@")[0]);
        }
      });
  }, [user]);

  // Fetch modules + lessons from database
  useEffect(() => {
    if (!area) return;
    setModulesLoading(true);

    const fetchModules = async () => {
      const { data: dbModules } = await supabase
        .from("course_modules")
        .select("*")
        .eq("language", area.slug)
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
            type: l.type as "video" | "ebook" | "audio" | undefined,
          })),
      }));

      setModules(mapped);
      setModulesLoading(false);
    };

    fetchModules();
  }, [area?.slug]);

  // Fetch completed lessons
  useEffect(() => {
    if (!user || !area) return;
    supabase
      .from("lesson_completions")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("language", area.slug)
      .then(({ data }) => {
        if (data) setCompletedLessons(new Set(data.map((d) => d.lesson_id)));
      });
  }, [user, area?.slug]);

  const handleLessonComplete = useCallback((lessonId: string, completed: boolean) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (completed) next.add(lessonId);
      else next.delete(lessonId);
      return next;
    });
  }, []);

  const handleSelectLesson = (id: string) => {
    setActiveLessonId(id);
    setSidebarOpen(false);
  };

  if (areaLoading || loading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">...</p></div>;
  if (!area || !t) return <Navigate to="/" replace />;
  if (!user) return <Navigate to={`/${area.slug}`} replace />;
  if (modulesLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground">...</p></div>;

  const isWelcome = !activeLessonId;

  return (
    <div className={`flex flex-col h-screen overflow-hidden bg-background ${area.theme === "light" ? "theme-light" : ""}`}>
      <header className="sticky top-0 z-50 flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card shrink-0 md:px-6 md:py-5">
        <div className="flex items-center gap-3 min-w-0">
          {!isWelcome && (
            <Button variant="ghost" size="sm" onClick={() => setActiveLessonId("")} className="gap-2 text-muted-foreground shrink-0" title={t.backToOverview}>
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{t.backToOverview}</span>
            </Button>
          )}
          <h1 className="text-base font-serif font-bold text-foreground tracking-tight truncate min-w-0 lg:text-2xl">
            {area.title}
          </h1>
        </div>
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
          {!isWelcome && (
            <div className="fixed bottom-0 left-0 right-0 z-20 lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-card border-t border-border text-foreground text-sm font-semibold shadow-[0_-2px_10px_rgba(0,0,0,0.08)]"
              >
                <ChevronUp className="h-4 w-4" />
                {t.viewCourseContent}
              </button>
            </div>
          )}

          {isWelcome ? (
            <WelcomeView
              userName={userName}
              areaTitle={area.title}
              modules={modules}
              completedLessons={completedLessons}
              onSelectLesson={handleSelectLesson}
              translations={t}
            />
          ) : (
            <LessonViewer
              lessonId={activeLessonId}
              onSelectLesson={setActiveLessonId}
              modules={modules}
              translations={t}
              onLessonComplete={handleLessonComplete}
              language={area.langCode}
              supportEmail={area.supportEmail}
            />
          )}
        </main>

        {!isWelcome && (
          <aside className={`fixed inset-y-0 right-0 z-40 w-80 transform transition-transform lg:relative lg:translate-x-0 lg:z-auto lg:w-[340px] lg:shrink-0 ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
            <div className="flex items-center justify-between p-3 border-b border-border bg-card lg:hidden">
              <span className="font-semibold text-sm text-foreground">{t.menu}</span>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <CourseSidebar
              activeLessonId={activeLessonId}
              onSelectLesson={handleSelectLesson}
              completedLessons={completedLessons}
              modules={modules}
              translations={t}
            />
          </aside>
        )}
      </div>
    </div>
  );
};

export default Index;
