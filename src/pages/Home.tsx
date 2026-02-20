import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { languages } from "@/data/languages";
import { supabase } from "@/integrations/supabase/client";

interface MemberArea {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  button_text: string;
}

const Home = () => {
  const navigate = useNavigate();
  const [areas, setAreas] = useState<MemberArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("member_areas")
      .select("id, slug, title, subtitle, icon, button_text")
      .eq("active", true)
      .order("position")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAreas(data as MemberArea[]);
        } else {
          // Fallback: usar array hardcoded se tabela nao existe ou esta vazia
          setAreas(
            languages.map((lang) => ({
              id: lang.code,
              slug: lang.slug,
              title: `${lang.mestraTitle} ${lang.mestraName}`,
              subtitle: lang.courseName,
              icon: lang.flag,
              button_text: lang.accessButton,
            }))
          );
        }
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-3xl space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight">
            Choose Your Path
          </h1>
          <p className="text-muted-foreground text-base">
            Select your language below
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areas.map((area) => (
            <button
              key={area.id}
              onClick={() => navigate(`/${area.slug}`)}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/30 group-hover:border-primary transition-colors">
                <span className="text-2xl font-serif font-bold text-primary">
                  {area.icon || area.title[0]}
                </span>
              </div>
              <div>
                <p className="text-lg font-serif font-bold text-foreground group-hover:text-primary transition-colors">
                  {area.title}
                </p>
                <p className="text-sm text-accent mt-1">
                  {area.subtitle}
                </p>
              </div>
              <span className="text-sm font-semibold text-primary">
                {area.button_text} →
              </span>
            </button>
          ))}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Need support? contact@everwynventures.com
        </p>
      </div>
    </div>
  );
};

export default Home;
