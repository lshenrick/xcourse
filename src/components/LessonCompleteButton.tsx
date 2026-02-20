import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import type { UITranslations, LanguageCode } from "@/data/languages";

interface LessonCompleteButtonProps {
  lessonId: string;
  translations: UITranslations;
  onToggle?: (lessonId: string, completed: boolean) => void;
  language: LanguageCode;
}

export function LessonCompleteButton({ lessonId, translations: t, onToggle, language }: LessonCompleteButtonProps) {
  const { user } = useAuth();
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("lesson_completions")
      .select("id")
      .eq("lesson_id", lessonId)
      .eq("user_id", user.id)
      .eq("language", language)
      .maybeSingle()
      .then(({ data }) => {
        setCompleted(!!data);
      });
  }, [lessonId, user, language]);

  const handleToggle = async () => {
    if (!user || loading) return;
    setLoading(true);

    if (completed) {
      await supabase
        .from("lesson_completions")
        .delete()
        .eq("lesson_id", lessonId)
        .eq("user_id", user.id)
        .eq("language", language);
      setCompleted(false);
      onToggle?.(lessonId, false);
    } else {
      await supabase.from("lesson_completions").insert({
        lesson_id: lessonId,
        user_id: user.id,
        language,
      });
      setCompleted(true);
      onToggle?.(lessonId, true);
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <Button
      variant={completed ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-2"
    >
      {completed ? (
        <>
          <CheckCircle2 className="h-4 w-4" />
          {t.completed}
        </>
      ) : (
        <>
          <Circle className="h-4 w-4" />
          {t.markComplete}
        </>
      )}
    </Button>
  );
}
