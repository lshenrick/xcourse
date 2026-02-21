import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Star } from "lucide-react";
import type { LanguageCode } from "@/data/languages";

interface StarRatingProps {
  lessonId: string;
  label: string;
  language: LanguageCode;
}

export function StarRating({ lessonId, label, language }: StarRatingProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("lesson_ratings")
      .select("rating")
      .eq("lesson_id", lessonId)
      .eq("user_id", user.id)
      .eq("language", language)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setRating(data.rating);
        else setRating(0);
      });
  }, [lessonId, user, language]);

  const handleRate = async (value: number) => {
    if (!user || loading) return;
    setLoading(true);
    setRating(value);

    const { data: existing } = await supabase
      .from("lesson_ratings")
      .select("id")
      .eq("lesson_id", lessonId)
      .eq("user_id", user.id)
      .eq("language", language)
      .maybeSingle();

    if (existing) {
      await supabase.from("lesson_ratings").update({ rating: value }).eq("id", existing.id);
    } else {
      await supabase.from("lesson_ratings").insert({ lesson_id: lessonId, user_id: user.id, rating: value, language });
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-colors disabled:opacity-50"
            disabled={loading}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= (hover || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/40"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
