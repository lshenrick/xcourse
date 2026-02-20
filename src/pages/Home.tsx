import { useNavigate } from "react-router-dom";
import { languages } from "@/data/languages";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl space-y-10">
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Access Your Course
          </h1>
          <p className="text-muted-foreground text-base">
            Select your language below
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => navigate(`/${lang.slug}`)}
              className="group flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all duration-200 text-center shadow-sm hover:shadow-md"
            >
              <span className="text-5xl">{lang.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {lang.courseName}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {lang.name}
                </p>
              </div>
              <span className="text-xs font-medium text-primary shrink-0">
                {lang.accessButton} →
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
